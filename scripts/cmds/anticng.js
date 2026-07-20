module.exports = {
    config: {
        name: "anticng",
        version: "1.0",
        author: "Nolan-Bot Custom",
        role: 1, // مخصص للمديرين فقط
        shortDescription: "حماية صارمة لاسم المجموعة",
        longDescription: "يمنع أي شخص (بمن فيهم المسؤولين) من تغيير اسم المجموعة",
        category: "group",
        guide: "{pn} [on/off]"
    },

    onStart: async function({ api, event, args }) {
        const { threadID } = event;
        const status = args[0];

        if (status === "on") {
            // حفظ الاسم الحالي للمجموعة ليعود إليه البوت دائماً
            const threadInfo = await api.getThreadInfo(threadID);
            global.antiName = global.antiName || {};
            global.antiName[threadID] = threadInfo.threadName;
            
            return api.sendMessage("✅ تم تفعيل الحماية الصارمة. سيقوم البوت باستعادة الاسم الأصلي فوراً في حال تم تغييره.", threadID);
        } else if (status === "off") {
            delete global.antiName[threadID];
            return api.sendMessage("❌ تم إيقاف الحماية الصارمة لاسم المجموعة.", threadID);
        } else {
            return api.sendMessage("استخدم: /anticng on أو /anticng off", threadID);
        }
    },

    onEvent: async function({ api, event }) {
        const { threadID, logMessageType, logMessageData } = event;
        
        // التحقق من تفعيل الحماية لهذا الثريد
        if (!global.antiName || !global.antiName[threadID]) return;

        // مراقبة حدث تغيير الاسم
        if (logMessageType === "log:thread-name") {
            const currentName = logMessageData.name;
            const originalName = global.antiName[threadID];

            if (currentName !== originalName) {
                api.setTitle(originalName, threadID, (err) => {
                    if (!err) {
                        api.sendMessage("🚫 محاولة تغيير الاسم ممنوعة! تم استعادة الاسم الأصلي.", threadID);
                    }
                });
            }
        }
    }
};
