async function checkShortCut(nickname, uid, usersData) {
  try {
    /\{userName\}/gi.test(nickname)? nickname = nickname.replace(/\{userName\}/gi, await usersData.getName(uid)) : null;
    /\{userID\}/gi.test(nickname)? nickname = nickname.replace(/\{userID\}/gi, uid) : null;
    return nickname;
  } catch (e) {
    return nickname;
  }
}

// Global storage to track nicknames for protection
global.nicknameProtection = global.nicknameProtection || {};

module.exports = {
  config: {
    name: "lockname",
    version: "2.1",
    author: "Gemini + Fix",
    countDown: 5,
    role: 2, // 0 = الكل, 1 = أدمن الجروب, 2 = أدمن البوت فقط
    description: {
      en: "Lock nickname for all members. Only bot admin can use."
    },
    category: "box chat",
    guide: {
      en: {
        body: " {pn} <nickname>: قفل الكنية لجميع الأعضاء\nمثال: {pn} 🔥 عضو رسمي\n\nتقدر تستعمل: {userName} = اسم العضو, {userID} = ID العضو"
      }
    }
  },

  onStart: async function ({ args, message, event, api, usersData }) {
    const nickname = args.join(" ");
    if (!nickname) return message.reply("دخل الكنية اللي بغيتي تقفل بيها للكل 👑\nمثال: /lockname 🔥 {userName}");

    const threadID = event.threadID;
    const { participantIDs } = await api.getThreadInfo(threadID);

    let success = 0;
    let fail = 0;

    const msg = await message.reply(`🔒 كنقفل الكنية لـ ${participantIDs.length} عضو...`);

    for (const uid of participantIDs) {
      try {
        const finalName = await checkShortCut(nickname, uid, usersData);
        await api.changeNickname(finalName, threadID, uid);

        // Save to protection list
        global.nicknameProtection[threadID] = global.nicknameProtection[threadID] || {};
        global.nicknameProtection[threadID][uid] = finalName;
        success++;
      } catch (e) {
        fail++;
      }
    }

    return message.reply(`✅ تم قفل الكنية\n👥 نجح: ${success}\n❌ فشل: ${fail}\n\nدابا أي واحد بدل كنيتو البوت غادي يرجعها أوتوماتيك.`, msg.messageID);
  },

  onEvent: async function ({ event, api }) {
    if (event.logMessageType === "log:user-nickname") {
      const threadID = event.threadID;
      const targetUID = event.logMessageData.participant_id;
      const authorID = event.author;
      const botID = api.getCurrentUserID();

      // If protection exists and someone else changed the nickname
      if (global.nicknameProtection[threadID] && global.nicknameProtection[threadID][targetUID] && authorID!== botID) {
        const protectedName = global.nicknameProtection[threadID][targetUID];
        try {
          await api.changeNickname(protectedName, threadID, targetUID);
        } catch (e) {
          // Silent fail if bot lacks permission
        }
      }
    }
  }
};
