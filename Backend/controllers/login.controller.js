// // not needed to make in frontend side it should be handled

// // Login.jsx
// import React, { useState } from "react";
// import { Client, Account } from "appwrite";

// const client = new Client()
//   .setEndpoint("https://fra.cloud.appwrite.io/v1") // your endpoint
//   .setProject("689b5787003b4e752196");            // your project ID

// const account = new Account(client);

// const Login = () => {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [jwt, setJWT] = useState("");

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       // Create session
//       await account.createEmailPasswordSession(email, password);

//       // Generate JWT for this logged-in user (short-lived, safe in frontend)
//       const jwtResponse = await account.createJWT();
//       setJWT(jwtResponse.jwt);

//       alert("Login successful! JWT generated.");
//       console.log("JWT:", jwtResponse.jwt);

//     } catch (err) {
//       console.error(err);
//       alert(err.message);
//     }
//   };

//   return (
//     <div>
//       <h2>Login</h2>
//       <form onSubmit={handleLogin}>
//         <input
//           type="email"
//           placeholder="Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           required
//         />
//         <input
//           type="password"
//           placeholder="Password"
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           required
//         />
//         <button type="submit">Login</button>
//       </form>
//       {jwt && (
//         <div>
//           <h4>Your JWT:</h4>
//           <code>{jwt}</code>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;
