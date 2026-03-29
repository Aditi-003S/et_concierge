const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

// ===============================
// IMPORTANT: Put your Gemini API key here
// ===============================
const GEMINI_API_KEY = "AIzaSyD7SBRMpAqYHnEQpYCULBph-31guFsee4U";
const MODEL = "gemini-3.1-flash-lite-preview";

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files
app.use(express.static(__dirname));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Chat API route
app.post("/chat", async (req, res) => {
  try {
    const { message, history, language, persona } = req.body;

    const systemPrompt = `
You are ET AI Concierge, a premium AI assistant for The Economic Times ecosystem.

Respond in: ${language || "English"}

User Persona: ${persona || "General"}

Your job:
1. Understand the user’s goal
2. Recommend the best ET service
3. Explain why it fits
4. Suggest the next action

Be helpful, premium, concise, and conversational.

If the user speaks Hindi, reply fully in Hindi.
If the user speaks English, reply in English.
`;

    const payload = {
      contents: [
        ...(history || []),
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
      system_instruction: {
        parts: [{ text: systemPrompt }]
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    if (data.error) {
      return res.status(500).json({
        reply: `⚠️ API Error: ${data.error.message}`
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      reply: "⚠️ Server error. Please try again."
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});