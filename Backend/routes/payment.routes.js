import express from "express";
import { createOrder } from "../controllers/payment.controller.js";
import { verifyPayment } from "../controllers/verify.controller.js";
const router = express.Router();

router.post("/payment",createOrder);
router.post("/verify",verifyPayment);

export {router};