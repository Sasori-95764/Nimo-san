module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "commands", "قائمة", "أوامر"],
    version: "7.0",
    author: "EryXenX",
    countDown: 3,
    role: 0,
    shortDescription: "عرض جميع الأوامر",
    longDescription: "عرض قائمة الأوامر المتاحة مع تصنيفها",
    category: "system",
    guide: "{pn} [اسم الأمر]"
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;

    const categoryEmojis = {
      system:    "⚙️",
      economy:   "💰",
      moderation:"🛡️",
      fun:       "🎮",
      "ai":      "🤖",
      "ai-image":"🖼️",
      "AI-IMAGE":"🖼️",
      anime:     "🎌",
      "box chat":"💬",
      tools:     "🔧",
      utility:   "🌐",
      info:      "ℹ️",
      image:     "📸",
      events:    "📅",
      others:    "📁"
    };

    const categoryAr = {
      system:    "نظام",
      economy:   "اقتصاد",
      moderation:"إشراف",
      fun:       "مرح",
      "ai":      "ذكاء اصطناعي",
      "ai-image":"صور AI",
      "AI-IMAGE":"صور AI",
      anime:     "أنمي",
      "box chat":"دردشة",
      tools:     "أدوات",
      utility:   "مساعد",
      info:      "معلومات",
      image:     "صور",
      events:    "أحداث",
      others:    "أخرى"
    };

    // ─── Single command info ───────────────────────────────────────────
    if (args[0]) {
      const cmdName = args[0].toLowerCase();
      const cmd =
        allCommands.get(cmdName) ||
        [...allCommands.values()].find(c => c.config.aliases?.includes(cmdName));

      if (!cmd)
        return message.reply(
`❌ الأمر "${cmdName}" غير موجود
➤ اكتب ${prefix}help لرؤية القائمة الكاملة`
        );

      const guide = typeof cmd.config.guide === "string"
        ? cmd.config.guide.replace(/\{pn\}|\{p\}/g, prefix + cmd.config.name)
        : typeof cmd.config.guide === "object"
          ? (cmd.config.guide.ar || cmd.config.guide.en || cmd.config.name)
          : cmd.config.name;

      const desc = cmd.config.shortDescription
        || (typeof cmd.config.description === "object" ? cmd.config.description.en : cmd.config.description)
        || cmd.config.longDescription
        || "لا يوجد وصف";

      return message.reply(
`┌──────────────────┐
│   🧩 معلومات الأمر   │
└──────────────────┘
✦ الاسم     : ${cmd.config.name}
✦ الأسماء المختصرة : ${cmd.config.aliases?.join(", ") || "لا يوجد"}
✦ الفئة    : ${categoryAr[cmd.config.category?.toLowerCase()] || cmd.config.category || "أخرى"}
✦ الإصدار  : v${cmd.config.version || "1.0"}
✦ المطور   : ${cmd.config.author || "غير معروف"}
✦ الاستخدام : ${guide}
──────────────────────
📝 ${desc}`
      );
    }

    // ─── Full command list ─────────────────────────────────────────────
    const categories = {};
    for (const [name, cmd] of allCommands) {
      const cat = (cmd.config.category || "others").toLowerCase();
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(name);
    }

    // Sort categories: put system first, then alphabetical
    const sortedCats = Object.keys(categories).sort((a, b) => {
      if (a === "system") return -1;
      if (b === "system") return 1;
      return a.localeCompare(b);
    });

    let msg =
`┌──────────────────────┐
│   📜 قائمة الأوامر   │
└──────────────────────┘
🔧 البادئة: ${prefix}  |  📊 ${allCommands.size} أمر
──────────────────────────\n`;

    for (const cat of sortedCats) {
      const emoji = categoryEmojis[cat] || "📁";
      const label = categoryAr[cat] || cat;
      const cmds  = categories[cat].sort();
      msg += `\n${emoji} 『 ${label} 』 — ${cmds.length} أمر\n`;
      msg += cmds.map(c => `   ➥ ${c}`).join("\n") + "\n";
    }

    msg += `\n──────────────────────────\n✨ اكتب ${prefix}help <اسم الأمر> لمزيد من التفاصيل`;

    return message.reply(msg);
  }
};
