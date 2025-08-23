import { Client, Account } from "node-appwrite";

export const verifySession = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const jwt = authHeader.split(" ")[1];

  const client = new Client()
    .setEndpoint("https://fra.cloud.appwrite.io/v1")
    .setProject("689b5787003b4e752196")
    .setJWT(jwt);

  const account = new Account(client);

  try {
    const user = await account.get();
    req.user = user;
    console.log("User verified:", user);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired session" });
    console.log("user not valid")
  }
};
