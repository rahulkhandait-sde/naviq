import Mapdata from "../../models/Mapdata.js";
import { Edge } from "../../models/Mapmodels/Edges.js";
import { Floor } from "../../models/Mapmodels/Floor.js";
import { Node } from "../../models/Mapmodels/Nodes.js";

/**
 * Create a new Edge
 */

export const createEdge = async (req, res) => {
    try {
        const { from, to, direction, left_reference_nodes, right_reference_nodes, parentType, parentId } = req.body;

        // Step 1: Find the two nodes by their IDs
        const [from_node, to_node] = await Promise.all([
            Node.findById(from),
            Node.findById(to)
        ]);

        if (!from_node || !to_node) {
            return res.status(404).json({ message: "One or both nodes not found." });
        }

        // Step 2: Calculate the distance using the distance formula
        const Calculated_distance = Math.sqrt(
            Math.pow(to_node.x - from_node.x, 2) + Math.pow(to_node.y - from_node.y, 2)
        );

        // Step 3: Create the edge with the calculated distance
        const edge = new Edge({
            from,
            to,
            direction,
            distance: Calculated_distance,
            left_reference_nodes,
            right_reference_nodes,
        });

        await edge.save();

        // 4. Conditionally update parent
        if (parentType === "floor") {
            await Floor.findByIdAndUpdate(
                parentId,
                { $push: { connections: edge._id } }, 
                { new: true }
            );
        } else if (parentType === "map") {
            await Mapdata.findOneAndUpdate(
                { appwriteId: parentId },
                { $push: { connections: edge._id } }, 
                { new: true }
            );
        }

        res.status(201).json({
            success: true,
            message: "Edge created successfully",
            data: edge,
        });
    } catch (error) {
        console.error("Error creating edge:", error);
        res.status(500).json({ success: false, message: "Failed to create edge" });
    }
};

// ✅ Get single Edge by ID
export const getEdge = async (req, res) => {
  try {
    console.log("It is called")
    const edge = await Edge.findById(req.params.id)
      .populate("from", "to") // populate node refs
      .exec();

    if (!edge) {
      return res.status(404).json({ message: "Edge not found" });
    }
    res.status(200).json(edge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update an Edge by ID
 */
export const updateEdge = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedEdge = await Edge.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("from")
      .populate("to");

    if (!updatedEdge) {
      return res.status(404).json({ success: false, message: "Edge not found" });
    }
    res.status(200).json({
      success: true,
      message: "Edge updated successfully",
      data: updatedEdge,
    });
  } catch (error) {
    console.error("Error updating edge:", error);
    res.status(500).json({ success: false, message: "Failed to update edge" });
  }
};

/**
 * Delete an Edge by ID
 */
export const deleteEdge = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEdge = await Edge.findByIdAndDelete(id);

    if (!deletedEdge) {
      return res.status(404).json({ success: false, message: "Edge not found" });
    }
    // When deleting an edge
    await Floor.updateMany({ connections: deletedEdge._id }, { $pull: { connections: deletedEdge._id } });
    await Mapdata.updateMany({ connections: deletedEdge._id }, { $pull: { connections: deletedEdge._id } });
    
    res.status(200).json({
      success: true,
      message: "Edge deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting edge:", error);
    res.status(500).json({ success: false, message: "Failed to delete edge" });
  }
};
