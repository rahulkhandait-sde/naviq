import { GoogleGenerativeAI } from "@google/generative-ai";

// Load from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const instructiongenerator = async (prompt, contextData = "") => {
  try {
    if (!prompt || prompt.trim() === "") {
      throw new Error("Prompt is required.");
    }

    // Build conversation-like input
    const messages = [
      { role: "user", parts: [{ text: prompt }] }
    ];

    if (contextData && contextData.trim() !== "") {
      messages.push({
        role: "user", 
        parts: [{ text: `Here is some context:\n${contextData}` }]
      });
    }

    // Select model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Generate response
    const result = await model.generateContent({
      contents: messages,
    });

    // Extract text response
    const instructions =
      result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response generated.";

    return instructions;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(error.message || "Failed to generate instructions.");
  }
};
