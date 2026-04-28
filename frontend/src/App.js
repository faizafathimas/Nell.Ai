import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown"; // ✅ NEW
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/chats");
      setChatList(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const startNewChat = () => {
    setChat([]);
    setMessage("");
    setChatId(null);
  };

  const loadChat = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/chat/${id}`);
      setChat(res.data.messages);
      setChatId(id);
    } catch (err) {
      console.log(err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = { sender: "user", text: message };
    setChat(prev => [...prev, userMsg]);
    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post("http://localhost:5000/chat", {
        message: userMsg.text,
        ...(chatId && { chatId })
      });

      const botMsg = { sender: "bot", text: res.data.reply };
      setChat(prev => [...prev, botMsg]);

      setChatId(res.data.chatId);
      fetchChats();

    } catch (err) {
      setChat(prev => [
        ...prev,
        { sender: "bot", text: "⚠️ NellAi is having trouble connecting." }
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="layout">

      {/* Sidebar */}
      <div className="sidebar">

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "18px"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "6px",
            borderRadius: "10px"
          }}>
            <img src="/logo.png" alt="NellAi Logo" style={{ width: "48px" }} />
          </div>

          <h2 style={{ margin: 0 }}>NellAi</h2>
        </div>

        <button className="new-chat" onClick={startNewChat}>
          + New Chat
        </button>

        <p className="tagline">Your AI Farming Companion 🌾</p>

        <div className="chat-history">
          {chatList.map((c) => (
            <div
              key={c._id}
              className="chat-item"
              onClick={() => loadChat(c._id)}
            >
              {c.title}
            </div>
          ))}
        </div>

      </div>

      {/* Main */}
      <div className="main">

        <div className="chat-area">

          {chat.length === 0 && !loading && (
            <div className="welcome">
              <img src="/logo.png" alt="NellAi Logo" className="welcome-logo" />
              <h2>Welcome to NellAi 🌾</h2>
              <p>Ask about crops, soil health, pests, irrigation, fertilizers.</p>
            </div>
          )}

          {/* 🔥 UPDATED MESSAGE DISPLAY */}
          {chat.map((msg, i) => (
            <div key={i} className={`message-row ${msg.sender}`}>

              {msg.sender === "bot" && (
                <div className="avatar">🌿</div>
              )}

              <div className={`message ${msg.sender}`}>
                <div className="bubble">
                  {msg.sender === "bot" ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown> // ✅ HERE
                  ) : (
                    msg.text
                  )}
                </div>
              </div>

              {msg.sender === "user" && (
                <div className="avatar">🧑‍🌾</div>
              )}

            </div>
          ))}

          {loading && (
            <div className="message-row bot">
              <div className="avatar">🌿</div>
              <div className="message bot">
                <div className="bubble">
                  🌱 Checking crop health...
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="input-bar">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask NellAi about crops, soil, pests..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>🌾 Send</button>
        </div>

      </div>
    </div>
  );
}

export default App;