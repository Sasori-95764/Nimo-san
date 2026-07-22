/**
 * GroupAI — ذكاء اصطناعي يراقب المجموعة
 * يتذكر أسماء الأعضاء، يتابع الأحداث والنقاشات، ويجيب بالعربية كإنسان طبيعي.
 */

const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

// ─── Per-thread memory (resets on bot restart) ─────────────────────────────
const memory = new Map();
// { threadID → { members: {id→name}, messages: [...], events: [...] } }

const MEMORY_FILE = path.join(__dirname, "cache", "groupai_sessions.json");
const MAX_MSGS    = 40;
const MAX_EVENTS  = 30;

// ─── Persist sessions to disk (best-effort) ────────────────────────────────
function saveMemory() {
  try {
    const obj = {};
    for (const [tid, data] of memory.entries()) {
      obj[tid] = {
        members:  data.members,
        messages: data.messages.slice(-20),
        events:   data.events.slice(-15)
      };
    }
    fs.ensureDirSync(path.dirname(MEMORY_FILE));
    fs.writeJsonSync(MEMORY_FILE, obj, { spaces: 2 });
  } catch {}
}

function loadMemory() {
  try {
    if (!fs.existsSync(MEMORY_FILE)) return;
    const obj = fs.readJsonSync(MEMORY_FILE);
    for (const [tid, data] of Object.entries(obj)) {
      memory.set(tid, {
        members:  data.members  || {},
        messages: data.messages || [],
        events:   data.events   || []
      });
    }
  } catch {}
}

loadMemory();

// ─── Helpers ────────────────────────────────────────────────────────────────
function getThread(threadID) {
  if (!memory.has(threadID)) {
    memory.set(threadID, { members: {}, messages: [], events: [] });
  }
  return memory.get(threadID);
}

function addMessage(threadID, name, body, id) {
  const th = getThread(threadID);
  const time = new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  th.messages.push({ name, body: body.slice(0, 300), time, id });
  if (th.messages.length > MAX_MSGS) th.messages.shift();

  // Detect notable events
  const lower = body.toLowerCase();
  const eventKeywords = [
    "يكره","أكره","يحب","غاضب","زعلان","وقح","شتم","مشكلة","خناق","خصام",
    "تشاجر","اتخانق","ضرب","طرد","حذف","أضاف","رحب","ترك","مبروك","تهانينا",
    "إعلان","تنبيه","مهم","عاجل","قرار","اتفق","رفض","وافق"
  ];
  if (eventKeywords.some(k => lower.includes(k))) {
    th.events.push({ who: name, what: body.slice(0, 200), time });
    if (th.events.length > MAX_EVENTS) th.events.shift();
    saveMemory();
  }
}

const BOT_TRIGGERS_AR = [
  "يا بوت","يا ملاك","مرحبا بوت","هلا بوت","بوت ","بوت,","بوت؟",
  "يا ملاك","ملاك ","سؤال","اسأل","اسألك","وين كنتي","ايش صار",
  "ايش حصل","وش صار","وش حصل","اخبار","ايش الأخبار","حدثني"
];

function isBotTriggered(body, botID, replyID) {
  if (replyID === botID) return true;
  const lower = body.toLowerCase();
  return BOT_TRIGGERS_AR.some(t => lower.includes(t));
}

// ─── AI call (Pollinations — free, no API key) ──────────────────────────────
async function askAI(systemPrompt, userMessage) {
  const response = await axios.post(
    "https://text.pollinations.ai/",
    {
      messages: [
        { role: "system",  content: systemPrompt },
        { role: "user",    content: userMessage  }
      ],
      model:    "openai",
      seed:     Math.floor(Math.random() * 9999),
      private:  true
    },
    { timeout: 25000, headers: { "Content-Type": "application/json" } }
  );

  if (typeof response.data === "string") return response.data.trim();
  return (
    response.data?.choices?.[0]?.message?.content ||
    response.data?.response ||
    "معاك 👋 كيف أساعدك؟"
  ).trim();
}

// ─── Fallback replies (offline) ─────────────────────────────────────────────
const FALLBACKS = [
  "هلا والله 😊 كيف أقدر أساعدك؟",
  "مرحبا فيك! ايش تريد؟ 🌸",
  "معاك ملاك 😄 قول ايش عندك",
  "أهلين! بس الإنترنت بطيء معي هلق 😅",
  "لبيك! ايش تسأل؟ 🙂"
];

