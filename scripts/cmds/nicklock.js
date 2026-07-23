const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function parseNickname(nickname, uid, usersData) {
  try {
    if (nickname.includes("{userName}")) {
      const name = await usersData.getName(uid);
      nickname = nickname.replace(/\{userName\}/gi, name);
    }
    if (nickname.includes("{userID}")) {
      nickname = nickname.replace(/\{userID\}/gi, uid);
    }
    return nickname;
  } catch {
    return nickname;
  }
}

module.exports = {
  config: {
    name: "nicklock",
    aliases: ["nl"],
    version: "1.0",
    author: "Gemini",
    countDown: 0,
    role: 2,
    description: "قفل كنيات الأعضاء بسرعة البرق",
    category: "group",
    guide: {
      ar: "{pn} <الكنية> : قفل فوري\n{pn} off : إلغاء القفل\n{pn} check : الحالة"
    }
  },

  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const { threadID, senderID } = event;
    const botID = api.getCurrentUserID();
    const data = await threadsData.get(threadID);
    data.data = data.data || {};

    // إلغاء القفل
    if (args[0]?.toLowerCase() === "off") {
      delete data.data.nicklock;
      await threadsData.set(threadID, { data: data.data });
      return message.reply("🔓 تم إلغاء قفل الكنيات");
    }

    // فحص الحالة
    if (args[0]?.toLowerCase() === "check") {
      const lock = data.data.nicklock;
      if (lock?.enabled) {
        return message.reply(`🔒 القفل شغال\nالقالب: ${lock.template}\nعدد المحميين: ${Object.keys(lock.users || {}).length}`);
      }
      return message.reply("🔓 القفل مطفي");
    }

    const template = args.join(" ");
    if (!template) return message.reply("دخل الكنية\nمثال: /nicklock 🔥 {userName}");

    const threadInfo = await api.getThreadInfo(threadID);
    const members = threadInfo.participantIDs.filter(id => id!= botID);

    await message.reply(`⚡ جاري القفل لـ ${members.length} عضو...`);

    const nickData = {};
    let done = 0;

    // نشغلو الكل دقة وحدة بدون انتظار
    await Promise.all(members.map(async (uid) => {
      try {
        const nick = await parseNickname(template, uid, usersData);
        await api.changeNickname(nick, uid, threadID);
        nickData[uid] = nick;
        done++;
      } catch (e) {
        // نتجاهلو الخطأ ونكملو
      }
    }));

    // حفظ دائم
    data.data.nicklock = {
      enabled: true,
      template: template,
      users: nickData,
      timestamp: Date.now()
    };
    await threadsData.set(threadID, { data: data.data });

    return message.reply(`✅ تم بنجاح\n👥 نجح: ${done}/${members.length}\n🔒 الحماية شغالة للأبد\nللإلغاء: /nicklock off`);
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType!== "log:user-nickname") return;

    const { threadID, author, logMessageData } = event;
    const targetID = logMessageData.participant_id;
    const botID = api.getCurrentUserID();

    // إلا البوت هو اللي بدل نتخطاوه
    if (author == botID) return;

    const data = await threadsData.get(threadID);
    const lock = data.data?.nicklock;

    if (lock?.enabled && lock.users?.[targetID]) {
      try {
        await api.changeNickname(lock.users[targetID], targetID, threadID);
      } catch (e) {
        // فشل السكوت
      }
    }
  }
};
