import Mapdata from "../../models/Mapdata.js";
import { Building } from "../../models/Mapmodels/Building.js";
import { Floor } from "../../models/Mapmodels/Floor.js";

// ✅ Create Building
export const createBuilding = async (req, res) => {
  const { appwriteId, name } = req.body;
  try {
    const building = await Building.create({
      name
    });
    await Mapdata.findOneAndUpdate(
      { appwriteId },
      { $push: { buildings: building._id } }
    );
    res.status(201).json({ message: "Building created", building });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Get Building (with population)
export const getBuilding = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id)
      .populate("entranceNodes")
      .populate("entranceEdges")
      .populate({
        path: "floors",
        populate: [
          { path: "nodes" },
          { path: "connections", populate: [{ path: "from" }, { path: "to" }] }
        ]
      });

    if (!building) return res.status(404).json({ message: "Building not found" });

    res.json(building);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Update Building
export const updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = { ...req.body };

    const updatedBuilding = await Building.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("entranceNodes")
      .populate("entranceEdges")
      .populate({
        path: "floors",
        populate: [
          { path: "nodes" },
          { path: "connections", populate: [{ path: "from" }, { path: "to" }] }
        ]
      });

    if (!updatedBuilding)
      return res.status(404).json({ message: "Building not found" });

    res.json({ message: "Building updated successfully", updatedBuilding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Delete Building
export const deleteBuilding = async (req, res) => {
  try {
        // Get the building ID from the URL parameters
        const { id } = req.params;

        // We assume the organization's appwriteId is sent in the request body
        const { appwriteId } = req.body;

        // Check if appwriteId is provided
        if (!appwriteId) {
            return res.status(400).json({ message: "Organization 'appwriteId' is required." });
        }

        // First, find the building to ensure it exists before proceeding.
        const building = await Building.findById(id);
        if (!building) {
            return res.status(404).json({ message: "Building not found" });
        }

        // --- Step 1: Delete all associated floors ---
        // This line assumes your Building schema has a 'floors' array of ObjectIds.
        await Floor.deleteMany({ _id: { $in: building.floors } });

        // --- Step 2: Delete the Building document itself ---
        await building.deleteOne();

        // --- Step 3: Remove the reference from the Mapdata document ---
        // Find the Mapdata document by its appwriteId.
        // Use the $pull operator to remove the building's ID from the 'buildings' array.
        // The $pull operator is designed for removing an item from an array.
        const updatedMap = await Mapdata.findOneAndUpdate(
            { appwriteId },
            { $pull: { buildings: building._id } },
            { new: true } // Return the updated document
        );

        // Optional: Check if the map was found and updated.
        if (!updatedMap) {
            console.warn(`Map with appwriteId ${appwriteId} not found during building deletion.`);
        }

        res.json({ message: "Building, floors, and map reference deleted successfully" });
    } catch (err) {
        // Handle any errors that occur during the process.
        console.error("Delete building error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
