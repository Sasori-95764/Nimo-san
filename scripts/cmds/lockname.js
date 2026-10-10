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
    countDown: 0,
    role: 2,
    description: { en: "Change nicknames one by one with a 5-second delay and permanent protection." },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} <nickname>: تغيير كنيات الأعضاء واحد تلو الآخر بفاصل 5 ثوانٍ\n{pn} unlock: إلغاء القفل\n{pn} status: الحالة"
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
      return message.reply("🔓 تم إلغاء القفل وحماية الكُنيات نهائيا.");
    }

    // الحالة
    if (args[0] === "status") {
      if (data.data.nickLock?.enabled) {
        const count = Object.keys(data.data.nickLock.users || {}).length;
        return message.reply(`🔒 الحماية شغالة\nالقالب: ${data.data.nickLock.template}\nالمحميين: ${count}`);
      }
      return message.reply("🔓 الحماية مطفية حالياً.");
    }

    const nickname = args.join(" ");
    if (!nickname) return message.reply("يرجى إدخال الكنية\nمثال: /lockname 🔥 {userName}");

    const { participantIDs } = await api.getThreadInfo(threadID);
    const members = participantIDs.filter(id => id !== botID);

    await message.reply(`⏳ سيتم تغيير الكنيات لـ ${members.length} عضو (بين كل شخص والشخص الآخر 5 ثوانٍ)...`);

    const nickMap = {};
    let success = 0;

    // تنفيذ التغيير واحد تلو الآخر مع تأخير 5 ثوانٍ بين كل عضو
    for (const uid of members) {
      try {
        const finalName = await checkShortCut(nickname, uid, usersData);
        await api.changeNickname(finalName, threadID, uid);
        nickMap[uid] = finalName;
        success++;
        // الانتظار 5 ثوانٍ (5000 ميلي ثانية) قبل الانتقال للشخص التالي
        await new Promise(resolve => setTimeout(resolve, 5000));
      } catch (e) {
        // تجاهل الأخطاء البسيطة ومتابعة البقية
      }
    }

    // حفظ القالب وقائمة الأعضاء لتفعيل الحماية الدائمة (أي شخص يغير كنيته يرجعها بعد 5 ثوانٍ)
    data.data.nickLock = {
      enabled: true,
      template: nickname,
      users: nickMap,
      updated: Date.now()
    };
    await threadsData.set(threadID, { data: data.data });

    return message.reply(`✅ انتهت العملية بنجاح\n👥 نجح: ${success}/${members.length}\n🔒 الحماية الدائمة مفعلة (أي تغيير يتم إرجاعه تلقائياً)\nللإلغاء: /lockname unlock`);
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType !== "log:user-nickname") return;

    const { threadID, author, logMessageData } = event;
    const targetUID = logMessageData.participant_id;
    const botID = api.getCurrentUserID();

    if (author == botID) return; // تجاهل إذا كان البوت هو من قام بالتغيير

    const data = await threadsData.get(threadID);
    const lock = data.data?.nickLock;

    // إذا قام شخص بتغيير كنيته والميزة مفعلة، نقوم بإرجاعها بعد 5 ثوانٍ
    if (lock?.enabled && lock.users?.[targetUID]) {
      setTimeout(async () => {
        try {
          await api.changeNickname(lock.users[targetUID], threadID, targetUID);
        } catch (e) {}
      }, 5000);
    }
  }
};
