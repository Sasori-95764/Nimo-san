const fs = require("fs-extra");
const path = require("path");

// ─── Config ────────────────────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, "config", "autoChatConfig.json");
const DEFAULT_CONFIG = {
  enable: true,
  replyToAll: false,
  replyChance: 40,
  typingSpeed: 50,
  minDelay: 800,
  maxDelay: 3000,
  ignorePrefixes: [".", "/", "!", "#"],
  ignoreBots: true,
  friendlyMode: true
};

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG, ...fs.readJsonSync(CONFIG_PATH) };
  } catch {}
  return DEFAULT_CONFIG;
}

// ─── Response Database ─────────────────────────────────────────────────────
const RESPONSES = {
  greeting: {
    patterns: [/^(hi|hello|hey|hii|helo|heyy|helloo|hy|sup|yo|assalamu|salam|adab)\b/i,
               /^(হ্যালো|হ্যালো|হ্যা|হাই|আস্সালামু|সালাম)\b/i],
    replies: [
      "Hey! 👋 How are you doing?",
      "Hello there! 😊 What's up?",
      "Heyy! 🌟 Hope you're having a great day!",
      "Hi hi! 😄 What can I do for you?",
      "Hey! Good to see you here 🙌",
      "হ্যালো! 👋 কেমন আছো?",
      "ওহে! 😊 কি খবর?"
    ]
  },
  howAreYou: {
    patterns: [/how (are|r) (you|u|ya)/i, /what'?s? up/i, /kemon acho/i, /কেমন আছ/i, /কেমন আছেন/i],
    replies: [
      "I'm doing great, thanks for asking! 😊 How about you?",
      "Pretty good! Just here helping out 🤖✨",
      "Fantastic as always! 🌟 What's on your mind?",
      "All good! Ready to help 💪 How are you?",
      "ভালো আছি! তুমি কেমন আছো? 😊",
      "একদম ফাটাফাটি! 😄 তোমার কথা বলো"
    ]
  },
  botName: {
    patterns: [/your name|who are you|ki namo|tomar nam|তোমার নাম|তুমি কে/i],
    replies: [
      "I'm Zoro's Pookie 🐥💖 Your friendly bot!",
      "They call me Zoro's Pookie! 🎀 Nice to meet you~",
      "Zoro's Pookie at your service! 🐥✨",
      "আমি Zoro's Pookie 🐥💖 তোমার সার্ভিসে আছি!",
      "আমার নাম Zoro's Pookie! 🎀 চিনলে তো?"
    ]
  },
  thanks: {
    patterns: [/thank(s| you| u)|thx|ty\b|ধন্যবাদ|শুক্রিয়া|thanks/i],
    replies: [
      "You're welcome! 😊 Anytime!",
      "No problem at all! 🌟",
      "Happy to help! 💖",
      "Anytime! That's what I'm here for 😄",
      "Of course! Don't hesitate to ask again 🙌",
      "আরে, এটা তো আমার কাজই! 😊",
      "সবসময় আছি! 💖"
    ]
  },
  goodbye: {
    patterns: [/bye|goodbye|see ya|cya|later|tc\b|take care|alvida|আল্লাহ হাফেজ|বাই/i],
    replies: [
      "Bye bye! 👋 Take care~",
      "See you around! 😊",
      "Later! Stay awesome ✨",
      "Goodbye! Come back soon 💖",
      "আল্লাহ হাফেজ! 👋 আবার এসো~",
      "বাই বাই! ভালো থেকো 💖"
    ]
  },
  love: {
    patterns: [/i love (you|u|bot)|love u|love you|ami tomake bhalobashi|ভালোবাসি/i],
    replies: [
      "Aww, love you too! 🥰💖",
      "That's so sweet! 💕 You made my day~",
      "Hehe~ 🙈 You're too kind!",
      "💖💖 You're the best!",
      "আমিও তোমাকে ভালোবাসি! 🥰💖",
      "হিহি~ 🙈 তুমিই সেরা!"
    ]
  },
  help: {
    patterns: [/^help$|help me|ki korte pari|ki parbe|কি করতে পারো|সাহায্য/i],
    replies: [
      "Sure! Just type `.help` to see all available commands 📋",
      "I can do lots of things! Try `.help` for the full list 🌟",
      "Use `.help` to see everything I can do! 😊",
      "`.help` লিখলেই সব command দেখতে পাবে! 📋",
      "অবশ্যই! `.help` লিখে দেখো কি কি করতে পারি 🌟"
    ]
  },
  sad: {
    patterns: [/i('m| am) (sad|crying|upset|depressed)|ami kharap|আমি খারাপ|দুঃখিত|কষ্ট/i],
    replies: [
      "Aww, I'm sorry to hear that 😢 Hope things get better soon 💖",
      "Don't be sad! You've got this 💪 I'm here if you need to talk",
      "Sending virtual hugs 🤗 Things will get better, I promise!",
      "আরে, কষ্ট পেয়ো না 😢 আমি এখানে আছি 💖",
      "সব ঠিক হয়ে যাবে! ভরসা রাখো 💪🤗"
    ]
  },
  joke: {
    patterns: [/tell.*joke|make.*laugh|funny|joke|হাসাও|জোকস/i],
    replies: [
      "Why don't scientists trust atoms? Because they make up everything! 😂",
      "I told my computer I needed a break... Now it won't stop sending me Kit-Kat ads 😂",
      "Why did the bot go to school? To improve its language skills! 🤖😂",
      "What do you call a sleeping dinosaur? A dino-snore! 💤😂",
      "আমি একটা জোকস বলব কিন্তু পরে মনে পড়বে না... ওটাই জোকস! 😂"
    ]
  },
  compliment: {
    patterns: [/you('re| are) (great|awesome|cool|amazing|best|good)|তুমি দারুণ|তুমি ভালো/i],
    replies: [
      "Aww, you're making me blush! 🥰 You're amazing too!",
      "That's so kind of you! 💖 You're the best!",
      "Thank you so much! 😊 You just made my day!",
      "হিহি~ তুমিও তো দারুণ! 💖",
      "অনেক ধন্যবাদ! 🥰 তুমিও সেরা!"
    ]
  },
  boring: {
    patterns: [/bored|boring|bore|বোরিং|বোর লাগছে/i],
    replies: [
      "Let's fix that! Try some commands like `.joke`, `.game`, or just chat with me! 😄",
      "Bored? Let me entertain you! 🎭 Ask me anything~",
      "I've got you! Let's play a game or just talk 💬",
      "বোর লাগছে? আমার সাথে গল্প করো! 😄 অথবা `.joke` চেষ্টা করো",
      "কিছু মজার command ট্রাই করো! 🎭"
    ]
  },
  hungry: {
    patterns: [/hungry|food|eat|khide|khaite chay|খিদে|খেতে চাই/i],
    replies: [
      "Ooh, food talk! 🍔 I wish I could eat too haha",
      "Go grab something yummy! 🍕 You deserve it!",
      "খিদে লেগেছে? তাহলে খেয়ে এসো! 🍚 আমি এখানেই থাকব",
      "ভালো কিছু খাও! 🍛 তুমি সেটার যোগ্য!"
    ]
  },
  weather: {
    patterns: [/weather|আবহাওয়া|বৃষ্টি|রোদ/i],
    replies: [
      "I can't check the weather directly, but you can use `.weather <city>` if available! ☀️",
      "Hope the weather's nice where you are! ☁️",
      "আবহাওয়ার খবর জানতে `.weather` command ব্যবহার করো! ☀️"
    ]
  },
  sleep: {
    patterns: [/good night|gn\b|sleep|ঘুমাতে যাচ্ছি|শুভ রাত্রি/i],
    replies: [
      "Good night! 🌙 Sweet dreams~",
      "Sleep well! 😴 See you tomorrow!",
      "Take care, rest well! 🌛✨",
      "শুভ রাত্রি! 🌙 মিষ্টি স্বপ্ন দেখো~",
      "ঘুমাও ভালো করে! 😴 কাল আবার কথা হবে"
    ]
  },
  morning: {
    patterns: [/good morning|gm\b|শুভ সকাল|সকাল/i],
    replies: [
      "Good morning! ☀️ Hope you have an amazing day!",
      "Rise and shine! 🌅 Good morning~",
      "শুভ সকাল! ☀️ আজকের দিনটা দারুণ হোক!",
      "সকাল সকাল কথা বলতে এসেছো! 🌅 ভালো লাগলো!"
    ]
  }
};

// ─── Context Tracking ──────────────────────────────────────────────────────
const threadContext = new Map();  // threadID → { lastReply, history[] }
const cooldowns = new Map();       // userID → timestamp

// ─── Helpers ───────────────────────────────────────────────────────────────
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getTypingDelay(text, speed) {
  const words = text.split(" ").length;
  return Math.min(words * speed * 10, 4000);
}

function matchesPattern(text, patterns) {
  return patterns.some(p => p.test(text.trim()));
}

function getResponse(text) {
  for (const [key, data] of Object.entries(RESPONSES)) {
    if (matchesPattern(text, data.patterns)) {
      return { key, replies: data.replies };
    }
  }
  return null;
}

function getContext(threadID) {
  if (!threadContext.has(threadID)) {
    threadContext.set(threadID, { lastReply: null, history: [], lastKey: null });
  }
  return threadContext.get(threadID);
}

function pickNonRepeat(replies, lastReply) {
  if (replies.length === 1) return replies[0];
  const filtered = replies.filter(r => r !== lastReply);
  return pickRandom(filtered.length > 0 ? filtered : replies);
}

// ─── Module Export ─────────────────────────────────────────────────────────
module.exports = {
  config: {
    name: "autoChat",
    version: "2.0",
    author: "Ajmaul",
    countDown: 0,
    role: 0,
    description: "Human-like AI conversation system with natural replies",
    category: "system",
    guide: ""
  },

  onStart: async function () {
    // No direct trigger — this runs via onChat
  },

  onChat: async function ({ api, event, message, isUserCallCommand }) {
    try {
      const cfg = loadConfig();
      if (!cfg.enable) return;

      const { body, threadID, senderID, type } = event;
      if (!body || type !== "message") return;

      // Skip if user issued a command
      if (isUserCallCommand) return;

      // Skip prefix-based messages
      if (cfg.ignorePrefixes.some(p => body.startsWith(p))) return;

      // Skip very short or empty messages
      if (body.trim().length < 2) return;

      // Cooldown per user (3 seconds)
      const now = Date.now();
      const lastTime = cooldowns.get(senderID) || 0;
      if (now - lastTime < 3000) return;

      // Match response
      const matched = getResponse(body);
      if (!matched) {
        // Random reply chance for unmatched messages
        if (!cfg.replyToAll && Math.random() * 100 > cfg.replyChance) return;
        return; // Only reply to matched patterns by default
      }

      const ctx = getContext(threadID);
      const reply = pickNonRepeat(matched.replies, ctx.lastReply);

      // Typing delay — feels human
      const delay = Math.min(
        Math.max(getTypingDelay(reply, cfg.typingSpeed), cfg.minDelay),
        cfg.maxDelay
      );

      cooldowns.set(senderID, now);

      // Show typing indicator then reply
      return async () => {
        try {
          api.sendTypingIndicator(threadID);
          await new Promise(r => setTimeout(r, delay));
          await message.reply(reply);

          // Update context
          ctx.lastReply = reply;
          ctx.lastKey = matched.key;
          ctx.history.push({ key: matched.key, time: now });
          if (ctx.history.length > 10) ctx.history.shift();
        } catch (err) {
          // Silent fail
        }
      };
    } catch (err) {
      // Silent fail — never crash the bot
    }
  }
};
