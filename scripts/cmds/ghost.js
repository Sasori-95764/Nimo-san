module.exports = {
    config: {
        name: "ghost", // تم تغيير الاسم هنا إلى ghost
        version: "1.3",
        author: "Gemini",
        role: 1,
        shortDescription: "إرسال رسائل متكررة بانتظام",
        longDescription: "يبدأ تكرار رسالة تلقائياً كل 60 ثانية مع محاكاة الكتابة، عداد للرسائل، وإمكانية معرفة الحالة",
        category: "System",
        guide: "{pn} [on/off/status] [الرسالة]"
    },

    onStart: async function({ api, event, args }) {
        const { threadID, senderID } = event;
        const type = args[0] ? args[0].toLowerCase() : ""; 
        const message = args.slice(1).join(" ");

        // التأكد من أن المستخدم أدمن البوت (حماية إضافية داخل الكود)
        const adminBot = global.GoatBot.config.adminBot || [];
        if (!adminBot.includes(senderID)) {
            return api.sendMessage("❌ هذا الأمر مخصص لمشرفي البوت فقط.", threadID);
        }

        // التأكد من تعريف الذاكرة العامة للبوت
        if (typeof global.repeatTasks === "undefined") {
            global.repeatTasks = {};
        }

        // 1. تفعيل التكرار (on)
        if (type === "on") {
            if (!message) return api.sendMessage("❌ يرجى كتابة الرسالة المراد تكرارها.", threadID);
            
            // إيقاف أي تكرار قديم في نفس المحادثة
            if (global.repeatTasks[threadID]) {
                clearInterval(global.repeatTasks[threadID].interval);
            }

            // إنشاء كائن تكرار جديد مع العداد وتخزين وقت البدء
            global.repeatTasks[threadID] = {
                message: message,
                count: 0,
                startTime: Date.now(),
                interval: setInterval(async () => {
                    try {
                        // إظهار حالة جاري الكتابة قبل إرسال الرسالة
                        if (typeof api.sendTypingIndicator === "function") {
                            api.sendTypingIndicator(threadID, true);
                            await new Promise(resolve => setTimeout(resolve, 1500));
                            api.sendTypingIndicator(threadID, false);
                        }
                        
                        await api.sendMessage(message, threadID);
                        global.repeatTasks[threadID].count++; // زيادة عداد الرسائل المرسلة
                    } catch (e) {
                        // تجاهل أخطاء الشبكة المؤقتة
                    }
                }, 60000) // كل 60 ثانية
            };

            return api.sendMessage(`✅ تم تفعيل التكرار بنجاح (كل 60 ثانية):\n"${message}"`, threadID);
        }

        // 2. إيقاف التكرار (off) مع عرض تقرير بالعدد
        if (type === "off") {
            if (global.repeatTasks[threadID]) {
                const taskData = global.repeatTasks[threadID];
                clearInterval(taskData.interval);
                const totalSent = taskData.count;
                delete global.repeatTasks[threadID];
                
                return api.sendMessage(`🛑 تم إيقاف التكرار بنجاح.\n📊 إجمالي الرسائل التي تم إرسالها: ${totalSent} رسالة.`, threadID);
            } else {
                return api.sendMessage("❌ لا يوجد تكرار يعمل حالياً في هذه المحادثة.", threadID);
            }
        }

        // 3. التحقق من حالة التكرار الحالية (status)
        if (type === "status") {
            if (global.repeatTasks[threadID]) {
                const taskData = global.repeatTasks[threadID];
                const minutesRunning = Math.floor((Date.now() - taskData.startTime) / 60000);
                return api.sendMessage(
                    `ℹ **حالة التكرار الحالي:**\n` +
                    `- النص: "${taskData.message}"\n` +
                    `- عدد الرسائل المرسلة حتى الآن: ${taskData.count} رسالة\n` +
                    `- وقت التشغيل: منذ حوالي ${minutesRunning} دقيقة`, 
                    threadID
                );
            } else {
                return api.sendMessage("ℹ️ التكرار متوقف حالياً في هذه المحادثة.", threadID);
            }
        }

        return api.sendMessage("❌ الاستخدام الصحيح:\n- /ghost on [الرسالة]\n- /ghost off\n- /ghost status", threadID);
    }
};
