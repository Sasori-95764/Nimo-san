module.exports = {
  config: {
    name: "locktitle",
    version: "2.0",
    author: "Gemini",
    countDown: 5,
    role: 2, // غير أدمن البوت
    description: { en: "Lock group name forever. Bot admin only." },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} <الاسم الجديد>\nمثال: {pn} اهلا بكم\n\n{pn} unlock : لإلغاء القفل\n{pn} status : تشوف واش خدام"
      }
    }
  },

  onStart: async function ({ args, message, event, api, threadsData }) {
    const threadID = event.threadID;
    const data = await threadsData.get(threadID);
    const threadData = data.data || {};

    // إلغاء القفل
    if (args[0] === "unlock") {
      threadData.lockedTitle = null;
      await threadsData.set(threadID, { data: threadData });
      return message.reply("🔓 تم إلغاء قفل اسم المجموعة نهائيا.");
    }

    // تشوف الحالة
    if (args[0] === "status") {
      if (threadData.lockedTitle) {
        return message.reply(`🔒 الحماية خدامة\nالاسم المقفول: "${threadData.lockedTitle}"`);
      } else {
        return message.reply("🔓 ما كاينش قفل دابا");
      }
    }

    const newTitle = args.join(" ");
    if (!newTitle) return message.reply("دخل الاسم الجديد ديال المجموعة\nمثال: /locktitle اهلا بكم في المجموعة");

    try {
      await api.setTitle(newTitle, threadID);

      // حفظ فالداتابيز - كيبقا ديما حتى تحيدو نتا
      threadData.lockedTitle = newTitle;
      await threadsData.set(threadID, { data: threadData });

      return message.reply(`🔒 تم قفل اسم المجموعة نهائيا على:\n"${newTitle}"\n\nدابا البوت غادي يرجعو نيشان إلا تبدل، حتى بعد 100 ريستارت.`);
    } catch (e) {
      return message.reply("❌ ما قدرتش نبدل الاسم. تأكد واش البوت أدمن.");
    }
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType === "log:thread-name") {
      const threadID = event.threadID;
      const authorID = event.author;
      const botID = api.getCurrentUserID();

      const data = await threadsData.get(threadID);
      const lockedTitle = data.data?.lockedTitle;

      // إلا كاين قفل وماشي البوت اللي بدلو
      if (lockedTitle && authorID!== botID) {
        try {
          await api.setTitle(lockedTitle, threadID);
          // يمكن تزيد رسالة هنا إلا بغيتي
          // api.sendMessage("⛔ الاسم مقفول، تم الإرجاع", threadID);
        } catch (e) {
          console.log(`[LOCKTITLE] Failed to revert name in ${threadID}`);
        }
      }
    }
  }
};
