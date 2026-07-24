const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// تم وضع مفتاحك الجديد مباشرة هنا لضمان عمله فوراً
const GEMINI_API_KEYS = [
  "AIzaSyCAh4CtN9cui6u-U1uoANrUxYgSiRG56bk",
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

let currentKeyIndex = 0;
const processingMessages = new Set();

const PERSONALITIES = {
  "عادي": "كتهضر بالدارجة المغربية عادية، محترم وكيعاون وممنوع تسب أو تستعمل كلام خايب",
  "معلم": "كتهضر بحال أستاذ، كتشرح مزيان وكتعطي أمثلة، محترم 100%",
  "مكلخ": "كتهضر بالدارجة ديال الزنقة، ضريف وكضحك بزاف 🤣 ولكن بلا سبان وبلا كلام خايب",
  "حكيم": "كتهضر بحال شيخ حكيم، كلامك موزون وفيه معاني، محترم",
  "تقني": "كتهضر بحال مبرمج، كتستعمل مصطلحات تقنية، محترم"
};

const BAD_WORDS = [
  "زبي", "قحبة", "حمار", "كلب", "نيك", "طبون", "سوة", "قواد", "عاهرة",
  "fuck", "shit", "bitch", "asshole"
];

function cleanResponse(text) {
  let cleaned = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, "gi");
    cleaned = cleaned.replace(regex, "***");
  });
  return cleaned;
}

function containsBadWords(text) {
  return BAD_WORDS.some(word => text.toLowerCase().includes(word.toLowerCase()));
}

module.exports = {
  config: {
    name: "ai",
    version: "4.2",
    author: "YourName",
    countDown: 2,
    role: 0,
    shortDescription: "ذكاء اصطناعي Pro محترم",
    longDescription: "Gemini AI + ذاكرة + شخصيات + تحليل صور + فلتر",
    category: "🤖 AI",
    guide: {
      ar: "{pn} [سؤالك]\n{pn} on/off - تشغيل/إيقاف\n{pn} vip/fast - وضع متقدم\n{pn} شخصية [اسم] - تغيير الشخصية"
    }
  },

  onStart: async function ({ message, event, args, threadsData, usersData }) {
    const { threadID, senderID } = event;
    const action = args[0]?.toLowerCase();

    switch (action) {
      case "on":
        await threadsData.set(threadID, true, "data.aiEnabled");
        return message.reply("✅ تم تشغيل الذكاء الاصطناعي\nاكتب #ai vip للوضع المتقدم");

      case "off":
        await threadsData.set(threadID, false, "data.aiEnabled");
        return message.reply("❌ تم إيقاف الذكاء الاصطناعي");

      case "vip":
        await threadsData.set(threadID, "vip", "data.aiMode");
        return message.reply("💎 **وضع VIP تفعل**\nذاكرة أكبر + ردود أعمق");

      case "fast":
        await threadsData.set(threadID, "fast", "data.aiMode");
        return message.reply("⚡ **الوضع السريع تفعل**\nردود فـ سطر واحد");

      case "عادي":
        await threadsData.set(threadID, "normal", "data.aiMode");
        return message.reply("🔄 رجعنا للوضع العادي");

      case "شخصية":
        const personality = args.slice(1).join(" ");
        if (!PERSONALITIES[personality]) {
          return message.reply(`❌ الشخصيات المتاحة:\n${Object.keys(PERSONALITIES).join(" | ")}`);
        }
        await usersData.set(senderID, personality, "data.aiPersonality");
        return message.reply(`🎭 شخصيتك دابا: **${personality}**`);
    }

    if (!args[0]) return message.reply("شنو نسولك؟ 🤔\n#ai شحال فالساعة");

    if (containsBadWords(args.join(" "))) {
      return message.reply("❌ سمح ليا، ما كنجاوبش على كلام خايب. سولني شي حاجة أخرى 🙏");
    }

    await this.generateReply({ message, event, usersData, threadsData, body: args.join(" ") });
  },

  onChat: async function ({ message, event, threadsData, usersData }) {
    const { threadID, senderID, body, messageID } = event;
    if (!body || body.startsWith("#")) return;

    const aiEnabled = await threadsData.get(threadID, "data.aiEnabled");
    if (!aiEnabled) return;
    if (processingMessages.has(messageID)) return;
    if (senderID == global.GoatBot.botID) return;

    if (containsBadWords(body)) {
      await message.reaction("⚠️", messageID);
      return message.reply("❌ سمح ليا، ما كنجاوبش على كلام خايب. احترم راسك 🙏");
    }

    processingMessages.add(messageID);
    setTimeout(() => processingMessages.delete(messageID), 5000);

    await this.generateReply({ message, event, usersData, threadsData, body });
  },

  generateReply: async function ({ message, event, usersData, threadsData, body }) {
    const { threadID, senderID, messageID } = event;

    try {
      const [name, userData, aiMode, personality] = await Promise.all([
        usersData.getName(senderID),
        usersData.get(senderID),
        threadsData.get(threadID, "data.aiMode"),
        usersData.get(senderID, "data.aiPersonality")
      ]);

      const fullIdentity = `${name} (ID: ${senderID})`;
      const longMemory = userData?.data?.longMemory || {};
      let chatHistory = userData?.data?.chatHistory || [];
      const isVip = aiMode == "vip";
      const isFast = aiMode == "fast";
      const currentPersonality = PERSONALITIES[personality || "عادي"];

      let memoryStr = "";
      if (Object.keys(longMemory).length > 0) {
        memoryStr = "[ذاكرة دائمة]:\n" + Object.entries(longMemory).slice(-10).map(([k, v]) => `- ${v}`).join("\n") + "\n\n";
      }

      let systemPrompt = `أنت "كوبرا" بوت مغربي فماسنجر. ${currentPersonality}.`;
      systemPrompt += " مهم جدا: ممنوع تستعمل كلام خايب. كن محترم دائما.";
      if (isFast) systemPrompt += " ردودك قصيرة جدا، سطر واحد فقط.";
      else if (isVip) systemPrompt += " ردودك عميقة ومفصلة.";
      else systemPrompt += " ردودك مختصرة، 1-3 سطور.";
      systemPrompt += ` محدثك الآن هو ${fullIdentity}.`;

      const userPrompt = memoryStr + `[رسالة جديدة]: ${body}`;

      const contents = [];
      if (chatHistory.length > 0) {
        const historyLimit = isVip ? 12 : 6;
        chatHistory.slice(-historyLimit).forEach(msg => {
          contents.push({ role: msg.role, parts: [{ text: msg.text }] });
        });
      }

      contents.push({ role: "user", parts: [{ text: userPrompt }] });

      let botReply = await this.callGemini(systemPrompt, contents);
      botReply = cleanResponse(botReply);

      chatHistory.push({ role: "user", text: body });
      chatHistory.push({ role: "model", text: botReply });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      await usersData.set(senderID, { data: { ...userData?.data, chatHistory } });
      await usersData.set(senderID, (userData?.data?.aiMsgCount || 0) + 1, "data.aiMsgCount");

      return message.reply(botReply);

    } catch (err) {
      console.error(err);
      return message.reply("❌ وقع خطأ، جرب مرة أخرى ولا بدل المفتاح.");
    }
  },

  callGemini: async function(systemPrompt, contents) {
    let apiKey = GEMINI_API_KEYS[currentKeyIndex];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    try {
      const response = await axios.post(url, {
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: contents
      }, {
        headers: { "Content-Type": "application/json" }
      });

      return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
      currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
      throw error;
    }
  }
};
