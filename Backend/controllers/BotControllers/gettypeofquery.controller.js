import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// In-memory hashmap for chat history
const userHistories = new Map();
const userTimeouts = new Map();

/**
 * Determine query type: N (Normal) or P (Path-related).
 */
export const gettypeofquery = async (userId, query) => {
  // Init history if not exist
  if (!userHistories.has(userId)) {
    userHistories.set(userId, []);
  }

  const history = userHistories.get(userId);

  // Add user query
  history.push({ role: "user", parts: [{ text: query }] });

  // Instead of "system" role, we prepend an instruction as a first user message
  const instruction = {
    role: "user",
    parts: [
      {
        text: `
You are a strict classifier.
Given a user query, return ONLY:
- "N" if it is a normal conversational/informational query.
- "P" if it is a navigation/path-finding query (like "how to go", "where is", "I am here I want to go there").
Do not return anything else.
        `,
      },
    ],
  };

  // Ask Gemini
  const result = await model.generateContent({
    contents: [instruction, ...history],
  });

  const responseText = result.response.candidates[0].content.parts[0].text.trim();
  console.log("Gemini reply:", responseText);

  // Store AI response in history
  history.push({ role: "model", parts: [{ text: responseText }] });

  // Reset inactivity timer
  resetUserTimeout(userId);

  // Ensure strict output
  if (responseText.startsWith("P")) return "P";
  return "N";
};

/**
 * Reset user history after 1 hour inactivity
 */
function resetUserTimeout(userId) {
  if (userTimeouts.has(userId)) {
    clearTimeout(userTimeouts.get(userId));
  }
  const timeout = setTimeout(() => {
    userHistories.delete(userId);
    userTimeouts.delete(userId);
    console.log(`History cleared for user ${userId} due to inactivity`);
  }, 60 * 60 * 1000); // 1 hour

  userTimeouts.set(userId, timeout);
}

// Test

console.log("this fucntion is called")