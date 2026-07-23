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

const deathQueue = new Map();
const groupNameQueue = new Map();
let deathEngine = null;
let currentApi = null;

function startDeathEngine() {
  if (deathEngine) return;
  deathEngine = setInterval(async () => {
    if (!currentApi) return;
    const now = Date.now();
    deathQueue.forEach((item, key) => {
      if (now - item.lastTry > 2000) {
        eternalRetry(currentApi, item.nick, item.threadID, item.uid);
      }
    });
    groupNameQueue.forEach((item, threadID) => {
      if (now - item.lastTry > 3000) {
        eternalRetryGroupName(currentApi, item.groupName, threadID);
      }
    });
  }, 1000);
}

async function eternalRetry(api, nick, threadID, uid) {
  const key = `${threadID}_${uid}`;
  currentApi = api;
  startDeathEngine();
  try {
    await api.changeNickname(nick, threadID, uid);
    deathQueue.delete(key);
  } catch (e) {
    deathQueue.set(key, { nick, threadID, uid, lastTry: Date.now() });
  }
}

async function eternalRetryGroupName(api, groupName, threadID) {
  currentApi = api;
  startDeathEngine();
  try {
    await api.setTitle(groupName, threadID);
    groupNameQueue.delete(threadID);
  } catch (e) {
    groupNameQueue.set(threadID, { groupName, lastTry: Date.now() });
  }
}

module.exports = {
  config: {
    name: "dark", // السمية الجديدة
    aliases: ["d", "shadow"], // اختصارات خطيرة
    version: "5.0",
    author: "DarkMode",
    countDown: 0,
    role: 2,
    description: { en: "DARK v5.0 - The Eternal War Protocol" },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} on nick <كنية>: قفل الكنيات\n{pn} on group <اسم>: قفل اسم الكروب\n{pn} off: إيقاف الظلام\n{pn} queue: طابور الموت\n{pn} revive: إحياء الظلام"
      }
    }
  },

  onStart: async function ({ args, message, event, api, usersData, threadsData }) {
    const threadID = event.threadID;
    const botID = api.getCurrentUserID();
    currentApi = api;
    startDeathEngine();
    const data = await threadsData.get(threadID);
    data.data = data.data || {};
    data.data.dark = data.data.dark || {}; // بدلنا warmod بـ dark

    if (args[0] === "off") {
      data.data.dark = null;
      for (const key of deathQueue.keys()) {
        if (key.startsWith(threadID)) deathQueue.delete(key);
      }
      groupNameQueue.delete(threadID);
      await threadsData.set(threadID, { data: data.data });
      return message.reply("🌑 تم إطفاء الظلام + تفريغ طوابير الموت");
    }

    if (args[0] === "revive") {
      const lock = data.data.dark;
      if (!lock?.nickEnabled &&!lock?.groupEnabled) return message.reply("❌ الظلام خامد أصلا");
      let revived = 0;
      if (lock.nickEnabled) {
        Object.keys(lock.users).forEach(uid => {
          eternalRetry(api, lock.users[uid], threadID, uid);
          revived++;
        });
      }
      if (lock.groupEnabled) {
        eternalRetryGroupName(api, lock.groupName, threadID);
        revived++;
      }
      startDeathEngine();
      return message.reply(`🩸 تم إحياء الظلام\n⚔️ رجعنا ${revived} روح للطابور`);
    }

    if (args[0] === "queue") {
      let nickCount = 0;
      deathQueue.forEach((v, k) => {
        if (k.startsWith(threadID)) nickCount++;
      });
      const groupCount = groupNameQueue.has(threadID)? 1 : 0;
      const engineStatus = deathEngine? "✅ ينبض" : "❌ خامد";
      return message.reply(`💀 طابور الأرواح: ${nickCount}\n🏷️ طابور الهوية: ${groupCount}\n🔧 قلب الظلام: ${engineStatus}`);
    }

    if (args[0] === "on") {
      if (args[1] === "nick") {
        const nickname = args.slice(2).join(" ");
        if (!nickname) return message.reply("دخل الكنية\nمثال: /dark on nick 🖤 {userName}");
        const { participantIDs } = await api.getThreadInfo(threadID);
        const members = participantIDs.filter(id => id!= botID);
        await message.reply(`🌑 نشر الظلام على ${members.length} عضو...`);
        const nickMap = {};
        await Promise.all(members.map(async (uid) => {
          const finalName = await checkShortCut(nickname, uid, usersData);
          nickMap[uid] = finalName;
          eternalRetry(api, finalName, threadID, uid);
        }));
        data.data.dark.nickEnabled = true;
        data.data.dark.template = nickname;
        data.data.dark.users = nickMap;
        await threadsData.set(threadID, { data: data.data });
        return message.reply(`✅ الظلام ابتلع الكنيات\n👥 الضحايا: ${members.length}\n💀 الطابور الأبدي خدام`);
      }

      if (args[1] === "group") {
        const groupName = args.slice(2).join(" ");
        if (!groupName) return message.reply("دخل اسم الكروب\nمثال: /dark on group 🌑 مملكة الظلام");
        eternalRetryGroupName(api, groupName, threadID);
        data.data.dark.groupEnabled = true;
        data.data.dark.groupName = groupName;
        await threadsData.set(threadID, { data: data.data });
        return message.reply(`✅ الظلام ابتلع هوية الكروب\n🏷️ الاسم: ${groupName}\n💀 الطابور الأبدي خدام`);
      }
      return message.reply("استعمل:\n/dark on nick <كنية>\n/dark on group <اسم الكروب>");
    }
    return message.reply("أوامر الظلام:\n/dark on nick <كنية> : لعن الكنيات\n/dark on group <اسم> : لعن اسم الكروب\n/dark off : إيقاف الظلام\n/dark queue : طابور الموت\n/dark revive : إحياء الظلام");
  },

  onEvent: async function ({ event, api, threadsData }) {
    const { threadID, logMessageType, author, logMessageData } = event;
    const botID = api.getCurrentUserID();
    currentApi = api;
    startDeathEngine();
    if (author == botID) return;
    const data = await threadsData.get(threadID);
    const lock = data.data?.dark; // بدلنا warmod بـ dark

    if (logMessageType === "log:user-nickname") {
      const targetUID = logMessageData.participant_id;
      if (lock?.nickEnabled && lock.users?.[targetUID]) {
        eternalRetry(api, lock.users[targetUID], threadID, targetUID);
      }
    }
    if (logMessageType === "log:thread-name") {
      if (lock?.groupEnabled && lock.groupName) {
        eternalRetryGroupName(api, lock.groupName, threadID);
      }
    }
  }
};
