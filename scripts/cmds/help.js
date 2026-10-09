module.exports = {
  config: {
    name: "help",
    version: "2.0",
    author: "TOJI",
    countDown: 5,
    role: 0,
    description: "قائمة الأوامر الشاملة والفخمة",
    category: "نظام",
    guide: "{pn} [رقم الصفحة]"
  },
  
  onStart: async function({ message, event, api, args, prefix }) {
    try {
      if (typeof api.sendTypingIndicator === "function") {
        api.sendTypingIndicator(event.threadID);
      }

      const page = parseInt(args[0]) || 1;
      const perPage = 2; // عدد التصنيفات في كل صفحة لكي تكون القائمة مرتبة ومتوسطة الحجم

      // جلب جميع الأوامر من نظام البوت تلقائياً
      const commands = global.GoatBot.commands;
      const categoriesMap = new Map();

      commands.forEach((cmd) => {
        const cat = cmd.config.category ? cmd.config.category.toUpperCase() : "أوامر عامة";
        if (!categoriesMap.has(cat)) {
          categoriesMap.set(cat, []);
        }
        categoriesMap.get(cat).push({
          name: cmd.config.name,
          desc: cmd.config.description || cmd.config.shortDescription || "بدون وصف"
        });
      });

      let allCategories = [];
      categoriesMap.forEach((cmds, category) => {
        allCategories.push({ category, cmds });
      });

      const totalPages = Math.ceil(allCategories.length / perPage) || 1;
      if (page > totalPages || page < 1) {
        return message.reply(`❌ الصفحة غير موجودة! البوت يحتوي على ${totalPages} صفحات فقط.`);
      }

      const start = (page - 1) * perPage;
      const pageData = allCategories.slice(start, start + perPage);

      let totalCmdsCount = commands.size;

      // تصميم فخم وحديث للقائمة مع نفس خط الزخرفة المميز
      let msg = `┏━━━━━━━━━━━━━━━━━━━┓\n`;
      msg += `  👑 𝓣𝓞𝓙𝓘 ᶜʰᵃᵗᵇᵒᵗ 👑\n`;
      msg += `┗━━━━━━━━━━━━━━━━━━━┛\n`;
      msg += `📄 الصفحة: [ ${page} / ${totalPages} ] | ⚡ الأوامر: ${totalCmdsCount}\n`;
      msg += `🔧 البادئة الحالية: [ ${prefix} ]\n`;
      msg += `━━━━━━━━━━━━━━━━━━━━━\n`;

      for (const cat of pageData) {
        msg += `✨ ❲ ${cat.category} ❲\n`;
        for (const cmd of cat.cmds) {
          msg += ` ┣ 🔹 ${prefix}${cmd.name}\n`;
        }
        msg += `┗━━━━━━━━━━━━━━━━━━━━━\n`;
      }

      if (page < totalPages) {
        msg += `👉 لاستعراض الصفحة التالية اكتب:\n${prefix}help ${page + 1}`;
      } else {
        msg += `🌟 لقد وصلت إلى النهاية، أنت تطلع على الصفحة الأخيرة.`;
      }

      msg += `\n\n⏳ سيتم حذف هذه الرسالة تلقائياً بعد 30 ثانية.`;

      const info = await message.reply(msg);
      
      setTimeout(() => {
        try {
          api.unsendMessage(info.messageID);
        } catch (e) {}
      }, 30000);

    } catch (error) {
      console.error(error);
      message.reply("❌ حدث خطأ أثناء تحميل قائمة الأوامر.");
    }
  }
};
