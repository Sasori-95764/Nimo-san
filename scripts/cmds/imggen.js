const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

module.exports = {
  config: {
    name:             "imgen",
    aliases:          ["imggen", "imagine", "توليد", "صورة"],
    version:          "2.0",
    author:           "EryXenX",
    countDown:        10,
    role:             0,
    shortDescription: "توليد صورة بالذكاء الاصطناعي",
    longDescription:  "أنشئ صوراً احترافية بالذكاء الاصطناعي من وصف نصي — مجاني بدون مفتاح API",
    category:         "AI-IMAGE",
    guide:            "{pn} <الوصف>\nمثال: {pn} قصر سحري في غابة مضيئة"
  },

  langs: {
    ar: {
      noPrompt:   "❌ الرجاء كتابة وصف للصورة\nمثال: .imgen قط جميل في الفضاء",
      generating: "🎨 جارٍ توليد الصورة، انتظر لحظة...",
      failed:     "❌ فشل التوليد. حاول مرة أخرى لاحقاً."
    },
    en: {
      noPrompt:   "❌ Please provide a prompt.\nExample: .imgen a dragon over a castle",
      generating: "🎨 Generating image, please wait...",
      failed:     "❌ Failed to generate image. Try again later."
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply(getLang("noPrompt"));

    const waitMsg = await api.sendMessage(getLang("generating"), event.threadID);

    try {
      // Pollinations.ai — 100% free, no API key required
      const encoded  = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&model=flux`;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });

      const cachePath = path.join(__dirname, "cache");
      fs.ensureDirSync(cachePath);
      const filePath = path.join(cachePath, `imgen_${event.senderID}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(res.data));

      await api.sendMessage(
        { body: `✅ الوصف: ${prompt}`, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlink(filePath, () => {}),
        waitMsg.messageID
      );
    } catch (err) {
      console.error("[imggen]", err.message);
      api.sendMessage(getLang("failed"), event.threadID, waitMsg.messageID);
    }
  }
};
