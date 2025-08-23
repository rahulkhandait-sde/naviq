// middleware/upload.js
import multer from "multer";

const storage = multer.memoryStorage(); // store in memory, then upload to cloudinary
export const upload = multer({ storage });


