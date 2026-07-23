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

// طابور الموت - كيعاود للأبد
const deathQueue = new Map();
const activeThreads = new Set();

async function eternalRetry(api, nick, threadID, uid) {
  const key = `${threadID}_${uid}`;

  try {
    await api.changeNickname(nick, threadID, uid);
    deathQueue.delete(key); // نجح = حيدو من الطابور
  } catch (e) {
    // فشل = خليه فالطابور وغادي نعاودو فالدورة الجاية
    deathQueue.set(key, { nick, threadID, uid, lastTry: Date.now() });
  }
}

// المحرك: كيدور كل ثانية ويعاود الفاشلين
setInterval(() => {
  if (deathQueue.size === 0) return;

  const now = Date.now();
  deathQueue.forEach((item, key) => {
    // عاود المحاولة كل ثانيتين باش ما نضغطوش على فيسبوك
    if (now - item.lastTry > 2000) {
      // نجيبو api من أي بلاصة - خاصو يكون global
      if (global.api) {
        eternalRetry(global.api, item.nick, item.threadID, item.uid);
      }
    }
  });
}, 1000);

module.exports = {
  config: {
    name: "warmod",
    aliases: ["war"],
    version: "4.0",
    author: "WarMode",
    countDown: 0,
    role: 2,
    description: { en: "Death queue - retries forever automatically" },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} on <nickname>: تشغيل الحماية\n{pn} off: إيقاف الحماية\n{pn} queue: شوف الطابور"
      }
    }
  },

  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    global.api = api; // نخزنو api باش نستعملوه فالطابور
    const data = await threadsData.get(threadID);
    data.data = data.data || {};

    if (args[0] === "off") {
      data.data.warmod = null;
      activeThreads.delete(threadID);
      // نحيدو كلشي ديال هاد الغروب من الطابور
      for (const key of deathQueue.keys()) {
        if (key.startsWith(threadID)) deathQueue.delete(key);
      }
      await threadsData.set(threadID, { data: data.data });
      return message.reply("🔓 تم إيقاف وضع الحرب + تفريغ الطابور");
    }

    if (args[0] === "queue") {
      let count = 0;
      deathQueue.forEach((v, k) => {
        if (k.startsWith(threadID)) count++;
      });
      return message.reply(`💀 طابور الموت: ${count} كنية باقا كتحاول\nالبوت غادي يعاودها بوحدو كل ثانيتين`);
    }

    if (args[0] === "on") {
      const nickname = args.slice(1).join(" ");
      if (!nickname) return message.reply("دخل الكنية\nمثال: /warmod on 👑 {userName}");

      const { participantIDs } = await api.getThreadInfo(threadID);
      const members = participantIDs.filter(id => id!= botID);

      await message.reply(`⚡ تشغيل وضع طابور الموت لـ ${members.length} عضو...`);

      const nickMap = {};
      await Promise.all(members.map(async (uid) => {
        try {
          const finalName = await checkShortCut(nickname, uid, usersData);
          nickMap[uid] = finalName;
          // نحطو الكل فالطابور، والمحرك غادي يعالجهم
          eternalRetry(api, finalName, threadID, uid);
        } catch (e) {}
      }));

      data.data.warmod = {
        enabled: true,
        template: nickname,
        users: nickMap,
        lastUpdate: Date.now()
      };
      await threadsData.set(threadID, { data: data.data });
      activeThreads.add(threadID);

      return message.reply(`✅ تم تشغيل وضع طابور الموت\n👥 عدد الأعضاء: ${members.length}\n💀 البوت غادي يعاود للأبد بوحدو\nشوف الطابور: /warmod queue\nللإيقاف: /warmod off`);
    }

    return message.reply("استعمل:\n/warmod on <كنية> : للتشغيل\n/warmod off : للإيقاف\n/warmod queue : شوف الطابور");
  },

  onEvent: async function ({ event, api, threadsData }) {
    if (event.logMessageType!== "log:user-nickname") return;

    const { threadID, author, logMessageData } = event;
    const targetUID = logMessageData.participant_id;
    const botID = api.getCurrentUserID();

    if (author == botID) return;

    const data = await threadsData.get(threadID);
    const lock = data.data?.warmod;

    if (lock?.enabled && lock.users?.[targetUID]) {
      // ما كنتسناوش، كنحطوها فالطابور والمحرك غادي يتكلف
      eternalRetry(api, lock.users[targetUID], threadID, targetUID);
    }
  }
};
