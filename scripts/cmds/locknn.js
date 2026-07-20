module.exports = {
  config: {
    name: "locknn",
    version: "2.0",
    author: "Nolan Bot",
    role: 2, // 2 = أدمن البوت فقط لي يقدر يشغل
    category: "box chat",
    shortDescription: { en: "قفل واسترجاع الكنيات" },
    longDescription: { en: "غير أدمن البوت يقدر يفعل. يحاول يرجع الكنية بدون سبام" },
    guide: { en: "{pn} [on | off]" }
  },

  onStart: async function ({ message, args, event, threadsData, api }) {
    const { threadID } = event;
    const input = args[0]?.toLowerCase();

    if (input === "on") {
      const threadInfo = await api.getThreadInfo(threadID);
      const nicknames = threadInfo.nicknames || {};
      await threadsData.set(threadID, nicknames, "data.lockedNicknames");
      await threadsData.set(threadID, true, "settings.locknn");
      return message.reply("✅ تم تفعيل قفل الكنيات.\nالبوت غادي يحاول يرجع أي كنية تتبدل.");
    }
    else if (input === "off") {
      await threadsData.set(threadID, false, "settings.locknn");
      return message.reply("🔓 تم إيقاف قفل الكنيات.");
    }
    else {
      return message.reply("استخدم:!locknn on |!locknn off");
    }
  },

  onEvent: async function ({ event, threadsData, api }) {
    const { threadID, logMessageType, logMessageData } = event;
    const isLocked = await threadsData.get(threadID, "settings.locknn");
    if (!isLocked) return;

    if (logMessageType === "log:user-nickname") {
      const { participant_id, nickname } = logMessageData;
      const savedNicknames = await threadsData.get(threadID, "data.lockedNicknames");
      if (!savedNicknames) return;

      const oldNickname = savedNicknames[participant_id] || "";
      if (!oldNickname || oldNickname === nickname) return; // إذا هي نفسها نسكت

      // نحاولو نرجعوها
      api.changeNickname(oldNickname, threadID, participant_id, (err) => {
        if (!err) {
          // حدثنا القاعدة
          savedNicknames[participant_id] = oldNickname;
          threadsData.set(threadID, savedNicknames, "data.lockedNicknames");
        }
        // إذا فشل نسكت
      });
    }
  }
};
