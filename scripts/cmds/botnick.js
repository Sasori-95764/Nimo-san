const DEFAULT_NICK = "🤖─✾𝑩𝑶𝑻 → فــوكــس✾─🤖";
const FIXED_DELAY = 15000; // 15 ثانية ثابتة

module.exports = {
  config: {
    name: "botnick",
    aliases: ["bn", "lockbotnick"],
    version: "5.0",
    author: "TOJI",
    countDown: 0,
    role: 2, // مخصص لأدمن البوت الأساسيين فقط
    shortDescription: "حماية وتثبيت كنية البوت تلقائياً",
    longDescription: "يفعل القفل تلقائياً عند دخول أي مجموعة جديدة، ويمكنك تخصيص أي كنية تريدها",
    category: "box chat",
    guide: "{pn} on [الكنية الجديدة] - {pn} off - {pn}"
  },

  onStart: async function({ api, event, args, threadsData }) {
    try {
      const threadID = event.threadID;
      const botID = api.getCurrentUserID();
      const action = args[0] ? args[0].toLowerCase() : "";

      let threadData = await threadsData.get(threadID) || {};
      threadData.data = threadData.data || {};
      threadData.data.botLock = threadData.data.botLock || {};

      // إيقاف الحماية
      if (action === "off") {
        threadData.data.botLock.enabled = false;
        await threadsData.set(threadID, threadData);
        return api.sendMessage("✅ تم إيقاف حماية كنية البوت في هذه المجموعة.", threadID, event.messageID);
      }

      // تفعيل وتغيير الكنية حسب ما يكتبه المطور
      if (action === "on") {
        const customNick = args.slice(1).join(" ").trim();
        const targetNick = customNick !== "" ? customNick : DEFAULT_NICK;

        threadData.data.botLock.enabled = true;
        threadData.data.botLock.nick = targetNick;
        await threadsData.set(threadID, threadData);

        try {
          await api.changeNickname(targetNick, threadID, botID);
        } catch (e) {}

        return api.sendMessage(`✅ تم قفل وتغيير كنية البوت إلى:\n${targetNick}\n⏱️ وقت الحماية: 15 ثانية`, threadID, event.messageID);
      }

      // التشغيل اليدوي الافتراضي
      threadData.data.botLock.enabled = true;
      threadData.data.botLock.nick = DEFAULT_NICK;
      await threadsData.set(threadID, threadData);

      try {
        await api.changeNickname(DEFAULT_NICK, threadID, botID);
      } catch (e) {}

      return api.sendMessage(`✅ تم تفعيل حماية كنية البوت الافتراضية:\n${DEFAULT_NICK}\n⏱️ وقت الحماية: 15 ثانية`, threadID, event.messageID);

    } catch (err) {
      console.error("Error in botnick:", err);
      return api.sendMessage("❌ حدث خطأ أثناء تنفيذ أمر كنية البوت.", event.threadID, event.messageID);
    }
  },

  onEvent: async function({ api, event, threadsData }) {
    try {
      if (!event || !event.threadID) return;
      const { threadID, logMessageType, logMessageData } = event;
      const botID = api.getCurrentUserID();

      // 1. التفعيل التلقائي فور دخول البوت إلى مجموعة جديدة
      if (logMessageType === "log:subscribe") {
        const addedParticipants = logMessageData.addedParticipants || [];
        const isBotAdded = addedParticipants.some(p => p.userFbId == botID || p.userFbId == String(botID));

        if (isBotAdded) {
          setTimeout(async () => {
            try {
              let threadData = await threadsData.get(threadID) || {};
              threadData.data = threadData.data || {};
              threadData.data.botLock = {
                enabled: true,
                nick: DEFAULT_NICK
              };
              await threadsData.set(threadID, threadData);

              await api.changeNickname(DEFAULT_NICK, threadID, botID);
              api.sendMessage(`🤖 مرحباً! تم تأمين وتثبيت كنيتي تلقائياً:\n${DEFAULT_NICK}`, threadID);
            } catch (e) {}
          }, 3000);
        }
      }

      // 2. مراقبة تغيير الكنية وإعادتها بعد 15 ثانية
      if (logMessageType === "log:user-nickname") {
        const targetID = logMessageData.participant_id;
        if (targetID == botID) {
          const threadData = await threadsData.get(threadID);
          const lock = threadData?.data?.botLock;

          if (lock && lock.enabled === false) return;

          const protectedNick = lock?.nick || DEFAULT_NICK;

          setTimeout(async () => {
            try {
              await api.changeNickname(protectedNick, threadID, botID);
            } catch (e) {}
          }, FIXED_DELAY);
        }
      }
    } catch (err) {
      // تجاهل الأخطاء الصامتة في الخلفية لضمان استقرار السيرفر
    }
  }
};
