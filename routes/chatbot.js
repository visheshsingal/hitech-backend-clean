const express = require("express");
const router = express.Router();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

router.post("/chat", async (req, res) => {
  try {
    const { messages, systemPrompt } = req.body;

    // Prepare messages for OpenAI format
    const openaiMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or 'gpt-4' if you have access
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
    });

    res.json({
      content: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Chatbot API Error:", error);
    res.status(500).json({
      error: "Failed to get response",
      message: error.message,
    });
  }
});

module.exports = router;
