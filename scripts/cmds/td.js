module.exports = {
  config: {
    name: "td",
    aliases: ["truthordare", "ص"],
    version: "1.1",
    author: "TOJI",
    countDown: 3,
    role: 0,
    shortDescription: "لعبة صراحة وجرأة السريعة",
    longDescription: "لعبة صراحة وجرأة مع اختصارات سهلة جداً للتشغيل",
    category: "ألعاب",
    guide: "{pn} t (صراحة)\n{pn} d (جرأة)\n{pn} (عشوائي)"
  },

  onStart: async function({ message, event, api, args }) {
    const type = args[0] ? args[0].toLowerCase() : "";

    const truths = [
      "ما هو أكبر سر كتمته عن أهلك؟",
      "من هو الشخص في المجموعة الذي تتمنى أن تراه في الواقع؟",
      "ما هو أغبى شيء فعلته في حياتك؟",
      "هل سبق وأن وقعت في الحب سرا؟ ومن هو؟",
      "ما هي أكثر موقف محرح تعرضت له أمام شخص تحبه؟",
      "لو مُنحت فرصة لتغيير صفة واحدة في شخصيتك، ماذا ستختار؟",
      "ما هو الشيء الذي تفعله وحدك وتظن أن لا أحد يراك فيه؟",
      "ماهو الاسم المستعار الأسوأ الذي أطلق عليك في طفولتك؟"
    ];

    const dares = [
      "قم بإرسال آخر صورة تم التقاطها في هاتفك إلى هذه المحادثة!",
      "اكتب رسالة غزل محرجة لأول شخص ظهر في قائمة المحادثات لديك.",
      "قم بتغيير كنيتك في المجموعة إلى 'دجاجة مشوية' لمدة نصف ساعة.",
      "تكلم بصوت مضحك وقم بإرسال بصمة صوتية تقرأ فيها جملة من اختيار أصدقائك.",
      "اعترف باعتراف غريب وصادم هنا في المجموعة.",
      "لا تضع أي إيموجي في ردودك القادمة لمدة 10 رسائل.",
      "اكتب اسم شخص تعجب به باللغة المعكوسة.",
      "قم بمدح شخص في المجموعة بثلاث صفات مبالغ فيها."
    ];

    let choice = type;
    // دعم الاختصارات الحرفية أيضاً (t للصراحة و d للجرأة)
    if (choice === "t" || choice === "truth" || choice === "ص") {
      choice = "truth";
    } else if (choice === "d" || choice === "dare" || choice === "ج") {
      choice = "dare";
    } else {
      choice = Math.random() < 0.5 ? "truth" : "dare";
    }

    let resultText = "";
    let titleIcon = "";

    if (choice === "truth") {
      const randomTruth = truths[Math.floor(Math.random() * truths.length)];
      titleIcon = "🎯 ❲ صـراحـة ❲ 🎯";
      resultText = `❓ **السؤال:** ${randomTruth}`;
    } else {
      const randomDare = dares[Math.floor(Math.random() * dares.length)];
      titleIcon = "🔥 ❲ جـرأة ❲ 🔥";
      resultText = `⚡ **التحدي:** ${randomDare}`;
    }

    let msg = `┏━━━━━━━━━━━━━━━━━━━┓\n`;
    msg += `  👑 𝓣𝓞𝓙𝑲 𝓖𝓐𝓜𝓔𝓢 👑\n`;
    msg += `┗━━━━━━━━━━━━━━━━━━━┛\n`;
    msg += `${titleIcon}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${resultText}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💡 الاختصارات السريعة:\n`;
    msg += `• /td t (صراحة)\n`;
    msg += `• /td d (جرأة)`;

    return message.reply(msg);
  }
};
