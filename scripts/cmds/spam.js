module.exports = {
    config: {
        name: "spam",
        version: "1.1",
        author: "Gemini",
        role: 1,
        shortDescription: "إرسال رسائل متكررة",
        longDescription: "يبدأ سبام رسالة كل 15 ثانية",
        category: "System",
        guide: "{pn} [on/off] [الرسالة]"
    },

    onStart: async function({ api, event, args }) {
        const { threadID } = event;
        const type = args[0]; 
        const message = args.slice(1).join(" ");

        // التأكد من تعريف الذاكرة العامة للبوت
        if (typeof global.spamTasks === "undefined") {
            global.spamTasks = {};
        }

        if (type === "on") {
            if (!message) return api.sendMessage("❌ يرجى كتابة الرسالة.", threadID);
            
            // إيقاف أي سبام قديم في نفس المحادثة
            if (global.spamTasks[threadID]) {
                clearInterval(global.spamTasks[threadID]);
            }

            // تشغيل السبام الجديد
            global.spamTasks[threadID] = setInterval(() => {
                api.sendMessage(message, threadID).catch(() => {});
            }, 15000);

            return api.sendMessage(`✅ تم تفعيل السبام: "${message}"`, threadID);
        }

        if (type === "off") {
            if (global.spamTasks[threadID]) {
                clearInterval(global.spamTasks[threadID]);
                delete global.spamTasks[threadID];
                return api.sendMessage("🛑 تم إيقاف السبام.", threadID);
            } else {
                return api.sendMessage("❌ لا يوجد سبام يعمل حالياً.", threadID);
            }
        }

        return api.sendMessage("❌ الاستخدام: /spam [on/off] [الرسالة]", threadID);
    }
};
