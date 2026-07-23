const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const GEMINI_API_KEYS = [
  "AQ.Ab8RN6Lb2zFlO6S0hRuVWqojuZK8a5ZJMses5H-hFeacAVFyCw",
  "AQ.Ab8RN6L3T_uUYIUUwFTe6ww2MXkoNZzgrhC_ZBWNJBGaH4Qymw"
];

let currentKeyIndex = 0;
const processingMessages = new Set();

const PERSONALITIES = {
  "عادي": "كتهضر بالدارجة المغربية عادية، محترم وكيعاون وممنوع تسب أو تستعمل كلام خايب",
  "معلم": "كتهضر بحال أستاذ، كتشرح مزيان وكتعطي أمثلة، محترم 100%",
  "مكلخ": "كتهضر بالدارجة ديال الزنقة، ضريف وكضحك بزاف 🤣 ولكن بلا سبان وبلا كلام خايب",
  "حكيم": "كتهضر بحال شيخ حكيم، كلامك موزون وفيه معاني، محترم",
  "تقني": "كتهضر بحال مبرمج، كتستعمل مصطلحات تقنية، محترم"
};

// قائمة الكلمات الممنوعة
const BAD_WORDS = [
  "زبي", "قحبة", "حمار", "كلب", "نيك", "طبون", "سوة", "قواد", "عاهرة",
  "fuck", "shit", "bitch", "asshole"
];

// فلتر تنظيف الردود
function cleanResponse(text) {
  let cleaned = text;
  BAD_WORDS.forEach(word => {
    const regex = new RegExp(word, "gi");
    cleaned = cleaned.replace(regex, "***");
  });
  return cleaned;
}

