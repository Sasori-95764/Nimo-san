async function checkShortCut(nickname, uid, usersData) {
  try {
    /\{userName\}/gi.test(nickname)? nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid)) : null;
    /\{userID\}/gi.test(nickname)? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
    return nickname;
  } catch (e) {
    return nickname;
  }
}

module.exports = {
  config: {
    name: "lockname",
    version: "2.3",
    author: "Gemini + Fix",
    countDown: 5,
    role: 2,
    description: { en: "Lock nickname for all members." },
    category: "box chat",
    guide: {
      en: {
        body: " {pn} <nickname>: قفل الكنية لجميع الأعضاء\nمثال: {pn} 🔥 عضو رسمي"
      }
    }
  },
  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const nickname = args.join(" ");
    if (!nickname) return message.reply("دخل الكنية اللي بغيتي تقفل بيها للكل 👑\nمثال: /lockname 🔥 {userName}");
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    const { participantIDs } = await api.getThreadInfo(threadID);
    let success = 0;
    let fail = 0;
    let failReason = "";
    const lockedNicknames = {};
    const msg = await message.reply(`🔒 كنقفل الكنية لـ ${participantIDs.length} عضو...`);

    for (const uid of participantIDs) {
      if (uid == botID) continue; // نتخطاو البوت راسو

      try {
        const finalName = await checkShortCut(nickname, uid, usersData);
        await api.changeNickname(finalName, threadID, uid);
        lockedNicknames[uid] = finalName;
        success++;
      } catch (e) {
        fail++;
        if (!failReason) failReason = e.error || e.message || "Unknown error"; // نحفظو سبب الفشل
      }
    }

    const data = await threadsData.get(threadID);
    data.data.lockedNicknames = lockedNicknames;
    await threadsData.set(threadID, { data: data.data });

    let replyMsg = `✅ تم قفل الكنية\n👥 نجح: ${success}\n❌ فشل: ${fail}`;
    if (fail > 0) replyMsg += `\n\nالسبب: ${failReason}`;
    if (success > 0) replyMsg += `\n\nدابا أي واحد بدل كنيتو البوت غادي يرجعها أوتوماتيك.`;

    return message.reply(replyMsg, msg.messageID);
  },
  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType === "log:user-nickname") {
      const threadID = event.threadID;
      const targetUID = event.logMessageData.participant_id;
      const authorID = event.author;
      const botID = api.getCurrentUserID();
      const data = await threadsData.get(threadID);
      const lockedNicknames = data.data?.lockedNicknames;
      if (lockedNicknames && lockedNicknames[targetUID] && authorID!== botID) {
        const protectedName = lockedNicknames[targetUID];
        try {
          await api.changeNickname(protectedName, threadID, targetUID);
        } catch (e) {
          console.log(`[LOCKNAME] Failed to revert: ${e.error || e.message}`);
        }
      }
    }
  }
};
