const axios = require("axios");
const fs    = require("fs-extra");
const path  = require("path");

const STYLE_MAP = {
  // Arabic
  "واقعي":     "photorealistic, ultra-detailed, 8K UHD, DSLR quality, natural lighting, depth of field",
  "أنمي":      "anime style, vibrant colors, sharp lines, cel shading, highly detailed character art",
  "خيالي":     "fantasy art, epic background, magical aura, dramatic lighting, mythical creatures",
  "كرتون":     "cartoon style, bold outlines, bright colors, 2D animation look",
  "سريالي":    "surrealistic art, dreamlike scenes, abstract, vivid imagination",
  "بورتريه":   "portrait photography, close-up, high detail, studio lighting, bokeh",
  // English
  "realistic":   "photorealistic, ultra-detailed, 8K UHD, DSLR quality, natural lighting",
  "anime":       "anime style, vibrant colors, sharp lines, cel shading, detailed character art",
  "fantasy":     "fantasy art, epic background, magical aura, dramatic lighting",
  "cyberpunk":   "cyberpunk, neon lights, futuristic cityscape, dark atmosphere",
  "cartoon":     "cartoon style, bold outlines, bright colors, 2D animation",
  "digital art": "digital painting, smooth brush strokes, vivid colors, high detail",
  "oil painting":"oil painting style, textured brush strokes, classical art, warm tones",
  "photography": "professional photography, natural light, sharp focus, realistic",
  "low poly":    "low poly art style, geometric shapes, minimalistic, vibrant colors",
  "pixel art":   "pixel art style, retro gaming, 8-bit colors, sharp edges",
  "surrealism":  "surrealistic art, dreamlike scenes, abstract, vivid imagination",
  "vaporwave":   "vaporwave style, pastel colors, retro-futuristic, glitch art",
  "concept art": "concept art, detailed environment, mood lighting, cinematic",
  "portrait":    "portrait photography, close-up, high detail, studio lighting"
};

module.exports = {
  config: {
    name:             "flux",
    aliases:          ["fluxai", "fluximage"],
    version:          "6.0",
    author:           "EryXenX",
    countDown:        5,
    role:             0,
    shortDescription: "توليد صور فائقة الجودة بالذكاء الاصطناعي",
    longDescription:  "أنشئ صوراً بأساليب متعددة بنموذج Flux — مجاني بدون مفتاح API",
    category:         "AI-IMAGE",
    guide:            "{pn} <الوصف> | [النمط]\nمثال: {pn} أسد في الصحراء | واقعي"
  },

  langs: {
    ar: {
      noPrompt:     "❗ الرجاء كتابة وصف للصورة\n\nمثال:\n• flux أسد في الغابة | واقعي\n• flux تنين يطير | أنمي",
      generating:   "🖼️ جارٍ إنشاء صورتك...",
      failed:       "❌ فشل التوليد. حاول مرة أخرى.",
      invalidStyle: "⚠️ النمط غير معروف! سيتم استخدام الوصف كما هو."
    },
    en: {
      noPrompt:     "❗ Please provide a prompt.\n\nExample:\n• flux a lion in jungle | realistic\n• flux dragon on rooftop | fantasy",
      generating:   "🖼️ Generating your premium AI image...",
      failed:       "❌ Failed to generate image. Please try again later.",
      invalidStyle: "⚠️ Unknown style! Using your prompt as is."
    }
  },

  onStart: async function ({ message, args, getLang, event, api }) {
    if (!args[0]) return message.reply(getLang("noPrompt"));

    const parts      = args.join(" ").split("|");
    const rawPrompt  = parts[0].trim();
    const styleKey   = parts[1]?.trim().toLowerCase() || "";

    let finalPrompt  = rawPrompt;
    if (styleKey) {
      const styleTag = STYLE_MAP[styleKey] || STYLE_MAP[Object.keys(STYLE_MAP).find(k => k.toLowerCase() === styleKey)];
      if (styleTag) {
        finalPrompt = `${rawPrompt}, ${styleTag}`;
      } else {
        message.reply(getLang("invalidStyle"));
      }
    }

    const waitMsg = await message.reply(getLang("generating"));

    try {
      const encoded  = encodeURIComponent(finalPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&enhance=true&model=flux`;

      const res = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 60000 });

      const cachePath = path.join(__dirname, "cache");
      fs.ensureDirSync(cachePath);
      const filePath = path.join(cachePath, `flux_${event.senderID}_${Date.now()}.jpg`);
      fs.writeFileSync(filePath, Buffer.from(res.data));

      await api.sendMessage(
        {
          body:       `🧠 ${rawPrompt}${styleKey ? `\n🎨 النمط: ${styleKey}` : ""}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlink(filePath, () => {}),
        waitMsg.messageID
      );
    } catch (err) {
      console.error("[flux]", err.message);
      message.reply(getLang("failed"));
    }
  }
};
