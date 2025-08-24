
import axios from 'axios';
import { load } from '@cashfreepayments/cashfree-js';

function Paybutton() {
  let cashfree;

  // Initialize the Cashfree SDK once when the component mounts
  const insitialzeSDK = async function () {
    cashfree = await load({
      mode: 'sandbox',
    });
  };

  insitialzeSDK();

  // getSessionId function is modified to return both the sessionId and orderId
  const getSessionId = async () => {
  try {
    // get user data from localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Please login first!");
      return null;
    }

    // send details in POST body
    let res = await axios.post("/rurl/api/payment", {
      amount: 10000,
      customerId: user.$id,
      customerPhone: "+917585814061",
      customerName: user.name,
      customerEmail: user.email,
    });

    if (res.data && res.data.payment_session_id) {
      console.log(res.data);
      const orderId = res.data.order_id;
      return {
        paymentSessionId: res.data.payment_session_id,
        orderId,
        customerId: user.$id,
      };
    }
  } catch (error) {
    console.log(error);
  }
};


  // The verifyPayment function now accepts the orderId as an argument
  const verifyPayment = async (orderIdToVerify, customerId) => {
  try {
    console.log("verifying payment for order id:", orderIdToVerify);
    let res = await axios.post("/rurl/api/verify", {
      orderId: orderIdToVerify,
      customerId: customerId, // ✅ send customerId also
    });

    if (res && res.data) {
      alert("✅ Payment verified");
    }
  } catch (error) {
    console.log(error);
  }
};


  const handleClick = async (e) => {
    e.preventDefault();
    try {
      // Get both paymentSessionId and orderId from the API call
      let sessionData = await getSessionId();

      // Ensure session data was retrieved successfully
      if (!sessionData) {
        console.log('Failed to get session data.');
        return;
      }

      let checkoutOptions = {
        paymentSessionId: sessionData.paymentSessionId,
        redirectTarget: '_modal',
      };

      // Wait for the checkout to complete, then call verifyPayment
      cashfree.checkout(checkoutOptions).then(() => {
  console.log("payment initialized and completed by user");
  verifyPayment(sessionData.orderId, sessionData.customerId);
});

    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <div className="card">
        <button className="text-white font-semibold" onClick={handleClick}>Pay now</button>
      </div>
    </>
  );
}

export default Paybutton;
