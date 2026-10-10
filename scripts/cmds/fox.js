module.exports = {
  config: {
    name: "fox",
    aliases: ["fx", "f"],
    version: "2.0",
    author: "TOJI",
    countDown: 5,
    role: 0,
    shortDescription: "إرسال رسائل مجدولة بشكل مستمر",
    longDescription: "يقوم بإرسال الرسالة التي تكتبها بشكل دوري ومستمر كل دقيقة حتى يتم إيقافه بالأمر stop",
    category: "fun",
    guide: "{pn} [الرسالة] أو {pn} stop"
  },

  onStart: async ({ api, event, args }) => {
    const threadID = event.threadID;
    
    // تعريف الذاكرة الخاصة بالتكرار المستمر
    if (typeof global.foxTasks === "undefined") {
      global.foxTasks = {};
    }

    const action = args[0] ? args[0].toLowerCase() : "";

    // أمر الإيقاف
    if (action === "stop") {
      if (global.foxTasks[threadID]) {
        clearInterval(global.foxTasks[threadID].interval);
        delete global.foxTasks[threadID];
        return api.sendMessage("🛑 تم إيقاف نظام الإرسال المستمر بنجاح.", threadID);
      } else {
        return api.sendMessage("❌ لا يوجد أي إرسال مستمر يعمل حالياً في هذه المحادثة.", threadID);
      }
    }

    const msg = args.join(" ");
    if (!msg) return api.sendMessage("❌ يرجى كتابة الرسالة المراد إرسالها\nمثال: /fox السلام عليكم", threadID);

    // إيقاف أي تكرار سابق قد يكون يعمل في نفس المحادثة
    if (global.foxTasks[threadID]) {
      clearInterval(global.foxTasks[threadID].interval);
    }

    api.sendMessage(`✅ تم تفعيل الإرسال المستمر:\n"${msg}"\n(سيستمر البوت في الإرسال كل دقيقة حتى تكتب /fox stop)`, threadID);

    // تشغيل الإرسال المستمر كل 60 ثانية
    global.foxTasks[threadID] = {
      message: msg,
      interval: setInterval(async () => {
        try {
          if (typeof api.sendTypingIndicator === "function") {
            api.sendTypingIndicator(threadID, true);
            await new Promise(r => setTimeout(r, 2000));
            api.sendTypingIndicator(threadID, false);
          }
          await api.sendMessage(msg, threadID);
        } catch (e) {
          // تجاهل أخطاء الاتصال المؤقتة
        }
      }, 60000) // 60 ثانية بين كل رسالة والأخرى
    };
  }
};
