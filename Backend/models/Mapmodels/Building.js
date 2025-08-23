import mongoose from "mongoose";

const buildingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    entranceNodes:{
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Node" }],
        default: []
    },
    //Nodes in extrance points
    entranceEdges:{
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Edge" }],
        default: []
    },
    // from entrance edges outer points 
    floors: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Floor" }],
        default: []
    }
}, { timestamps: true });

export const Building = mongoose.model("Building", buildingSchema);
