module.exports = {
  config: {
    name: "help",
    version: "1.0",
    author: "Xemon",
    countDown: 5,
    role: 0,
    description: "قائمة الأوامر",
    category: "نظام",
    guide: "{pn} [رقم الصفحة]"
  },
  onStart: async function({ message, event, api, args, prefix }) {
    try {
      api.sendTypingIndicator(event.threadID);

      const page = parseInt(args[0]) || 1;
      const perPage = 3;

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
        },
        {
          category: "〘 صـور - AI 🖼️ 〙",
          cmds: [
            { name: "flux", desc: "تـولـيـد صـور بـ Flux" },
            { name: "imagen3", desc: "تـولـيـد صـور بـ Imagen3" }
          ]
        }
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

      if(page < totalPages) {
        msg += `╭────────────❃\n│ اكتب ${prefix}help ${page + 1} للصفحة التالية\n╰──────────❃`;
      } else {
        msg += `╭────────────❃\n│ ⛁ وصلتي لآخر صفحة ⛁\n╰──────────❃`;
      }

      msg += `\n⏳ غادي تمسح هاد الرسالة تلقائيا بعد 30 ثانية`;

      await new Promise(r => setTimeout(r, 5000));
      const info = await message.reply(msg);
      setTimeout(() => {
        api.unsendMessage(info.messageID);
      }, 30000);

    } catch (error) {
      console.log(error);
      message.reply("خطأ في أمر help");
    }
  }
};
