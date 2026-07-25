const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'security_memory.json');

function getMemory() {
  if (!fs.existsSync(dbPath)) {
    const defaultData = { globalProtection: true, lockedName: "" };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    return { globalProtection: true, lockedName: "" };
  }
}

function saveMemory(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = {
  config: {
    name: "ai_security_brain",
    eventType: ["log:thread-name", "log:user-nickname", "log:thread-image"],
    version: "5.0.0",
    credits: "AI Master Dev",
    description: "مراقب الأحداث الخارق والذاكرة الدائمة للحماية"
  },

  async onStart({ api, event }) {
    const { threadID, logMessageType, logMessageData, author } = event;
    const botAdminID = "61591869455750"; // الـ ID ديالك الحصري

    let memory = getMemory();

    // إذا كانت الحماية متوقفة، أو كنت أنت من قام بالتعديل، يتجاهل البوت الأمر بسرعة البرق
    if (!memory.globalProtection || author === botAdminID) return;

    try {
      // 1. خانة حماية اسم المجموعة
      if (logMessageType === "log:thread-name") {
        const newName = logMessageData.name;
        if (memory.lockedName && newName !== memory.lockedName) {
          await api.setTitle(memory.lockedName, threadID);
          return api.sendMessage(`⚡ [AI SHIELD]: تم رصد محاولة تخريب لاسم المجموعة! أعيد تلقائياً إلى: "${memory.lockedName}"`, threadID);
        } else if (!memory.lockedName) {
          memory.lockedName = newName;
          saveMemory(memory);
        }
      }

      // 2. خانة حماية الكنيات (الألقاب)
      if (logMessageType === "log:user-nickname") {
        const targetID = logMessageData.participant_id;
        await api.changeNickname("", threadID, targetID);
        return api.sendMessage(`⚡ [AI NICKNAME PROTECT]: تم مسح الكنية غير المصرح بها للعضو (${targetID}) فوراً.`, threadID);
      }

      // 3. خانة حماية الصورة
      if (logMessageType === "log:thread-image") {
        return api.sendMessage(`⚡ [AI IMAGE ALERT]: تنبيه! تم تغيير صورة المجموعة من قبل شخص غير مسموح له.`, threadID);
      }

    } catch (error) {
      console.error("AI Security Event Error:", error);
    }
  }
};
