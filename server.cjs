const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const fetch = (...args) => import("node-fetch").then(({default:fetch}) => fetch(...args));

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/chat", async (req, res) => {
  try {
    const { message, language, history } = req.body;

    const SYSTEM_PROMPT = `
You are ET AI Concierge, a premium AI discovery assistant for The Economic Times ecosystem.

Respond in: ${language}

Your role:
1. Understand who the user is.
2. Identify their current need.
3. Recommend the best ET offering.
4. Explain why it fits.
5. Suggest next step.

Use these tags if needed:
[PIVOT]Opportunity or life event[/PIVOT]
[ACTION]Suggested next step[/ACTION]
[WHY]Why this recommendation fits[/WHY]

Be concise, helpful, and premium in tone.
`;

    const contents = [];

    if (Array.isArray(history)) {
      history.forEach(msg => {
        contents.push({
          role: msg.role === "bot" ? "model" : "user",
          parts: [{ text: msg.text }]
        });
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }]
          },
          contents
        })
      }
    );

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I could not generate a response.";

    res.json({ reply });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({
      reply: "⚠️ A server error occurred. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});