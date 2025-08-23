import mongoose from "mongoose";

const visitorschema = new mongoose.Schema({
    appwriteId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    
    visitedPlaces:[{
        type:mongoose.Schema.Types.ObjectId, 
        ref: "visitors",
        default: null
    }]
})

const Visitor = mongoose.model("Visitor", visitorschema);
export default Visitor;
