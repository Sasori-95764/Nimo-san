async function checkShortCut(nickname, uid, usersData) {
  try {
    if (/\{userName\}/gi.test(nickname)) {
      nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid));
    }
    if (/\{userID\}/gi.test(nickname)) {
      nickname = nickname.replace(/\{userID\}/gi, uid);
    }
    return nickname;
  } catch (e) {
    return nickname;
  }
}

module.exports = {
  config: {
    name: "lockname",
    version: "3.0",
    author: "Gemini + Fix",
    countDown: 0, // سرعة البرق
    role: 2,
    description: { en: "Lock nickname for all members with permanent protection." },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} <nickname>: قفل الكنية\n{pn} unlock: إلغاء القفل\n{pn} status: الحالة"
      }
    }
  },

  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    const data = await threadsData.get(threadID);
    data.data = data.data || {};

    // إلغاء القفل
    if (args[0] === "unlock") {
      data.data.nickLock = null;
      await threadsData.set(threadID, { data: data.data });
      return message.reply("🔓 تم إلغاء قفل الكُنيات نهائيا");
    }

    // الحالة
    if (args[0] === "status") {
      if (data.data.nickLock?.enabled) {
        const count = Object.keys(data.data.nickLock.users || {}).length;
        return message.reply(`🔒 الحماية شغالة\nالقالب: ${data.data.nickLock.template}\nالمحميين: ${count}`);
      }
      return message.reply("🔓 الحماية مطفية");
    }

    const nickname = args.join(" ");
    if (!nickname) return message.reply("دخل الكنية\nمثال: /lockname 🔥 {userName}");

    const { participantIDs } = await api.getThreadInfo(threadID);
    const members = participantIDs.filter(id => id!= botID);

    await message.reply(`⚡ كنقفل لـ ${members.length} عضو بسرعة البرق...`);

    // سرعة البرق: Promise.all دقة وحدة
    const results = await Promise.all(members.map(async (uid) => {
      try {
        const finalName = await checkShortCut(nickname, uid, usersData);
        await api.changeNickname(finalName, threadID, uid);
        return { uid, nick: finalName, status: 'ok' };
      } catch (e) {
        return { uid, status: 'fail', error: e.error };
      }
    }));

    const nickMap = {};
    let success = 0;
    results.forEach(r => {
      if (r.status === 'ok') {
        nickMap[r.uid] = r.nick;
        success++;
      }
    });

    // حماية دائمة: نخزنو فـ threadsData
    data.data.nickLock = {
      enabled: true,
      template: nickname,
      users: nickMap,
      updated: Date.now()
    };
    await threadsData.set(threadID, { data: data.data });

    return message.reply(`✅ تم بسرعة البرق\n👥 نجح: ${success}/${members.length}\n🔒 حماية دائمة شغالة\nللإلغاء: /lockname unlock`);
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType!== "log:user-nickname") return;

    const { threadID, author, logMessageData } = event;
    const targetUID = logMessageData.participant_id;
    const botID = api.getCurrentUserID();

    if (author == botID) return; // إلا البوت هو اللي بدل

    const data = await threadsData.get(threadID);
    const lock = data.data?.nickLock;

    // الحماية الدائمة: نقراو من الداتابيز ماشي global
    if (lock?.enabled && lock.users?.[targetUID]) {
      try {
        await api.changeNickname(lock.users[targetUID], threadID, targetUID);
      } catch (e) {}
    }
  }
};
