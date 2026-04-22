import { useState, useRef, useEffect } from "react";
import { useDashboard } from "../context/DashboardContext";
import "./AIAssistant.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://mediverse-0gys.onrender.com/api";

// ─── Helpers
function getTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
}

function formatSize(bytes) {
  const kb = bytes / 1024;
  return kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.round(kb) + " KB";
}

// ─── Suggestion chips
const CHIPS = [
  { label: "🥗 Diet tips",        text: "Give me diet tips for a healthy lifestyle" },
  { label: "🤒 Headache advice",  text: "I have a headache, what should I do?" },
  { label: "😴 Sleep tips",       text: "How to improve my sleep quality?" },
  { label: "❤️ Blood pressure",   text: "What is high blood pressure and how to control it?" },
  { label: "🌡️ Bukhar advice",    text: "Mujhe bukhar hai, kya karun?" },
  { label: "💊 Sir dard",         text: "Sir dard ka gharelu upay batao" },
  { label: "💉 Vaccines",         text: "What vaccines should adults take?" },
  { label: "🧘 Stress relief",    text: "How to reduce stress and anxiety?" },
];

// ─── Message bubble components
function FileBubble({ file, isUser }) {
  return (
    <div className={`ai-fbub ${isUser ? "ai-fbub-user" : ""}`}>
      <div className="ai-ficon">📄</div>
      <div>
        <div className={`ai-fname ${isUser ? "ai-fname-user" : ""}`}>
          {file.name}
        </div>
        <div className={`ai-fsize ${isUser ? "ai-fsize-user" : ""}`}>
          {file.size || formatSize(file.rawSize || 0)}
        </div>
      </div>
    </div>
  );
}

