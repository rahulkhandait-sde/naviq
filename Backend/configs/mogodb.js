import mongoose from 'mongoose';
export const connectmongo = ()=>{
    mongoose.connect(process.env.MONGO_URL)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));
}
