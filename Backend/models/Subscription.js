import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: String, // Appwrite user ID
        required: true,
    },
    remainingCredit: {
        type: Number,
        default: 250,
    },
    usedCredit: {
        type: Number,
        default: 0,
    },
    planName: {
        type: String,
        enum: ["Basic", "Paid"],
        default: "Basic",
    },
    planFeatures: {
        type: [String], // Array of features for the plan
        default: ["Feature1", "Feature2"],
    },
    paymenthistory: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Payment",
        default: [],
    }],
    lastPaymentDone: {
        type: Date,
        default: null,
    },
    sendPaymentReminder: {
        type: Boolean,
        default: false
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

// Pre-save hook to check remainingCredit before saving
subscriptionSchema.pre('save', function (next) {
    if (this.remainingCredit < 50) {
        this.sendPaymentReminder = true;
    }
    this.updatedAt = Date.now(); // Update the timestamp
    next();
});

export default mongoose.model("Subscription", subscriptionSchema);