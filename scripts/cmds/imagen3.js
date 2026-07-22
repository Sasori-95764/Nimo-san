const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

module.exports = {
  config: {
    name:             "imagen3",
    aliases:          ["imagen", "imagenv3"],
    version:          "2.0",
    author:           "EryXenX",
    countDown:        10,
    role:             0,
    shortDescription: "توليد صورة بنموذج Imagen",
    longDescription:  "أنشئ صوراً فائقة الجودة بالذكاء الاصطناعي — مجاني بدون مفتاح API",
    category:         "AI-IMAGE",
    guide:            "{pn} <الوصف>\nمثال: {pn} سامورائي يقف عند غروب الشمس"
  },

  onStart: async function ({ args, message, event, api }) {
    const prompt = args.join(" ").trim();
    if (!prompt)
      return message.reply("❌ الرجاء كتابة وصف للصورة\nمثال: imagen3 سامورائي عند غروب الشمس");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const encoded  = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&model=flux-realism`;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });

      const cachePath = path.join(__dirname, "cache");
      fs.ensureDirSync(cachePath);
      const filePath = path.join(cachePath, `imagen3_${event.senderID}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(res.data));

      message.reply(
        { body: `✨ ${prompt}`, attachment: fs.createReadStream(filePath) },
        () => {
          fs.unlink(filePath, () => {});
          api.setMessageReaction("✅", event.messageID, () => {}, true);
        }
      );
    } catch (err) {
      console.error("[imagen3]", err.message);
      message.reply("❌ فشل توليد الصورة. حاول مرة أخرى.");
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
