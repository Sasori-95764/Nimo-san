const axios = require("axios");

const simsim = "https://simsimi-api-tjb1.onrender.com";

const typing = async (api, threadID, ms = 2000) => {
  try {
    if (typeof api.sendTypingIndicator === "function") {
      await api.sendTypingIndicator(threadID, true);
      await new Promise(r => setTimeout(r, ms));
      await api.sendTypingIndicator(threadID, false);
    }
  } catch {}
};

module.exports = {
  config: {
    name:             "baby",
    aliases:          ["mari", "maria", "hippi", "xan", "bby", "bbz", "بيبي", "مرحبا"],
    version:          "4.0",
    author:           "rX / EryXenX (Arabic support)",
    countDown:        0,
    role:             0,
    shortDescription: "دردش مع بيبي AI",
    longDescription:  "AI قابل للتعليم بدعم عربي كامل — دردشة، تعليم، قوائم وأكثر",
    category:         "box chat",
    guide: {
      ar: "{p}baby [رسالة]\n{p}baby علم [سؤال] - [جواب]\n{p}baby autoteach on/off\n{p}baby قائمة\n{p}baby احذف [سؤال] - [جواب]",
      en: "{p}baby [message]\n{p}baby teach [q] - [a]\n{p}baby autoteach on/off\n{p}baby list\n{p}baby remove [q] - [a]"
    }
  },

  // Arabic random greetings
  _arGreetings: [
    "أهلين يا عزيزي 💖", "هلا فيك 😊", "نعم، أنا هنا 😘",
    "بقولك ايش؟ 🥰", "أوامرك 🌸", "هلو! كيف أساعدك؟ 😄"
  ],

  onStart: async function ({ api, event, args, message, usersData }) {
    const senderID   = event.senderID;
    const senderName = await usersData.getName(senderID);
    const threadID   = event.threadID;
    const query      = args.join(" ").trim().toLowerCase();

    try {
      if (!query) {
        await typing(api, threadID, 1500);
        const ran = this._arGreetings;
        return message.reply(ran[Math.floor(Math.random() * ran.length)], (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }

      // AUTOTEACH
      if (["autoteach", "تدريس-تلقائي"].includes(args[0])) {
        const mode = args[1]?.toLowerCase();
        if (!["on", "off", "تشغيل", "إيقاف"].includes(mode))
          return message.reply("استخدم: baby autoteach on/off");
        const status = ["on", "تشغيل"].includes(mode);
        await axios.post(`${simsim}/setting`, { autoTeach: status }, { timeout: 10000 });
        return message.reply(`✅ التدريس التلقائي: ${status ? "مفعّل 🟢" : "موقوف 🔴"}`);
      }

      // LIST / قائمة
      if (["list", "قائمة"].includes(args[0])) {
        const res = await axios.get(`${simsim}/list`, { timeout: 10000 });
        return message.reply(
`╭─╼🌟 حالة بيبي AI
├ 📝 الأسئلة المعلّمة: ${res.data.totalQuestions || 0}
├ 📦 الأجوبة المخزّنة: ${res.data.totalReplies || 0}
╰─╼👤 المطور: EryXenX`
        );
      }

      // TEACH / علّم
      if (["teach", "علم", "علّم"].includes(args[0])) {
        const parts = query.replace(/^(teach|علم|علّم)\s+/i, "").split(" - ");
        if (parts.length < 2) return message.reply("الاستخدام: baby علم سؤال - جواب");
        const [ask, ans] = parts.map(s => s.trim());
        const res = await axios.get(
          `${simsim}/teach?ask=${encodeURIComponent(ask)}&ans=${encodeURIComponent(ans)}&senderName=${encodeURIComponent(senderName)}&senderID=${senderID}`,
          { timeout: 10000 }
        );
        return message.reply(res.data.message || "✅ تم الحفظ بنجاح!");
      }

      // REMOVE / احذف
      if (["remove", "rm", "احذف", "امسح"].includes(args[0])) {
        const parts = query.replace(/^(remove|rm|احذف|امسح)\s+/i, "").split(" - ");
        if (parts.length < 2) return message.reply("الاستخدام: baby احذف سؤال - جواب");
        const [ask, ans] = parts.map(s => s.trim());
        const res = await axios.delete(
          `${simsim}/remove`,
          { data: { ask, ans }, timeout: 10000 }
        );
        return message.reply(res.data.message || "✅ تم الحذف!");
      }

      // Regular chat
      await typing(api, threadID, 2000);
      const res = await axios.get(
        `${simsim}/simsimi?text=${encodeURIComponent(query)}&senderName=${encodeURIComponent(senderName)}`,
        { timeout: 15000 }
      );
      const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];
      for (const r of replies) {
        await message.reply(r, (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }

    } catch (err) {
      console.error("[baby onStart]", err.message);
      message.reply("معذرة، حدث خطأ. حاول مرة أخرى 😅");
    }
  },

  onReply: async function ({ api, event, message, usersData }) {
    const senderName = await usersData.getName(event.senderID);
    const raw        = (event.body || "").trim().toLowerCase();
    const threadID   = event.threadID;

    if (!raw) return;

    try {
      await typing(api, threadID, 1500);
      const res = await axios.get(
        `${simsim}/simsimi?text=${encodeURIComponent(raw)}&senderName=${encodeURIComponent(senderName)}`,
        { timeout: 15000 }
      );
      const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];
      for (const r of replies) {
        await message.reply(r, (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }
    } catch {
      const fallbacks = ["ما فهمت 😅", "قلها بطريقة ثانية 🙃", "هممم... 🤔"];
      message.reply(fallbacks[Math.floor(Math.random() * fallbacks.length)], (err, info) => {
        if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
      });
    }
  },

  onChat: async function ({ api, event, message, usersData }) {
    if (!event.body) return;
    const raw      = event.body.trim().toLowerCase();
    const threadID = event.threadID;

    // Arabic + English trigger prefixes
    const prefixes = [
      "baby ", "bby ", "xan ", "bbz ", "mari ", "بيبي ", "baby,", "baby؟", "يا بيبي"
    ];
    const prefix = prefixes.find(p => raw.startsWith(p) || raw === p.trim());
    if (!prefix) return;

    const q = raw.replace(prefix, "").trim();
    if (!q) return;

    try {
      const senderName = await usersData.getName(event.senderID);
      await typing(api, threadID, 1500);
      const res = await axios.get(
        `${simsim}/simsimi?text=${encodeURIComponent(q)}&senderName=${encodeURIComponent(senderName)}`,
        { timeout: 15000 }
      );
      const replies = Array.isArray(res.data.response) ? res.data.response : [res.data.response];
      for (const r of replies) {
        await message.reply(r, (err, info) => {
          if (!err) global.GoatBot.onReply.set(info.messageID, { commandName: "baby" });
        });
      }
    } catch (err) {
      console.error("[baby onChat]", err.message);
    }
  }
};
