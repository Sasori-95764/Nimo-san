const fs = require("fs");
const path = require("path");

const imageQueue = new Map();
let imageEngine = null;
let currentApi = null;
const DELAY_TIME = 10000; // تم التعديل إلى 10 ثوانٍ
let banDetected = false;
let banUntil = 0;

function getSafeDelay(base) {
  return base + Math.floor(Math.random() * 2000);
}

function isBanned() {
  if (banDetected && Date.now() < banUntil) return true;
  if (banDetected && Date.now() >= banUntil) banDetected = false;
  return false;
}

function triggerBanProtection() {
  banDetected = true;
  banUntil = Date.now() + 5 * 60 * 1000;
}

function startImageEngine() {
  if (imageEngine) return;
  imageEngine = setInterval(() => {
    const now = Date.now();
    imageQueue.forEach(async (item, threadID) => {
      if (now - item.lastTry > getSafeDelay(DELAY_TIME)) {
        if (isBanned()) return;
        item.lastTry = Date.now();
        try {
          if (currentApi && typeof currentApi.changeGroupImage === "function") {
            await currentApi.changeGroupImage(item.imagePath, threadID);
          }
        } catch (e) {
          if (e.errorCode == 429) triggerBanProtection();
        }
      }
    });
  }, 1000);
}

module.exports = {
  config: {
    name: "lockimg",
    aliases: ["imglock", "antilogo"],
    version: "2.0",
    author: "TOJI",
    countDown: 0,
    role: 2,
    shortDescription: "قفل صورة المجموعة",
    longDescription: "يمنع أي شخص من تغيير صورة المجموعة نهائيا مع نظام إعادة تلقائي بعد 10 ثوانٍ",
    category: "box chat",
    guide: "{pn} on: تفعيل قفل الصورة الحالية\n{pn} off: إيقاف القفل"
  },

  onStart: async function({ event, api, threadsData, message, args }) {
    const threadID = event.threadID;
    currentApi = api;
    startImageEngine();

    const data = await threadsData.get(threadID) || {};
    data.data = data.data || {};
    data.data.lockimg = data.data.lockimg || {};

    const action = args[0] ? args[0].toLowerCase() : "";

    if (action === "off") {
      data.data.lockimg.enabled = false;
      imageQueue.delete(threadID);
      await threadsData.set(threadID, { data: data.data });
      return message.reply("✅ تم إيقاف قفل صورة المجموعة بنجاح.");
    }

    if (action === "on") {
      try {
        const threadInfo = await api.getThreadInfo(threadID);
        const currentImage = threadInfo.imageSrc;

        if (!currentImage) {
          return message.reply("❌ هذه المجموعة ليس لها صورة حاليا، ضع صورة أولا ثم فعل القفل.");
        }

        data.data.lockimg.enabled = true;
        data.data.lockimg.image = currentImage;
        await threadsData.set(threadID, { data: data.data });

        return message.reply("✅ تم تفعيل قفل صورة المجموعة بنجاح\n🔒 الآن لا يمكن لأي شخص تغيير الصورة نهائيا\n⏱️ نظام الحماية والتصحيح: كل 10 ثوانٍ");
      } catch (err) {
        return message.reply("❌ حدث خطأ أثناء جلب معلومات المجموعة، جرب مرة أخرى.");
      }
    }

    return message.reply("📜 الاستخدام الصحيح:\n- /lockimg on : لتفعيل قفل الصورة الحالية\n- /lockimg off : لإيقاف القفل");
  },

  onEvent: async function({ event, api, threadsData }) {
    if (!event || !event.threadID) return;
    const { threadID, logMessageType } = event;
    currentApi = api;
    startImageEngine();

    if (logMessageType === "log:thread-image") {
      try {
        const data = await threadsData.get(threadID);
        const lock = data?.data?.lockimg;

        if (lock?.enabled && lock.image) {
          const cacheDir = path.join(__dirname, "cache");
          if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
          }
          const imagePath = path.join(cacheDir, `${threadID}.jpg`);

          const response = await require("axios")({
            url: lock.image,
            method: "GET",
            responseType: "stream"
          });

          const writer = fs.createWriteStream(imagePath);
          response.data.pipe(writer);

          writer.on("finish", async () => {
            if (isBanned()) return;
            setTimeout(async () => {
              try {
                await api.changeGroupImage(fs.createReadStream(imagePath), threadID);
              } catch (e) {
                imageQueue.set(threadID, {
                  imagePath: fs.createReadStream(imagePath),
                  lastTry: Date.now()
                });
                if (e.errorCode == 429) triggerBanProtection();
              }
            }, 10000); // الانتظار 10 ثوانٍ قبل إرجاع الصورة
          });
        }
      } catch (e) {
        // تجاهل الأخطاء المؤقتة لضمان استقرار البوت
      }
    }
  }
};
