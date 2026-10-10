global.groupNameProtection = global.groupNameProtection || {};

module.exports = {
  config: {
    name: "locktitle",
    version: "1.4",
    author: "Gemini",
    countDown: 5,
    role: 2,
    description: {
      en: "Change and lock group name. Bot admin only."
    },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} <الاسم الجديد>\nمثال: {pn} اهلا بكم في المجموعة\n\n{pn} unlock : لإلغاء القفل"
      }
    }
  },

  onStart: async function ({ args, message, event, api }) {
    const threadID = event.threadID;

    if (args[0] === "unlock") {
      delete global.groupNameProtection[threadID];
      return message.reply("🔓 تم إلغاء قفل اسم المجموعة.");
    }

    const newTitle = args.join(" ");
    if (!newTitle) return message.reply("دخل الاسم الجديد ديال المجموعة\nمثال: /locktitle اهلا بكم في المجموعة");

    try {
      await api.setTitle(newTitle, threadID);
      global.groupNameProtection[threadID] = newTitle;
      return message.reply(`🔒 تم تغيير وقفل اسم المجموعة إلى:\n"${newTitle}"\n\nدابا إلا شي واحد بدلو البوت غادي يرجعو بعد 15 ثانية.`);
    } catch (e) {
      return message.reply("❌ ما قدرتش نبدل الاسم. جرب مرة أخرى.");
    }
  },

  onEvent: async function ({ event, api }) {
    if (event.logMessageType === "log:thread-name") {
      const threadID = event.threadID;
      const authorID = event.author;
      const botID = api.getCurrentUserID();

      if (global.groupNameProtection[threadID] && authorID !== botID) {
        const lockedTitle = global.groupNameProtection[threadID];

        setTimeout(async () => {
          try {
            await api.setTitle(lockedTitle, threadID);
          } catch (e) {
            // ما قدرش يرجعو
          }
        }, 15000); // تم التعديل إلى 15 ثانية لتفادي الحظر
      }
    }
  }
};
