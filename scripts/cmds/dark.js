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
    name: "dark",
    aliases: ["d", "shadow"],
    version: "5.0",
    author: "DarkMode",
    countDown: 0,
    role: 2,
    description: { en: "DARK v5.0 - The Eternal War Protocol" },
    category: "box chat",
    guide: {
      en: {
        body: "{pn} on nick <لقب>: تجميد الألقاب\n{pn} on group <اسم>: تثبيت عنوان المجموعات\n{pn} off: تعطيل النظام\n{pn} queue: طابور المهام\n{pn} revive: إعادة تشغيل النظام"
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
    data.data.dark = data.data.dark || {};

    if (args[0] === "off") {
      data.data.dark = null;
      for (const key of deathQueue.keys()) {
        if (key.startsWith(threadID)) deathQueue.delete(key);
      }
      groupNameQueue.delete(threadID);
      await threadsData.set(threadID, { data: data.data });
      return message.reply("⚙️ تم إيقاف النظام الميداني + تنظيف سجلات الانتظار.");
    }

    if (args[0] === "revive") {
      const lock = data.data.dark;
      if (!lock?.nickEnabled && !lock?.groupEnabled) return message.reply("⚠️ النظام متوقف في الأساس.");
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
      return message.reply(`🔄 تم إعادة إقلاع النظام\n⚡ تمت استعادة ${revived} مهمة للطابور`);
    }

    if (args[0] === "queue") {
      let nickCount = 0;
      deathQueue.forEach((v, k) => {
        if (k.startsWith(threadID)) nickCount++;
      });
      const groupCount = groupNameQueue.has(threadID) ? 1 : 0;
      const engineStatus = deathEngine ? "🟢 نشط" : "🔴 متوقف";
      return message.reply(`📊 طابور الألقاب: ${nickCount}\n🏷️ طابور الهوية: ${groupCount}\n⚡ حالة المعالج: ${engineStatus}`);
    }

    if (args[0] === "on") {
      if (args[1] === "nick") {
        const nickname = args.slice(2).join(" ");
        if (!nickname) return message.reply("⚠️ يرجى إدخال اللقب المطلوب\nمثال: /dark on nick 🖤 {userName}");
        const { participantIDs } = await api.getThreadInfo(threadID);
        const members = participantIDs.filter(id => id !== botID);
        await message.reply(`⏳ جاري تطبيق التغييرات على ${members.length} عضو...`);
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
        return message.reply(`✅ تم تعميم الألقاب بنجاح\n👥 الأعضاء المستهدفون: ${members.length}\n⚡ طابور المزامنة يعمل`);
      }

      if (args[1] === "group") {
        const groupName = args.slice(2).join(" ");
        if (!groupName) return message.reply("⚠️ يرجى إدخال عنوان المجموعة\nمثال: /dark on group 🌑 الحصن الحصين");
        eternalRetryGroupName(api, groupName, threadID);
        data.data.dark.groupEnabled = true;
        data.data.dark.groupName = groupName;
        await threadsData.set(threadID, { data: data.data });
        return message.reply(`✅ تم تأمين هوية المجموعة بنجاح\n🏷️ العنوان: ${groupName}\n⚡ طابور المزامنة يعمل`);
      }
      return message.reply("💡 الصيغة الصحيحة للاستخدام:\n/dark on nick <اللقب>\n/dark on group <عنوان المجموعة>");
    }
    return message.reply("📋 قائمة الأوامر المتاحة:\n/dark on nick <اللقب> : تجميد الألقاب\n/dark on group <اسم> : تثبيت اسم المجموعة\n/dark off : إيقاف النظام\n/dark queue : عرض الطابور\n/dark revive : إعادة التشغيل");
  },

  onEvent: async function ({ event, api, threadsData }) {
    const { threadID, logMessageType, author, logMessageData } = event;
    const botID = api.getCurrentUserID();
    currentApi = api;
    startDeathEngine();
    if (author == botID) return;
    const data = await threadsData.get(threadID);
    const lock = data.data?.dark;

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
