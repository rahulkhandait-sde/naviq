import { Building } from "../../models/Mapmodels/Building.js";
import { Floor } from "../../models/Mapmodels/Floor.js";

export const createFloor = async (req, res) => {
  try {
    let {parentBuildingId} = req.body;

    const floor = await Floor.create({
      floorNumber: req.body.floorNumber,
      mapImage: req.body.mapImage,
      width: req.body.width,
      height: req.body.height,
      nodes:[],
      connections:[]
    });

    await Building.findByIdAndUpdate(
      parentBuildingId,
      { $push: { floors: floor._id } }, 
      { new: true }
    );

    res.status(201).json({ message: "Floor created", floor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get Floor (with population)
export const getFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id)
      .populate("nodes")
      .populate({
        path: "connections",
        populate: [{ path: "from" }, { path: "to" }]
      });

    if (!floor) return res.status(404).json({ message: "Floor not found" });

    res.json(floor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update Floor
export const updateFloor = async (req, res) => {
  try {
    const { id } = req.params;
    let updateData = { ...req.body };

    const updatedFloor = await Floor.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate("nodes")
      .populate({
        path: "connections",
        populate: [{ path: "from" }, { path: "to" }]
      });

    if (!updatedFloor) return res.status(404).json({ message: "Floor not found" });

    res.json({ message: "Floor updated successfully", updatedFloor });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Floor
export const deleteFloor = async (req, res) => {
  try {
    const { id } = req.params;

    const floor = await Floor.findById(id);
    if (!floor) return res.status(404).json({ message: "Floor not found" });

    await floor.deleteOne();

    // When deleting a floor
    await Building.updateMany({ floors: floor._id }, { $pull: { floors: floor._id } });

    res.json({ message: "Floor deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
