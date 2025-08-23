import mongoose from "mongoose";

const edgeSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Node",
        required: true
    },
    direction:{
        type:String,
        enum : ['N-S','S-N','E-W','W-E','NE-SW','SW-NE','NW-SE','SE-NW'],
        required: true
    },
    distance: { type: Number, default: null },
    left_reference_nodes: {
        type: [String],
        default: []
    },
    right_reference_nodes: {
        type: [String],
        default: []
    }
}, { timestamps: true });

export const Edge = mongoose.model("Edge", edgeSchema);
