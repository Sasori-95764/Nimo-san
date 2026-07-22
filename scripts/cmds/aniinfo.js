const axios = require("axios");
const fsExtra = require("fs-extra");
const path  = require("path");

module.exports = {
  config: {
    name:             "aniinfo",
    aliases:          ["animeinfo", "a-info", "أنمي"],
    version:          "1.1",
    author:           "EryXenX",
    countDown:        5,
    role:             0,
    shortDescription: "معلومات عن أنمي",
    longDescription:  "احصل على معلومات تفصيلية عن أي أنمي عبر Jikan API",
    category:         "anime",
    guide:            "{pn} <اسم الأنمي>\nمثال: {pn} demon slayer"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ").trim();
    if (!query)
      return api.sendMessage("❗ أدخل اسم الأنمي. مثال: aniinfo demon slayer", event.threadID);

    try {
      const res   = await axios.get(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1`, { timeout: 15000 });
      const anime = res.data.data?.[0];
      if (!anime) return api.sendMessage("❌ لم يُعثر على نتائج.", event.threadID);

      const { title, title_english, type, episodes, status, score, aired, synopsis, images, genres, url } = anime;

      const msg =
`🎬 الاسم: ${title_english || title}
📺 النوع: ${type || "؟"}
⭐ التقييم: ${score || "؟"}/10
📡 الحالة: ${status || "؟"}
🎞 الحلقات: ${episodes || "؟"}
📅 البث: ${aired?.string || "؟"}
🎭 التصنيفات: ${genres?.map(g => g.name).join("، ") || "؟"}

📝 القصة:
${synopsis?.substring(0, 400) || "لا يوجد وصف"}...

🔗 ${url}`;

      const imageURL = images?.jpg?.large_image_url;
      if (imageURL) {
        const imgData  = (await axios.get(imageURL, { responseType: "arraybuffer", timeout: 10000 })).data;
        const cacheDir = path.join(__dirname, "cache");
        fsExtra.ensureDirSync(cacheDir);
        const filePath = path.join(cacheDir, `aniinfo_${event.senderID}.jpg`);
        fsExtra.writeFileSync(filePath, Buffer.from(imgData));

        api.sendMessage(
          { body: msg, attachment: fsExtra.createReadStream(filePath) },
          event.threadID,
          () => fsExtra.unlink(filePath, () => {}),
          event.messageID
        );
      } else {
        api.sendMessage(msg, event.threadID, event.messageID);
      }
    } catch (err) {
      console.error("[aniinfo]", err.message);
      api.sendMessage("🚫 خطأ في جلب البيانات. حاول مرة أخرى.", event.threadID);
    }
  }
};
