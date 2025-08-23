import Mapdata from "../../models/Mapdata.js";
import { Building } from "../../models/Mapmodels/Building.js";
import { Edge } from "../../models/Mapmodels/Edges.js";
import { Node } from "../../models/Mapmodels/Nodes.js";
import Organization from "../../models/Organizationmodel.js";

// Create campus map
export const createMap = async (req, res) => {
  try {
    const { appwriteId, mapImage, width, height } = req.body;

    if (!mapImage) {
      return res.status(400).json({ error: "mapImage URL is required in the request body." });
    }

    const map = await Mapdata.create({
      appwriteId,
      mapImage, 
      width,
      height,
    });

    // Find the organization by appwriteId and push the new map's ID
    await Organization.findOneAndUpdate(
      { appwriteId },
      { $set: { mapdata: map._id } }
    );

    res.status(201).json({ message: "Map created", map });
  } catch (err) {
    console.error("Create map error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get full campus map with population
export const getFullMap = async (req, res) => {
  try {
    const map = await Mapdata.findOne({appwriteId:req.params.id})
      .populate("nodes")
      .populate({
        path: "connections",
        populate: [{ path: "from" }, { path: "to" }],
      })
      .populate({
        path: "buildings",
        populate: {
          path: "floors",
          populate: [
            { path: "nodes" },
            { path: "connections", populate: [{ path: "from" }, { path: "to" }] },
          ],
        },
      });

    if (!map) return res.status(404).json({ message: "Map not found" });
    res.json(map);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Update map (single or multiple fields)
export const updateMap = async (req, res) => {
    try {
        // Get the map ID from the URL parameters
        const { id } = req.params;

        // Get the updated data from the request body
        const updateData = req.body;

        // Find the map by its ID and update it.
        // The { new: true } option ensures that the updated document is returned.
        const updatedMap = await Mapdata.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        // Check if a map with the given ID was found and updated
        if (!updatedMap) {
            return res.status(404).json({ error: "Map not found." });
        }

        res.status(200).json({ message: "Map updated successfully", map: updatedMap });
    } catch (err) {
        console.error("Update map error:", err.message);
        res.status(500).json({ error: "Failed to update map." });
    }
};

// Delete campus map
export const deleteMap = async (req, res) => {
    try {
        // Get the map ID from URL parameters and the organization's appwriteId from the request body.
        // We'll assume the appwriteId is sent in the body of the DELETE request.
        const { id } = req.params;
        const { appwriteId } = req.body;

        // Check if appwriteId is provided.
        if (!appwriteId) {
            return res.status(400).json({ message: "Organization 'appwriteId' is required." });
        }

        // First, find the map to be deleted. This ensures it exists before proceeding.
        const map = await Mapdata.findById(id);
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // --- Step 1: Delete all related data ---
        // These collections (Node, Edge, Building) are assumed to have a relationship with Mapdata.
        // If these models are not linked to Mapdata, this section can be removed.
        // This part of the code is kept from your original request.
        // The _id field in the original request is incorrect. It should use an array of IDs if it exists.
        // If your schema for Mapdata has an array of IDs like 'nodes', 'edges', and 'buildings', this code will work.
        // For example:
        await Node.deleteMany({ _id: { $in: map.nodes } });
        await Edge.deleteMany({ _id: { $in: map.connections } });
        await Building.deleteMany({ _id: { $in: map.buildings } });
        // You'll need to confirm your schema for Mapdata contains these arrays of ObjectIds.

        // --- Step 2: Delete the Mapdata document itself ---
        await map.deleteOne();

        // --- Step 3: Remove the reference from the Organization document ---
        // Find the organization by its appwriteId and remove the mapdata reference.
        // We use $set to set the value to null, effectively clearing the reference.
        const updatedOrganization = await Organization.findOneAndUpdate(
            { appwriteId },
            { $set: { mapdata: null } },
            { new: true } // Return the updated organization document
        );

        // Optional: Check if the organization was found and updated.
        if (!updatedOrganization) {
            console.warn(`Organization with appwriteId ${appwriteId} not found during map deletion.`);
        }

        res.json({ message: "Map and its organization reference deleted successfully" });
    } catch (err) {
        // Handle any errors that occur during the process.
        console.error("Delete map error:", err.message);
        res.status(500).json({ error: err.message });
    }
};