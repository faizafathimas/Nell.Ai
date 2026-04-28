const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();// DB
require("./database");
const Chat = require("./models/Chat");

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Check API key

/* =========================
   🔥 TEST API ROUTE
========================= */
app.get("/test-ai", async (req, res) => {
  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [{ role: "user", content: "Say hello" }]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.send(response.data.choices[0].message.content);
  } catch (err) {
    console.log("❌ TEST ERROR:", err.response?.data || err.message);
    res.send("API test failed");
  }
});

/* =========================
   💬 CHAT API (FINAL HYBRID)
========================= */
app.post("/chat", async (req, res) => {
  try {
    const { message, chatId } = req.body;

    let localReply = "";
    let finalReply = "AI not available";

    // 🔹 STEP 1: LOCAL MODEL
    try {
      const localRes = await axios.post("http://127.0.0.1:8000/chat", {
        message
      });

      localReply = localRes.data.reply;
      console.log("🧠 Local model:", localReply);

    } catch (err) {
      console.log("⚠️ Local model failed");
    }

    // 🔹 STEP 2: OPENROUTER (MAIN ANSWER)
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "meta-llama/llama-3-8b-instruct",
          messages: [
            {
              role: "system",
              content: `
You are an expert agricultural scientist.

Answer the user in a natural, conversational way like ChatGPT.

Guidelines:
- Do NOT use fixed sections like "Answer:" or "Explanation:" every time
- You MAY use subheadings when helpful (like Causes, Treatment)
- Do NOT force the same format for every answer
- Keep responses clear, structured, and easy to read
- Use short paragraphs
- Use bullet points only when needed

- Give practical farming advice naturally
- Be accurate and specific (mention real diseases, causes, treatments)

- Do NOT mention previous answers
- Do NOT behave like a teacher correcting answers
- Do NOT use markdown symbols like **

Adapt your format based on the question.
`
            },
            {
              role: "user",
              content: `
User Question:
${message}

Reference Answer:
${localReply}
`
            }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      finalReply = response.data.choices[0].message.content.trim();

    } catch (apiError) {
      console.log("❌ API ERROR:", apiError.response?.data || apiError.message);
      finalReply = localReply || "AI service failed. Please try again.";
    }

    // 🔹 SAVE CHAT
    let chat = null;

    if (chatId) {
      chat = await Chat.findById(chatId);
    }

    if (!chat || !chat.messages || chat.messages.length === 0) {
      chat = await Chat.create({
        title: message.slice(0, 30),
        messages: [
          { sender: "user", text: message },
          { sender: "bot", text: finalReply }
        ]
      });
    } else {
      chat.messages.push({ sender: "user", text: message });
      chat.messages.push({ sender: "bot", text: finalReply });
      await chat.save();
    }

    res.json({
      reply: finalReply,
      chatId: chat._id
    });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    res.status(500).json({ reply: "Server error" });
  }
});

/* =========================
   📂 GET ALL CHATS
========================= */
app.get("/chats", async (req, res) => {
  try {
    const chats = await Chat.find().sort({ createdAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

/* =========================
   📄 GET SINGLE CHAT
========================= */
app.get("/chat/:id", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

/* =========================
   🚀 START SERVER
========================= */
app.listen(5000, () => {
  console.log("🚀 Backend running on http://localhost:5000");
});