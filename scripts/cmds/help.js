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

    api.sendTypingIndicator(event.threadID);

    const page = parseInt(args[0]) || 1;
    const perPage = 5; // غير هنا

    const allCommands = [
      {
        category: "〘 الـنـظـام ⚙️ 〙",
        cmds: [
          { name: "help", desc: "عـرض شـرح الاوامـر" },
          { name: "restart", desc: "اعـادة تـشـغـيـل الـبـوت" },
          { name: "spam", desc: "ارسـال رسـائـل سـبـام" },
          { name: "prefix", desc: "تـغـيـيـر الـبـادئـة" }
        ]
      },
      {
        category: "〘 الـذكـاء - الاصـطـنـاعـي 🤖 〙",
        cmds: [
          { name: "gpt", desc: "دردشـة مـع الـذكـاء الاصـطـنـاعـي" },
          { name: "gemini", desc: "الـرد بـاسـتـخـدام Gemini AI" },
          { name: "4k", desc: "تـحـسـيـن جـودة الـصـورة لـ 4K" }
        ]
      },
      {
        category: "〘 الـصـور - AI 🖼️ 〙",
        cmds: [
          { name: "flux", desc: "تـولـيـد صـور بـ Flux" },
          { name: "imagen3", desc: "تـولـيـد صـور بـ Imagen3" },
          { name: "sdxl", desc: "تـولـيـد صـور بـ SDXL" }
        ]
      },
      {
        category: "〘 المجموعة 📦 〙",
        cmds: [
          { name: "groupimg", desc: "تـغـيـيـر صـورة الـمـجـمـوعـة" },
          { name: "groupname", desc: "تـغـيـيـر اسـم الـمـجـمـوعـة" }
        ]
      },
      {
        category: "〘 الـمـرح 🎮 〙",
        cmds: [
          { name: "blur", desc: "تـشـويـش" },
          { name: "butslap", desc: "صـفـعـة" },
          { name: "pair", desc: "تـزويـج عـضـويـن" }
        ]
      }
      // زيد فئات كثر...
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

    await new Promise(r => setTimeout(r, 5000));
    const info = await message.reply(msg);
    setTimeout(() => {
      api.unsendMessage(info.messageID);
    }, 30000);

  }
};