function AiBubble({ text }) {
  return (
    <div
      className="ai-bub ai-bub-ai"
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
}

function UserBubble({ text, file }) {
  return (
    <div className="ai-bub ai-bub-user">
      {text && <div>{text}</div>}
      {file && <FileBubble file={file} isUser />}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="ai-bub ai-bub-ai ai-typing-bub">
      <div className="ai-dot" />
      <div className="ai-dot" />
      <div className="ai-dot" />
    </div>
  );
}

// ─── Main component
export default function AIAssistant() {
  const { user, medications, upcomingAppointments } = useDashboard();

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: `Namaste! 🙏 I'm <strong>Mediverse AI</strong> — your personal health assistant.<div class="ai-section"><div class="ai-sec-title">Main kya kar sakta hoon</div><div class="ai-tip"><div class="ai-tip-dot"></div>Health advice, symptoms &amp; wellness tips</div><div class="ai-tip"><div class="ai-tip-dot"></div>Reports &amp; prescriptions padhna aur samjhana</div><div class="ai-tip"><div class="ai-tip-dot"></div>Medication guidance &amp; reminders</div><div class="ai-tip"><div class="ai-tip-dot"></div>Hindi aur English dono mein baat kar sakta hoon 🇮🇳</div></div><div class="ai-warn">⚠ Emergency mein seedha doctor se milein.</div>`,
      time: getTime(),
    },
  ]);

  const [input, setInput]         = useState("");
  const [attFile, setAttFile]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [errorMsg, setErrorMsg]   = useState("");
  const chatRef                   = useRef();
  const fileInputRef              = useRef();
  const textareaRef               = useRef();

  // Auto scroll to bottom
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // ── Handle file attach
  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Only PDF, JPG, PNG files allowed.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg("File must be under 10 MB.");
      return;
    }
    setAttFile(file);
    setErrorMsg("");
  }

  function removeAttachment() {
    setAttFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Auto resize textarea
  function handleTextareaInput(e) {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 110) + "px";
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Send message
  async function sendMessage() {
    const text = input.trim();
    if (!text && !attFile) return;
    setErrorMsg("");

    // Build user message object
    const userMsg = {
      id: Date.now(),
      role: "user",
      text,
      file: attFile
        ? { name: attFile.name, size: formatSize(attFile.size), rawSize: attFile.size }
        : null,
      time: getTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const fileToSend = attFile;
    removeAttachment();
    setLoading(true);

    try {
      // Build form data — supports both text and file
      const formData = new FormData();
      formData.append("message", text);

      // Pass patient context so AI knows about their medications & appointments
      const medList = Array.isArray(medications) ? medications : [];
      const apptList = Array.isArray(upcomingAppointments) ? upcomingAppointments : [];
      formData.append("patientName", user?.name || "Patient");
      formData.append("context", JSON.stringify({
        medications: medList.map((m) => `${m.name} ${m.dose} - ${m.frequency}`),
        appointments: apptList.map((a) => `${a.doctor} on ${new Date(a.date).toLocaleDateString()}`),
      }));

      // Pass conversation history (last 6 messages for context)
      const history = messages.slice(-6).map((m) => ({
        role: m.role === "ai" ? "model" : "user",
        text: m.text?.replace(/<[^>]+>/g, "") || "", // strip HTML for API
      }));
      formData.append("history", JSON.stringify(history));

      if (fileToSend) formData.append("file", fileToSend);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "AI service error");

      const aiMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: data.reply,
        time: getTime(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment. 🙏",
          time: getTime(),
        },
      ]);
      console.error("AI error:", err);
    } finally {
      setLoading(false);
    }
  }

  // ── Use chip
  function useChip(text) {
    setInput(text);
    if (textareaRef.current) textareaRef.current.focus();
  }

  // ── User initials
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "P";

  return (
    <div className="ai-root">

      {/* Header */}
      <div className="ai-hdr">
        <div className="ai-hdr-left">
          <div className="ai-avatar">M</div>
          <div>
            <div className="ai-hdr-name">Mediverse AI</div>
            <div className="ai-hdr-status">
              <div className="ai-pulse" />
              Online · Health assistant
            </div>
          </div>
        </div>
        <div className="ai-lang-pill">🇮🇳 Hindi &amp; English</div>
      </div>

      {/* Chips */}
      <div className="ai-chips">
        {CHIPS.map((c) => (
          <button key={c.label} className="ai-chip" onClick={() => useChip(c.text)}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="ai-chat" ref={chatRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-row ${msg.role === "ai" ? "ai-row-ai" : "ai-row-me"}`}>
            <div className={`ai-av ${msg.role === "ai" ? "ai-av-ai" : "ai-av-me"}`}>
              {msg.role === "ai" ? "M" : initials}
            </div>
            <div className="ai-msg-wrap">
              {msg.role === "ai" ? (
                <AiBubble text={msg.text} />
              ) : (
                <UserBubble text={msg.text} file={msg.file} />
              )}
              <div className={`ai-ts ${msg.role === "me" ? "ai-ts-right" : ""}`}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="ai-row ai-row-ai">
            <div className="ai-av ai-av-ai">M</div>
            <div className="ai-msg-wrap">
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="ai-inp-area">
        {errorMsg && <div className="ai-error-banner">⚠ {errorMsg}</div>}

        {attFile && (
          <div className="ai-att-prev">
            <span style={{ fontSize: 14 }}>📄</span>
            <div className="ai-att-name">{attFile.name}</div>
            <button className="ai-att-rm" onClick={removeAttachment}>✕ Remove</button>
          </div>
        )}

        <div className="ai-inp-row">
          <button
            className="ai-icon-btn ai-att-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Attach file (PDF, JPG, PNG)"
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: "none" }}
            onChange={handleFileSelect}
          />
          <textarea
            ref={textareaRef}
            className="ai-inp"
            placeholder="Ask anything about your health… / कोई भी स्वास्थ्य प्रश्न पूछें…"
            value={input}
            rows={1}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <button
            className="ai-icon-btn ai-snd-btn"
            onClick={sendMessage}
            disabled={loading || (!input.trim() && !attFile)}
          >
            <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
        <div className="ai-hint">
          Mediverse AI gives health guidance only. Always consult a doctor for medical decisions.
        </div>
      </div>
    </div>
  );
}
