const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../events/security_memory.json');

module.exports = {
  config: {
    name: "antiai",
    version: "5.0.0",
    credits: "AI Master Dev",
    hasPermssion: 0,
    description: "تفعيل أو إيقاف نظام الحماية الخارق",
    commandCategory: "Admin",
    usages: "[on/off]",
    cooldowns: 0
  },

  run: async function({ api, event, args }) {
    const { threadID, senderID } = event;
    const botAdminID = "61591869455750";

    if (senderID !== botAdminID) {
      return api.sendMessage("❌ هذا الأمر خاص بمطور البوت الحصري فقط!", threadID);
    }

    let memory = { globalProtection: true, lockedName: "" };
    if (fs.existsSync(dbPath)) {
      try { memory = JSON.parse(fs.readFileSync(dbPath, 'utf8')); } catch(e) {}
    }

    const action = args[0] ? args[0].toLowerCase() : "";

    if (action === "on") {
      memory.globalProtection = true;
      fs.writeFileSync(dbPath, JSON.stringify(memory, null, 2));
      return api.sendMessage("🧠 [AI SECURITY]: تم تفعيل الحماية الشاملة للأبد بنجاح!", threadID);
    } else if (action === "off") {
      memory.globalProtection = false;
      fs.writeFileSync(dbPath, JSON.stringify(memory, null, 2));
      return api.sendMessage("⚠️ [AI SECURITY]: تم إيقاف الحماية.", threadID);
    } else {
      return api.sendMessage("⚙️ استخدم الأمر هكذا:\n• `antiai on` لتفعيل الحماية للأبد.\n• `antiai off` لإيقافها.", threadID);
    }
  }
};
