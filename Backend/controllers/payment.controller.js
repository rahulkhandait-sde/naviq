import crypto from "crypto";
import { cashfree } from "../configs/cashfreeConfig.js";

function generateOrderId() {
    const uniqueId = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256");
    hash.update(uniqueId);
    return hash.digest("hex").substr(0, 12);
}

export const createOrder = async (req, res) => {
    const { amount,customerId,customerPhone,customerName,customerEmail } = req.body;
    try {
        const orderId = generateOrderId();

        const request = {
            order_amount: amount,
            order_currency: "INR",
            order_id: orderId,
            customer_details: {
                customer_id: customerId,
                customer_phone: customerPhone,
                customer_name: customerName,
                customer_email: customerEmail
            },
            order_meta: {
                return_url: `http://localhost:5173/?order_id=${orderId}`
            }
        };

        const response = await cashfree.PGCreateOrder(request);

        console.log("Order Created:", response.data);
        res.json(response.data);

    } catch (error) {
        console.error("Order Creation Error:", error.response?.data?.message || error.message);
        res.status(500).json({ error: error.response?.data?.message || error.message });
    }
};
