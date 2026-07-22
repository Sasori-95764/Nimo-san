const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

module.exports = {
  config: {
    name:             "texttoimage",
    aliases:          ["midjourney", "openjourney", "text2image", "t2i"],
    version:          "2.0",
    author:           "EryXenX",
    countDown:        5,
    role:             0,
    shortDescription: "أنشئ صورة من وصف نصي",
    longDescription:  "توليد صور احترافية بالذكاء الاصطناعي — مجاني بدون مفتاح API",
    category:         "AI-IMAGE",
    guide:            "{pn} <الوصف>\nمثال: {pn} منزل مستقبلي في الفضاء، دقة عالية، إضاءة سينمائية"
  },

  langs: {
    ar: {
      noPrompt:   "⚠️ الرجاء كتابة وصف للصورة",
      generating: "🖼️ جارٍ إنشاء صورتك...",
      failed:     "❌ حدث خطأ أثناء التوليد، حاول مرة أخرى لاحقاً"
    },
    en: {
      noPrompt:   "⚠️ Please enter a prompt",
      generating: "🖼️ Generating your image...",
      failed:     "❌ An error occurred, please try again later"
    }
  },

  onStart: async function ({ message, args, getLang, event, api }) {
    const prompt = args.join(" ").trim();
    if (!prompt) return message.reply(getLang("noPrompt"));

    const waitMsg = await message.reply(getLang("generating"));

    try {
      // Pollinations.ai — free, no API key required
      const encoded  = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&model=flux`;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });

      const cachePath = path.join(__dirname, "cache");
      fs.ensureDirSync(cachePath);
      const filePath = path.join(cachePath, `t2i_${event.senderID}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(res.data));

      await api.sendMessage(
        { body: `✅ ${prompt}`, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlink(filePath, () => {}),
        waitMsg.messageID
      );
    } catch (err) {
      console.error("[texttoimage]", err.message);
      message.reply(getLang("failed"));
    }
  }
};
