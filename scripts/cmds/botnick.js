const DEFAULT_NICK = "🤖─✾𝑩𝑶𝑻 → فــوكــس✾─🤖";
const FIXED_DELAY = 15000; // 15 ثانية ثابتة

module.exports = {
  config: {
    name: "botnick",
    aliases: ["bn"],
    version: "3.3",
    author: "TOJI",
    countDown: 0,
    role: 1, // متاح لمشرفي الكروب لتسهيل الاستخدام
    shortDescription: "حماية كنية البوت",
    guide: "{pn} on [كنية جديدة] - {pn} off - {pn}"
  },

  onStart: async function({ event, api, threadsData, message, args }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    
    let data = {};
    try {
      const threadData = await threadsData.get(threadID);
      data = threadData || {};
    } catch (e) {
      data = {};
    }

    data.data = data.data || {};
    data.data.botLock = data.data.botLock || {};

    const action = args[0] ? args[0].toLowerCase() : "";

    // إيقاف الحماية
    if (action === "off") {
      data.data.botLock.enabled = false;
      await threadsData.set(threadID, { data: data.data });
      return message.reply("✅ تم إيقاف حماية كنية البوت.");
    }

    // تفعيل وتغيير الكنية
    if (action === "on") {
      const newNick = args.slice(1).join(" ").trim() || DEFAULT_NICK;
      data.data.botLock.enabled = true;
      data.data.botLock.nick = newNick;
      await threadsData.set(threadID, { data: data.data });
      
      try {
        await api.changeNickname(newNick, threadID, botID);
      } catch(e) {}

      return message.reply(`✅ تم قفل وتغيير كنية البوت إلى:\n${newNick}\n⏱️ وقت الحماية: 15 ثانية`);
    }

    // التشغيل الافتراضي
    try {
      data.data.botLock.enabled = true;
      data.data.botLock.nick = DEFAULT_NICK;
      await threadsData.set(threadID, { data: data.data });
      
      await api.changeNickname(DEFAULT_NICK, threadID, botID);
      return message.reply(`✅ تم تفعيل حماية كنية البوت الافتراضية:\n${DEFAULT_NICK}\n⏱️ وقت الحماية: 15 ثانية`);
    } catch(e) {
      return message.reply("❌ تأكد من أن البوت يملك صلاحية تغيير الألقاب في المجموعة.");
    }
  },

  onEvent: async function({ event, api, threadsData }) {
    if (!event || !event.threadID) return;
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    if (logMessageType === "log:user-nickname") {
      const targetID = logMessageData.participant_id;
      if (targetID == botID) {
        try {
          const threadData = await threadsData.get(threadID);
          const lock = threadData?.data?.botLock;
          
          if (lock && lock.enabled === false) return;
          
          const protectedNick = lock?.nick || DEFAULT_NICK;
          
          setTimeout(async () => {
            try {
              await api.changeNickname(protectedNick, threadID, botID);
            } catch (e) {}
          }, FIXED_DELAY); // إعادة الكنية بعد 15 ثانية تماماً
          
        } catch (e) {}
      }
    }
  }
};
