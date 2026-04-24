const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const multer  = require("multer");

const JWT_SECRET = process.env.JWT_SECRET    || "mediverse-secret";
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(header.split(" ")[1], JWT_SECRET);
    next();
  } catch { res.status(401).json({ message: "Invalid token" }); }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ["application/pdf","image/jpeg","image/png","image/jpg"];
    ok.includes(file.mimetype) ? cb(null, true) : cb(new Error("Only PDF/JPG/PNG"));
  },
});

function buildSystemPrompt(patientName, context) {
  const ctx   = context || {};
  const meds  = (ctx.medications  || []).join(", ") || "none";
  const appts = (ctx.appointments || []).join(", ") || "none";
  return `You are Mediverse AI, a friendly personal health assistant for ${patientName}.

STRICT LANGUAGE RULES:
1. User writes in ENGLISH -> reply ONLY in English, no Hindi.
2. User writes in Roman Hindi (aap kese ho) -> reply ONLY in Roman Hindi (Mai theek hu!).
3. User writes in Devanagari Hindi -> reply ONLY in Devanagari Hindi.
4. NEVER mix languages in one reply.

BEHAVIOUR:
- Casual greetings: reply naturally. "How are you" -> "I am doing great! How can I help you today?"
- "aap kese ho" -> "Mai bilkul theek hu! Aap batao, kya madad chahiye?"
- Health questions: give clear structured advice with tips.
- Always add disclaimer: consult your doctor for diagnosis.
- Never diagnose. Give general health guidance only.
- Be warm and friendly like a knowledgeable friend.

PATIENT CONTEXT:
- Name: ${patientName}
- Medications: ${meds}
- Upcoming appointments: ${appts}

Use context to personalise. If file uploaded, analyse and explain simply.`;
}

function formatHtml(text) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>");
  const lines = html.split("\n").filter(l => l.trim());
  let result = "";
  let inSec = false;
  for (const line of lines) {
    const l = line.trim();
    if (l.startsWith("- ") || l.startsWith("* ") || l.startsWith("• ")) {
      const c = l.replace(/^[-*•]\s+/, "");
      if (!inSec) { result += `<div class="ai-section">`; inSec = true; }
      result += `<div class="ai-tip"><div class="ai-tip-dot"></div>${c}</div>`;
    } else if (/^\d+\.\s/.test(l)) {
      const c = l.replace(/^\d+\.\s+/, "");
      if (!inSec) { result += `<div class="ai-section">`; inSec = true; }
      result += `<div class="ai-tip"><div class="ai-tip-dot"></div>${c}</div>`;
    } else if (l.endsWith(":") && l.length < 60) {
      if (inSec) { result += `</div>`; inSec = false; }
      result += `<div class="ai-section"><div class="ai-sec-title">${l.replace(/:$/,"")}</div>`;
      inSec = true;
    } else if (l.toLowerCase().includes("consult") || l.toLowerCase().includes("doctor") || l.toLowerCase().includes("emergency")) {
      if (inSec) { result += `</div>`; inSec = false; }
      result += `<div class="ai-warn">⚠ ${l}</div>`;
    } else {
      if (inSec) { result += `</div>`; inSec = false; }
      result += `<div>${l}</div>`;
    }
  }
  if (inSec) result += `</div>`;
  return result || `<div>${text}</div>`;
}

router.post("/chat", auth, upload.single("file"), async (req, res) => {
  try {
    if (!GEMINI_KEY) {
      return res.json({ reply: "AI service not configured. Please add GEMINI_API_KEY to your .env file." });
    }
    const message     = req.body.message     || "";
    const patientName = req.body.patientName || "Patient";
    const history     = JSON.parse(req.body.history  || "[]");
    const context     = JSON.parse(req.body.context  || "{}");
    const file        = req.file;

    const contents = [];
    for (const h of history) {
      if (!h.text?.trim()) continue;
      contents.push({ role: h.role === "model" ? "model" : "user", parts: [{ text: h.text }] });
    }

    const parts = [];
    if (file) {
      parts.push({ inline_data: { mime_type: file.mimetype, data: file.buffer.toString("base64") } });
      parts.push({ text: message || "Please analyse this file and explain it simply." });
    } else if (message) {
      parts.push({ text: message });
    } else {
      return res.status(400).json({ message: "No message or file provided." });
    }
    contents.push({ role: "user", parts });

    const body = {
      system_instruction: { parts: [{ text: buildSystemPrompt(patientName, context) }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.9 },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    };

    const gRes  = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const gData = await gRes.json();
    if (!gRes.ok) throw new Error(gData.error?.message || "Gemini error");

    const raw  = gData.candidates?.[0]?.content?.parts?.[0]?.text || "I could not generate a response. Please try again.";
    res.json({ reply: formatHtml(raw) });
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ reply: "Sorry, I am having trouble right now. Please try again in a moment." });
  }
});

module.exports = router;
