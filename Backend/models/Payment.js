import { default as mongoose } from "mongoose";

const paymentschema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    orderId: {
        type: String, // Your unique order ID
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentId: {
        type: String, // The unique payment ID from the gateway (Cashfree's cf_payment_id)
        required: true,
    },
    paymentGateway: {
        type: String,
        enum: ["Cashfree", "Razorpay", "Stripe", "PayPal"],
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ["SUCCESS", "FAILED", "PENDING"],
        required: true,
    },
    paymentCompletionTime: {
        type: Date,
    },
    paymentMethodDetails: {
        type: Object, // A nested object to store specific payment method details
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.model("Payment", paymentschema);