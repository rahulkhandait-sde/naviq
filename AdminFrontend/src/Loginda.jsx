import { useState, useEffect, useRef } from "react";
import { Client, Account } from "appwrite";

const client = new Client()
  .setEndpoint("https://fra.cloud.appwrite.io/v1")
  .setProject("689b5787003b4e752196");

const account = new Account(client);

const Loginda = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [jwt, setJWT] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  const generateAndScheduleJWT = async () => {
    try {
      const jwtResponse = await account.createJWT();
      setJWT(jwtResponse.jwt);

      const payload = JSON.parse(atob(jwtResponse.jwt.split(".")[1]));
      const expiresAt = payload.exp * 1000;
      console.log("JWT expires at:", new Date(expiresAt).toLocaleString());

      const refreshTime = expiresAt - Date.now() - 60000;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(generateAndScheduleJWT, refreshTime);
    } catch (err) {
      console.error("Failed to refresh JWT:", err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await account.createEmailPasswordSession(email, password);
      const user = await account.get(); // get logged in user info
      console.log("User logged in:", user);

      // Store info in localStorage (so PayButton can use it)
      localStorage.setItem("user", JSON.stringify({
        customerId: user.$id,          // Appwrite userId
        customerEmail: user.email,     // email
        customerName: user.name || "Guest User", // name
        customerPhone: user.phone || "9876543210" // phone
      }));

      await generateAndScheduleJWT();
      setIsLoggedIn(true);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await account.get();
        console.log("Session active for:", user.email);
        localStorage.setItem("user", JSON.stringify({
          customerId: user.$id,
          customerEmail: user.email,
          customerName: user.name || "Guest User",
          customerPhone: user.phone || "9876543210"
        }));
        setIsLoggedIn(true);
        await generateAndScheduleJWT();
      } catch {
        console.log("No active session");
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };
    initAuth();

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
  }, []);

  if (loading) return <p>Checking session...</p>;

  return (
    <div>
      {!isLoggedIn && (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Login</button>
          </form>
        </>
      )}
      {isLoggedIn && <p>✅ Logged in successfully</p>}
    </div>
  );
};

export default Loginda;
