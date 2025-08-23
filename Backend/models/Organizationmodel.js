import mongoose from "mongoose";

const Organizationschema = new mongoose.Schema({
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
    typeofuser: {
        type: String,
        enum: ['EducationalInstitute', 'Hospital', 'TuristSpot', 'OfiiceBuilding'],
        default: 'EducationalInstitute'
    },
    subscription: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Subscription", 
        default: null
    },
    mapdata:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mapdata", 
        default: null
    },
    visitors:[{
        type:mongoose.Schema.Types.ObjectId, 
        ref: "visitors",
        default: null
    }]
})

const Organization = mongoose.model("Organization", Organizationschema);
export default Organization;
