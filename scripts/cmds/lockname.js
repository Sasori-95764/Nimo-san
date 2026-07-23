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
    version: "4.0",
    author: "Gemini + Fix",
    countDown: 0, // بلا انتظار
    role: 2,
    description: { en: "Lock nickname for all members instantly." },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} <nickname>: قفل الكنية فورا\n{pn} unlock: إلغاء القفل\n{pn} status: الحالة"
      }
    }
  },

  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    const data = await threadsData.get(threadID);
    data.data = data.data || {};

    // unlock
    if (args[0] === "unlock") {
      data.data.lockedNicknames = null;
      data.data.nicknameTemplate = null;
      await threadsData.set(threadID, { data: data.data });
      return message.reply("🔓 تم إلغاء قفل الكُنيات نهائيا.");
    }

    // status
    if (args[0] === "status") {
      if (data.data.nicknameTemplate) {
        const count = Object.keys(data.data.lockedNicknames || {}).length;
        return message.reply(`🔒 القفل خدام\nالقالب: "${data.data.nicknameTemplate}"\nالمحميين: ${count}`);
      } else {
        return message.reply("🔓 ما كاينش قفل دابا");
      }
    }

    const nickname = args.join(" ");
    if (!nickname) return message.reply("دخل الكنية\nمثال: /lockname 🔥 {userName}");

    const { participantIDs } = await api.getThreadInfo(threadID);
    const lockedNicknames = {};

    // نرسلو الرد ومن بعد نبدلو بسرعة
    message.reply(`⚡ كنقفل الكنية لـ ${participantIDs.length} عضو بسرعة...`);

    // نبدلو الكل دقة وحدة بلا انتظار
    const promises = participantIDs.map(async (uid) => {
      if (uid == botID) return { uid, status: 'skip' };
      try {
        const finalName = await checkShortCut(nickname, uid, usersData);
        await api.changeNickname(finalName, uid, threadID);
        lockedNicknames[uid] = finalName;
        return { uid, status: 'success' };
      } catch (e) {
        return { uid, status: 'fail', error: e.error || e.message };
      }
    });

    const results = await Promise.all(promises);
    const success = results.filter(r => r.status === 'success').length;
    const fail = results.filter(r => r.status === 'fail').length;

    // نحفظو فالداتابيز = حماية دائمة
    data.data.lockedNicknames = lockedNicknames;
    data.data.nicknameTemplate = nickname;
    await threadsData.set(threadID, { data: data.data });

    let replyMsg = `✅ تم فـ رمشة عين\n👥 نجح: ${success}\n❌ فشل: ${fail}`;
    if (fail > 0) replyMsg += `\nالسبب: ${results.find(r => r.status === 'fail')?.error}`;
    if (success > 0) replyMsg += `\n\n🔒 الحماية خدامة للأبد حتى دير /lockname unlock`;

    return message.reply(replyMsg);
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType === "log:user-nickname") {
      const threadID = event.threadID;
      const targetUID = event.logMessageData.participant_id;
      const authorID = event.author;
      const botID = api.getCurrentUserID();

      const data = await threadsData.get(threadID);
      const lockedNicknames = data.data?.lockedNicknames;

      // إلا كاين قفل وماشي البوت اللي بدلو = رجعو نيشان
      if (lockedNicknames && lockedNicknames[targetUID] && authorID!== botID) {
        try {
          await api.changeNickname(lockedNicknames[targetUID], targetUID, threadID);
        } catch (e) {}
      }
    }
  }
};