// ─── Module export ────────────────────────────────────────────────────────
module.exports = {
  config: {
    name:             "groupai",
    aliases:          ["ملاك", "aigroup"],
    version:          "2.0",
    author:           "EryXenX",
    countDown:        0,
    role:             0,
    shortDescription: "ذكاء اصطناعي يراقب المجموعة ويتذكر أسماء الأعضاء والأحداث",
    longDescription:  "بوت ذكي يتابع نقاشات المجموعة، يتذكر الأعضاء، ويجيب بالعربية بشكل طبيعي",
    category:         "AI",
    guide:            "{pn} [سؤالك] — أو فقط اكتب «يا بوت» أو «بوت [سؤال]»"
  },

  // ── Direct command: #groupai <question> ──────────────────────────────────
  onStart: async function ({ api, event, args, message, usersData }) {
    const question = args.join(" ").trim();
    if (!question) {
      return message.reply(
`🤖 أنا ملاك — المساعد الذكي للمجموعة!
━━━━━━━━━━━━━━━━
✦ اكتب «يا بوت [سؤالك]» أو «بوت [سؤالك]»
✦ أو رد على رسالتي بأي وقت
✦ اسألني عن أي شيء أو عن ما حصل في المجموعة 😊`
      );
    }

    const th = getThread(event.threadID);
    const senderName = th.members[event.senderID] || await usersData.getName(event.senderID).catch(() => "عضو");
    th.members[event.senderID] = senderName;

    await _respond(api, event, message, th, senderName, question);
  },

  // ── Background monitor: runs on EVERY message ────────────────────────────
  onChat: async function ({ api, event, message, usersData }) {
    if (!event.body?.trim()) return;

    const { threadID, senderID, body } = event;
    const botID = api.getCurrentUserID();

    // Don't respond to own messages
    if (senderID === botID) return;

    const th = getThread(threadID);

    // Track sender name
    if (!th.members[senderID]) {
      try {
        const name = await usersData.getName(senderID);
        if (name) th.members[senderID] = name;
      } catch {}
    }
    const senderName = th.members[senderID] || "عضو";

    // Store message in memory
    addMessage(threadID, senderName, body, senderID);

    // Check if bot was addressed
    const replyToID = event.messageReply?.senderID;
    if (!isBotTriggered(body, botID, replyToID)) return;

    // Extract the actual question (remove trigger words)
    let question = body
      .replace(/يا بوت|يا ملاك|مرحبا بوت|هلا بوت|ملاك|بوت/gi, "")
      .trim();
    if (!question) question = "مرحبا!";

    await _respond(api, event, message, th, senderName, question);
  }
};

// ─── Core response function ──────────────────────────────────────────────────
async function _respond(api, event, message, th, senderName, question) {
  try {
    // Show typing reaction
    api.setMessageReaction("💭", event.messageID, () => {}, true);

    // Build context for AI
    const memberList = Object.values(th.members).filter(Boolean).join("، ") || "لا يوجد أعضاء بعد";

    const recentConvo = th.messages.slice(-15)
      .map(m => `[${m.time}] ${m.name}: ${m.body}`)
      .join("\n") || "لا يوجد محادثات سابقة";

    const notableEvents = th.events.slice(-8)
      .map(e => `• ${e.time} — ${e.who} قال: "${e.what}"`)
      .join("\n") || "لا توجد أحداث مميزة";

    const systemPrompt =
`أنت "ملاك"، صديق ذكي في مجموعة الدردشة هذه. تتصرف كشخص حقيقي ودود وتتذكر كل ما يجري.

أعضاء المجموعة: ${memberList}

آخر الرسائل في المجموعة:
${recentConvo}

أحداث وملاحظات مميزة:
${notableEvents}

قواعد مهمة:
- أجب بالعربية دائماً بشكل طبيعي وقصير (جملة أو جملتين)
- تذكر الاسم الذي يكلمك الآن هو: ${senderName}
- تصرف كإنسان، لا تقل أبداً أنك AI أو بوت أو نموذج لغوي
- إذا سألك أحد "ايش صار؟" أو "ايش حصل؟" فلخص آخر الأحداث
- إذا سألك عن شخص معين، تحدث عما قاله في المجموعة
- لا تكرر كلامك ولا تكن رسمياً جداً`;

    const reply = await askAI(systemPrompt, question);

    api.setMessageReaction("✅", event.messageID, () => {}, true);
    return message.reply(reply);

  } catch (err) {
    console.error("[GroupAI] Error:", err.message);
    api.setMessageReaction("", event.messageID, () => {}, true);
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return message.reply(fallback);
  }
}