// فلتر فحص رسائل المستخدم
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
    longDescription: "Gemini AI + ذاكرة + شخصيات + تحليل صور + تصوير + صوت + فلتر",
    category: "🤖 AI",
    guide: {
      ar: "{pn} [سؤالك]\n{pn} on/off - تشغيل/إيقاف\n{pn} vip/fast - وضع متقدم\n{pn} شخصية [اسم] - تغيير الشخصية\n{pn} remember [شيء] - حفظ ذكرى\n{pn} forget - مسح الذاكرة\n{pn} stats - إحصائياتك\n{pn} قول [نص] - رد صوتي\n{pn} صورة [وصف] - تصوير"
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
        return message.reply("💎 **وضع VIP تفعل**\nذاكرة أكبر + ردود أعمق + تحليل صور");

      case "fast":
        await threadsData.set(threadID, "fast", "data.aiMode");
        return message.reply("⚡ **الوضع السريع تفعل**\nردود فـ سطر واحد صاروخ");

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

      case "remember":
        const memory = args.slice(1).join(" ");
        if (!memory) return message.reply("شنو بغيتي نحفظ؟ #ai remember سميتي محمد");
        if (containsBadWords(memory)) return message.reply("❌ ما يمكنش نحفظ كلام خايب");
        const userData = await usersData.get(senderID);
        const longMemory = userData?.data?.longMemory || {};
        longMemory[`ذكرى_${Date.now()}`] = memory;
        await usersData.set(senderID, { data: { ...userData?.data, longMemory } });
        return message.reply(`🧠 حفظت: "${memory}"`);

      case "forget":
        const uDataForget = await usersData.get(senderID);
        await usersData.set(senderID, { data: { ...uDataForget?.data, longMemory: {}, chatHistory: [] } });
        return message.reply("🗑️ مسحت كل الذكريات والمحادثات ديالك");

      case "stats":
        const uData = await usersData.get(senderID);
        const msgCount = uData?.data?.aiMsgCount || 0;
        const memCount = Object.keys(uData?.data?.longMemory || {}).length;
        const pName = uData?.data?.aiPersonality || "عادي";
        return message.reply(`📊 **إحصائياتك مع AI:**\n💬 عدد الرسائل: ${msgCount}\n🧠 الذكريات: ${memCount}\n🎭 الشخصية: ${pName}`);

      case "قول":
        const text = args.slice(1).join(" ");
        if (containsBadWords(text)) return message.reply("❌ ما نقدرش نقول كلام خايب");
        return await this.sendVoice({ message, event, text });

      case "صورة":
        const prompt = args.slice(1).join(" ");
        if (!prompt) return message.reply("شنو بغيتي نصايب؟ #ai صورة قط رائد فضاء");
        if (containsBadWords(prompt)) return message.reply("❌ ما نقدرش نصايب صور بكلام خايب");
        return await this.generateImage({ message, event, prompt });
    }

    if (!args[0]) return message.reply("شنو نسولك؟ 🤔\n#ai شحال فالساعة\n#ai صورة أسد");

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
    const { threadID, senderID, messageID, messageReply } = event;

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
        memoryStr = "[ذاكرة دائمة]:\n" + Object.entries(longMemory)
          .slice(-10)
          .map(([k, v]) => `- ${v}`)
          .join("\n") + "\n\n";
      }

      let imageContext = "";
      let imageUrl = null;
      if (messageReply?.attachments?.[0]?.type == "photo") {
        imageUrl = messageReply.attachments[0].url;
        imageContext = "🖼️ [المستخدم رسل صورة، حللها وجاوب على السؤال ديالو]\n\n";
      }

      let replyContext = "";
      if (messageReply && !imageUrl) {
        const repName = await usersData.getName(messageReply.senderID);
        replyContext = `[رد على ${repName}]: ${messageReply.body}\n\n`;
      }

      let systemPrompt = `أنت "كوبرا" بوت مغربي فماسنجر. ${currentPersonality}.`;
      systemPrompt += " مهم جدا: 1) ممنوع منعا كليا تستعمل أي كلام خايب أو سبان أو كلام جنسي. 2) كل سؤال تعطيه جواب جديد ومختلف. 3) كن محترم دائما.";
      if (isFast) systemPrompt += " ردودك قصيرة جدا، سطر واحد فقط.";
      else if (isVip) systemPrompt += " ردودك عميقة ومفصلة، كتشرح مزيان بحال صديق.";
      else systemPrompt += " ردودك مختصرة، 1-3 سطور.";
      systemPrompt += ` محدثك الآن هو ${fullIdentity}.`;

      const userPrompt = memoryStr + replyContext + imageContext + `[رسالة جديدة]: ${body}`;

      const contents = [];
      if (chatHistory.length > 0) {
        const historyLimit = isVip ? 12 : 6;
        chatHistory.slice(-historyLimit).forEach(msg => {
          contents.push({ role: msg.role, parts: [{ text: msg.text }] });
        });
      }

      contents.push({ role: "user", parts: [{ text: userPrompt }] });

      if (imageUrl) {
        const imgBase64 = await this.getBase64FromUrl(imageUrl);
        contents[contents.length - 1].parts.unshift({
          inline_data: { mime_type: "image/jpeg", data: imgBase64 }
        });
      }

      let botReply = await this.callGemini(systemPrompt, contents);

      // فلتر الرد قبل الإرسال
      botReply = cleanResponse(botReply);

      chatHistory.push({ role: "user", text: body });
      chatHistory.push({ role: "model", text: botReply });

      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      await usersData.set(senderID, { data: { ...userData?.data, chatHistory } });
      await usersData.set(senderID, (userData?.data?.aiMsgCount || 0) + 1, "data.aiMsgCount");

      if ((body.toLowerCase().includes("تذكر") || body.toLowerCase().includes("سميني") || body.toLowerCase().includes("عقل")) && !containsBadWords(body)) {
        longMemory[`تلقائي_${Date.now()}`] = body;
        if (Object.keys(longMemory).length > 15) delete longMemory[Object.keys(longMemory)[0]];
        await usersData.set(senderID, { data: { ...userData?.data, longMemory } });
        botReply = "🧠 حفظتها عندي!\n" + botReply;
      }

      const emojiMatch = botReply.match(/[\u2600-\u27BF]|[\u1F300-\u1F9FF]/);
      if (emojiMatch) {
        await message.reaction(emojiMatch[0], messageID);
        botReply = botReply.replace(emojiMatch[0], "").trim();
      }

      return message.reply(botReply);

    } catch (err) {
      console.log(err);
      return message.reply("❌ وقع خطأ، جرب مرة أخرى ولا بدل المفتاح.");
    }
  },

  callGemini: async function(systemPrompt, contents) {
    for (let i = 0; i < GEMINI_API_KEYS.length; i++) {
      const apiKey = GEMINI_API_KEYS[currentKeyIndex];
      try {
        const res = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: contents,
            generationConfig: {
              temperature: 0.9,
              topP: 0.95,
              topK: 40
            },
            safetySettings: [
              { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
              { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
            ]
          },
          { timeout: 15000 }
        );
        return res.data.candidates[0].content.parts[0].text;
      } catch (err) {
        currentKeyIndex = (currentKeyIndex + 1) % GEMINI_API_KEYS.length;
      }
    }
    throw new Error("All API keys failed");
  },

  getBase64FromUrl: async function(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary').toString('base64');
  },

  sendVoice: async function({ message, event, text }) {
    if (!text) return message.reply("شنو بغيتي نقول؟ #ai قول السلام عليكم");
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=ar&client=tw-ob`;
      const res = await axios.get(url, { responseType: "stream" });
      const filePath = path.join(__dirname, "cache", `voice_${event.senderID}.mp3`);
      await fs.ensureDir(path.dirname(filePath));
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      await message.reply({ attachment: fs.createReadStream(filePath) });
      await fs.unlink(filePath);
    } catch {
      return message.reply("❌ ما قدرتش نصيفط الصوت");
    }
  },

  generateImage: async function({ message, event, prompt }) {
    const wait = await message.reply("🎨 كنصايب فالتصويرة... تسنا 10 ثواني");
    try {
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;
      const res = await axios.get(imageUrl, { responseType: "stream" });
      const filePath = path.join(__dirname, "cache", `img_${event.senderID}_${Date.now()}.jpg`);
      await fs.ensureDir(path.dirname(filePath));
      const writer = fs.createWriteStream(filePath);
      res.data.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      await message.unsend(wait.messageID);
      await message.reply({ attachment: fs.createReadStream(filePath) });
      await fs.unlink(filePath);
    } catch {
      await message.unsend(wait.messageID);
      return message.reply("❌ فشلت نصايب الصورة، جرب برومبت آخر");
    }
  }
};
