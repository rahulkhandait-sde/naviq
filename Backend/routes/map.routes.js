import express from "express";
import { createMap, deleteMap, getFullMap, updateMap } from "../controllers/mapControllers/map.controller.js";
import { createBuilding, getBuilding, updateBuilding, deleteBuilding } from "../controllers/mapControllers/building.controller.js";
import { createFloor, deleteFloor, getFloor, updateFloor } from "../controllers/mapControllers/floor.controller.js";
import { createEdge, deleteEdge, getEdge, updateEdge } from "../controllers/mapControllers/edge.controller.js";
import { createNode, deleteNode, getNodeById, updateNode } from "../controllers/mapControllers/node.controller.js";
import { verifySession } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create new campus map
router.post("/",verifySession, createMap);

// Get full campus map with population
router.get("/:id", getFullMap);

// Update campus map (single/multiple fields or new image)
router.patch("/:id",verifySession,updateMap);

// Delete a map by ID
router.delete("/:id",verifySession, deleteMap);

// Create new building
router.post("/building",verifySession, createBuilding);

// Get building by ID (with population)
router.get("/building/:id",verifySession, getBuilding);

// Update building
router.patch("/building/:id",verifySession, updateBuilding);

// Delete building
router.delete("/building/:id",verifySession, deleteBuilding);

// Create a new floor (with optional image upload)
router.post("/floor",verifySession, createFloor);

// Get a floor by ID (with population)
router.get("/floor/:id",verifySession, getFloor);

// Update a floor (single/multiple fields or new image)
router.patch("/floor/:id",verifySession, updateFloor);

// Delete a floor
router.delete("/floor/:id",verifySession, deleteFloor);

// Create edge
router.post("/edge",verifySession, createEdge);   

// ✅ Get edge by ID
router.get("/edge/:id",verifySession, getEdge);  

// Update edge
router.patch("/edge/:id",verifySession, updateEdge);

// Delete edge
router.delete("/edge/:id",verifySession, deleteEdge);  

// Create a node
router.post("/node",verifySession, createNode);

// Get a node by ID
router.get("/node/:id",verifySession, getNodeById);

// Update a node
router.patch("/node/:id",verifySession, updateNode);

// Delete a node
router.delete("/node/:id",verifySession, deleteNode);


export { router };










