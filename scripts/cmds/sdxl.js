const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

const STYLES = {
  "واقعي":      "photorealistic, ultra-detailed, 8K, natural lighting, DSLR quality",
  "أنمي":       "anime style, vibrant colors, cel shading, detailed character art",
  "خيالي":      "fantasy art, magical aura, epic background, dramatic lighting",
  "سايبرpunk":  "cyberpunk, neon lights, futuristic city, dark atmosphere",
  "كرتون":      "cartoon style, bold outlines, bright colors, 2D animation",
  "فن رقمي":    "digital painting, smooth brush strokes, vivid colors",
  "realistic":  "photorealistic, ultra-detailed, 8K UHD, natural lighting",
  "anime":      "anime style, vibrant colors, sharp lines, cel shading",
  "fantasy":    "fantasy art, epic background, magical aura, dramatic lighting",
  "cyberpunk":  "cyberpunk, neon lights, futuristic cityscape",
  "cartoon":    "cartoon style, bold outlines, bright colors, 2D animation",
  "3d":         "3D render, octane render, subsurface scattering, cinematic",
  "cinematic":  "cinematic photography, dramatic lighting, film grain, 4K"
};

module.exports = {
  config: {
    name:             "sdxl",
    aliases:          ["sdxllight", "sdxl-light"],
    version:          "2.0",
    author:           "EryXenX",
    countDown:        10,
    role:             0,
    shortDescription: "توليد صورة بنمط SDXL",
    longDescription:  "أنشئ صوراً فنية بأساليب متعددة — مجاني بدون مفتاح API",
    category:         "AI-IMAGE",
    guide:            "{pn} <الوصف> | <النمط>\nالأنماط: واقعي، أنمي، خيالي، سايبرpunk، كرتون، فن رقمي"
  },

  langs: {
    ar: {
      noInput:    "❌ الرجاء كتابة الوصف والنمط\nمثال: .sdxl تنين يطير | أنمي\nالأنماط المتاحة:\n",
      generating: "⏳ جارٍ إنشاء الصورة...",
      failed:     "❌ فشل التوليد. حاول مرة أخرى."
    },
    en: {
      noInput:    "❌ Please provide prompt and style.\nExample: .sdxl dragon flying | anime\nStyles:\n",
      generating: "⏳ Generating image...",
      failed:     "❌ Failed to generate image. Please try again."
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const parts  = args.join(" ").split("|");
    const prompt = parts[0]?.trim();
    const style  = parts[1]?.trim().toLowerCase() || "";

    if (!prompt) {
      const styleList = Object.keys(STYLES).join("\n• ");
      return message.reply(getLang("noInput") + "• " + styleList);
    }

    const styleTag   = STYLES[style] || STYLES[Object.keys(STYLES).find(k => k.toLowerCase() === style)] || "";
    const finalPrompt = styleTag ? `${prompt}, ${styleTag}` : prompt;

    const waitMsg = await api.sendMessage(getLang("generating"), event.threadID);

    try {
      const encoded  = encodeURIComponent(finalPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&model=flux`;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });

      const cachePath = path.join(__dirname, "cache");
      fs.ensureDirSync(cachePath);
      const filePath = path.join(cachePath, `sdxl_${event.senderID}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(res.data));

      await api.sendMessage(
        {
          body:       `✅ الوصف: ${prompt}${style ? `\n🎨 النمط: ${style}` : ""}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlink(filePath, () => {}),
        waitMsg.messageID
      );
    } catch (err) {
      console.error("[sdxl]", err.message);
      api.sendMessage(getLang("failed"), event.threadID, waitMsg.messageID);
    }
  }
};
