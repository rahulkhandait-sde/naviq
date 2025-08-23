import express from "express";
import { fetchOrgProfile } from "../controllers/fetchOrgProfile.controller.js";
import { verifySession } from "../middlewares/authMiddleware.js";
import { updateOrganizationProfile } from "../controllers/updateOrgData.controller.js";
const router = express.Router();

router.get("/org/orgProfile",verifySession,fetchOrgProfile);
router.put("/org/updateProfile",verifySession,updateOrganizationProfile);
export {router};