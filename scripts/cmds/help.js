module.exports = {
  config: {
    name: "help",
    version: "1.0",
    author: "Xemon",
    countDown: 5,
    role: 0,
    description: "قائمة الأوامر مع تأخير",
    category: "نظام",
    guide: "{pn} [رقم الصفحة]"
  },

  onStart: async function({ message, event, api, args, prefix }) {

    // 1. خلي البوت يبان كايكتب
    api.sendTypingIndicator(event.threadID);

    // 2. تجهيز الرسالة
    const page = parseInt(args[0]) || 1;
    const perPage = 2;

    const allCommands = [
      {
        category: "〘 الـنـظـام ⚙️ 〙",
        cmds: [
          { name: "help", desc: "عـرض شـرح الاوامـر" },
          { name: "restart", desc: "اعـادة تـشـغـيـل الـبـوت" }
        ]
      },
      {
        category: "〘 الـذكـاء - الاصـطـنـاعـي 🤖 〙",
        cmds: [
          { name: "gpt", desc: "دردشـة مـع الـذكـاء الاصـطـنـاعـي" },
          { name: "gemini", desc: "الـرد بـاسـتـخـدام Gemini AI" }
        ]
      }
      // زيد باقي الفئات هنا...
    ];

    const totalPages = Math.ceil(allCommands.length / perPage);
    if (page > totalPages) return message.reply(`كاين ${totalPages} صفحات فقط`);

    const start = (page - 1) * perPage;
    const pageData = allCommands.slice(start, start + perPage);

    let msg = `❀━━━━━━━━━━━━━━❀\n🇲🇦 𝑵𝑶𝑳𝑨𝑵 𝑪𝑯𝑨𝑻𝑩𝑶𝑻 🇲🇦\n❀━━━━━━━━━━━━━━❀\n`;
    msg += `📄 صفحة ${page}/${totalPages} | 🔧 البادئة: ${prefix}\n`;

    for (const cat of pageData) {
      msg += `╭───────────❃\n│${cat.category}\n╭─────❤─❤─────❃\n`;
      for (const cmd of cat.cmds) {
        msg += `🔹 ${prefix}${cmd.name} → ${cmd.desc}\n`;
      }
      msg += `╰──────❤─❤──────❍\n`;
    }
    msg += `╭────────────❃\n│ اكتب ${prefix}help ${page + 1} للصفحة التالية\n╰──────────❃`;
    msg += `\n⏳ غادي تمسح هاد الرسالة تلقائيا بعد 30 ثانية`;

    // 3. تسنا 5 ثواني عاد صيفط - هادي اللي طلبتي
    await new Promise(r => setTimeout(r, 5000)); // 5000 = 5 ثواني

    // 4. صيفط الرسالة
    const info = await message.reply(msg);

    // 5. حذف تلقائي بعد 30 ثانية
    setTimeout(() => {
      api.unsendMessage(info.messageID);
    }, 30000);

  }
};
