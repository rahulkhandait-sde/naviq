import mongoose from "mongoose";

const floorSchema = new mongoose.Schema({
    floorNumber: { type: Number, required: true },
    mapImage: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    nodes: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Node" }],
        default: []
    },
    connections: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Edge" }],
        default: []
    }
}, { timestamps: true });

export const Floor = mongoose.model("Floor", floorSchema);
