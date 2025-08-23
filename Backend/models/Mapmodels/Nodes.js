import mongoose from "mongoose";

const nodeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: {
        type: String,
        enum: [
            'room', 'stair', 'lift', 'door', 'road_turn', 
            'escalator', 'entrance', 'exit', 'other'
        ],
        default: "other"
    },
    description: { type: String, default: "" },
    x: { type: Number, required: true },
    y: { type: Number, required: true }
}, { timestamps: true });

export const Node = mongoose.model("Node", nodeSchema);
