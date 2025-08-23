import mongoose from "mongoose";

const mapSchema = new mongoose.Schema({
    appwriteId: {
        type: String,
        required: true,
        unique: true
    },
    mapImage: {
        type: String, 
        required: true
    },
    width: {
        type: Number,
        required: true
    },
    height: {
        type: Number,
        required: true
    },
    nodes: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Node" }],
        default: []
    },
    connections: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Edge" }],
        default: []
    },
    buildings: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Building" }],
        default: []
    }
}, { timestamps: true });

export default mongoose.model("MapData", mapSchema);
