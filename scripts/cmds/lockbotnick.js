const DEFAULT_NICK = "🤖─✾𝑩𝑶𝑻 → فــوكــس✾─🤖";
const FIXED_DELAY = 15000; // وقت ثابت 15 ثانية

module.exports = {
  config: {
    name: "lockbotnick",
    aliases: ["botlock"],
    version: "3.1",
    author: "TOJI",
    countDown: 0,
    role: 2,
    shortDescription: "حماية كنية البوت",
    guide: "{pn} on [كنية جديدة] - {pn} off - {pn}"
  },

  onStart: async function({ event, api, threadsData, message, args }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    
    let data;
    try {
      data = await threadsData.get(threadID) || {};
    } catch (e) {
      data = {};
    }
    data.data = data.data || {};
    data.data.botLock = data.data.botLock || {};

    const action = args[0] ? args[0].toLowerCase() : "";

    // إيقاف الحماية كاملة
    if (action === "off") {
      data.data.botLock.enabled = false;
      await threadsData.set(threadID, { data: data.data });
      return message.reply("✅ تم إيقاف حماية كنية البوت كاملة.");
    }

    // تفعيل وتغيير الكنية لكنية جديدة
    if (action === "on") {
      const newNick = args.slice(1).join(" ").trim() || DEFAULT_NICK;
      data.data.botLock.enabled = true;
      data.data.botLock.nick = newNick;
      await threadsData.set(threadID, { data: data.data });
      
      try {
        await api.changeNickname(newNick, threadID, botID);
      } catch(e) {}

      return message.reply(`✅ تم تغيير وقفل كنية البوت إلى:\n${newNick}\n⏱️ وقت الحماية والتثبيت: 15 ثانية`);
    }

    // التشغيل الافتراضي (بدون معاملات)
    try {
      await api.changeNickname(DEFAULT_NICK, threadID, botID);
      data.data.botLock = { enabled: true, nick: DEFAULT_NICK };
      await threadsData.set(threadID, { data: data.data });
      return message.reply(`✅ تم تفعيل حماية كنية البوت الافتراضية:\n${DEFAULT_NICK}\n⏱️ وقت الحماية والتثبيت: 15 ثانية`);
    } catch(e) {
      return message.reply("❌ حدث خطأ أثناء تغيير كنية البوت، تأكد من صلاحيات البوت.");
    }
  },

  onEvent: async function({ event, api, threadsData }) {
    if (!event || !event.threadID) return;
    const { threadID, logMessageType, logMessageData } = event;
    const botID = api.getCurrentUserID();

    // عند دخول البوت إلى مجموعة جديدة
    if (logMessageType === "log:subscribe") {
      const added = logMessageData.addedParticipants || [];
      const isBotAdded = added.some(p => p.userFbId == botID || p.userFbId == String(botID));
      
      if (isBotAdded) {
        setTimeout(async () => {
          try {
            await api.changeNickname(DEFAULT_NICK, threadID, botID);
            let data = await threadsData.get(threadID) || {};
            data.data = data.data || {};
            data.data.botLock = { enabled: true, nick: DEFAULT_NICK };
            await threadsData.set(threadID, { data: data.data });
            
            if (typeof api.sendMessage === "function") {
              api.sendMessage(`🤖 مرحباً! تم تأمين وتثبيت كنيتي بنجاح:\n${DEFAULT_NICK}`, threadID);
            }
          } catch(e) {}
        }, 3000);
      }
    }

    // مراقبة تغيير كنية البوت وإرجاعها بعد 15 ثانية تماماً
    if (logMessageType === "log:user-nickname") {
      const targetID = logMessageData.participant_id;
      if (targetID == botID) {
        try {
          let data = await threadsData.get(threadID);
          if (data?.data?.botLock?.enabled === false) return;
          
          const protectedNick = data?.data?.botLock?.nick || DEFAULT_NICK;
          
          setTimeout(async () => {
            try {
              await api.changeNickname(protectedNick, threadID, botID);
            } catch (e) {}
          }, FIXED_DELAY); // مؤقت ثابت بـ 15 ثانية لتفادي الحظر
          
        } catch (e) {}
      }
    }
  }
};
