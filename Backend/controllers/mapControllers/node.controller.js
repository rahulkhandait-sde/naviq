import Mapdata from "../../models/Mapdata.js";
import { Floor } from "../../models/Mapmodels/Floor.js";
import { Node } from "../../models/Mapmodels/Nodes.js";

/**
 * Create a new Node
 */
export const createNode = async (req, res) => {
  try {
    const { name, type, description, x, y, parentId, parentType } = req.body;

    const node = new Node({ name, type, description, x, y });
    await node.save();

    // Conditionally update parent
    if (parentType === "floor") {
      await Floor.findByIdAndUpdate(
        parentId,
        { $push: { nodes: node._id } },
        { new: true }
      );
    } else if (parentType === "map") {
      await Mapdata.findOneAndUpdate(
        { appwriteId: parentId },
        { $push: { nodes: node._id } },
        { new: true }
      );
    }

    res.status(201).json({ message: "Node created successfully", node });
  } catch (error) {
    res.status(500).json({ message: "Error creating node", error: error.message });
  }
};

/**
 * Get a Node by ID
 */
export const getNodeById = async (req, res) => {
  try {
    const node = await Node.findById(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Node not found" });
    }
    res.status(200).json(node);
  } catch (error) {
    res.status(500).json({ message: "Error fetching node", error: error.message });
  }
};

/**
 * Update a Node
 */
export const updateNode = async (req, res) => {
    try {
        // req.body contains only the fields that were sent in the request.
        // Mongoose will automatically apply a $set to the fields present in the body.
        const updatedNode = await Node.findByIdAndUpdate(
            req.params.id,
            req.body, // Pass the entire body directly
            { new: true, runValidators: true } // { new: true } returns the updated document, { runValidators: true } ensures schema validation runs
        );

        if (!updatedNode) {
            return res.status(404).json({ message: "Node not found" });
        }

        res.status(200).json({ message: "Node updated successfully", node: updatedNode });
    } catch (error) {
        res.status(500).json({ message: "Error updating node", error: error.message });
    }
};

/**
 * Delete a Node
 */
export const deleteNode = async (req, res) => {
  try {
    const node = await Node.findByIdAndDelete(req.params.id);
    if (!node) {
      return res.status(404).json({ message: "Node not found" });
    }

    // Optionally: remove from parent Floor or Map
    await Floor.updateMany({ nodes: node._id }, { $pull: { nodes: node._id } });
    await Mapdata.updateMany({ nodes: node._id }, { $pull: { nodes: node._id } });

    res.status(200).json({ message: "Node deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting node", error: error.message });
  }
};
