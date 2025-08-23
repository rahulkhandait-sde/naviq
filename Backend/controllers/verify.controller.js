import dotenv from 'dotenv';
import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
dotenv.config();

export const verifyPayment = async (req, res) => {
    // 1. Receive orderId from the frontend
    const { orderId, customerId } = req.body;
    console.log('Verifying payment for order ID:', orderId);

    // 2. Construct the API call URL and headers using environment variables
    const url = `https://sandbox.cashfree.com/pg/orders/${orderId}/payments`;
    const options = {
        method: 'GET',
        headers: {
            'x-api-version': process.env.CASHFREE_API_VERSION,
            'x-client-id': process.env.CLIENT_ID,
            'x-client-secret': process.env.CLIENT_SECRET,
        },
    };

    try {
        // 3. Make the API call to Cashfree
        const response = await fetch(url, options);
        const data = await response.json();

        console.log('Response from Cashfree:', data);

        // 4. Check if the payment was successful
        if (Array.isArray(data) && data.length > 0 && data[0].payment_status === "SUCCESS") {
            // Payment is successful, log and send the full data
            console.log('Payment successful and verified!');
            console.log('Full payment details:', data[0]);

            //Adding data to mongodb subscription
            const pd = await Payment.create({
                userId: customerId,
                orderId: data[0].order_id,
                amount: data[0].payment_amount,
                paymentId: data[0].cf_payment_id,
                paymentGateway: "Cashfree",
                paymentStatus: data[0].payment_status,
                paymentCompletionTime: new Date(data[0].payment_completion_time),
                paymentMethodDetails: data[0].payment_method_details
            });
            console.log('Payment details saved to database:', pd);
            //Updating subscription details
            console.log("Updating subscription for user:", customerId , typeof customerId);

            const sub = await Subscription.findOneAndUpdate(
                { userId: customerId },
                {
                    $inc: { remainingCredit: data[0].payment_amount },
                    planName: "Paid",
                    planFeatures: ["Feature1", "Feature2"],
                    lastPaymentDone: new Date(data[0].payment_completion_time),
                    nextPaymentDate: new Date(new Date(data[0].payment_completion_time).getTime() + (30 * 24 * 60 * 60 * 1000)),
                    reminderSent: false, // Assuming monthly subscription
                    updatedAt: new Date()
                },
                { new: true } // Return the updated document    
            )

            const subCheck = await Subscription.findOne({ userId: customerId });
            console.log("Found sub:", subCheck);

            console.log('Subscription updated:', sub);
            return res.status(200).json({
                status: "success",
                message: "Payment verified successfully.",
                data: data[0]
            });
        } else if (data.code && data.code === "order_not_found") {
            // Specific error for order not found
            console.error('Error fetching payment details:', data.message);
            return res.status(404).json({
                status: "failed",
                message: "Order Reference Id does not exist."
            });
        }
        else {
            // Payment was not successful
            console.log('Payment status is not SUCCESS:', data);
            return res.status(400).json({
                status: "failed",
                message: "Payment status is not successful.",
                data: data.length > 0 ? data[0] : null
            });
        }
    } catch (error) {
        // Handle any network or API call errors
        console.error('An error occurred during verification:', error);
        return res.status(500).json({
            status: "error",
            message: "An internal server error occurred."
        });
    }
};