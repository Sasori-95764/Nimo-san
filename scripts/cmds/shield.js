const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../events/security_memory.json');

module.exports = {
  config: {
    name: "shield",
    version: "1.0.0",
    credits: "AI Master Dev",
    hasPermssion: 0,
    description: "نظام الحماية الخارق",
    commandCategory: "Admin",
    usages: "[on/off]",
    cooldowns: 0
  },

  run: async function({ api, event, args }) {
    const { threadID, senderID } = event;
    const botAdminID = "61591869455750"; // معرف المطور الحصري

    if (senderID !== botAdminID) {
      return api.sendMessage("❌ هذا الأمر خاص بمطور البوت الحصري فقط!", threadID);
    }

    const eventsDir = path.join(__dirname, '../events');
    if (!fs.existsSync(eventsDir)) {
      fs.mkdirSync(eventsDir, { recursive: true });
    }

    let memory = { globalProtection: true, lockedName: "" };
    if (fs.existsSync(dbPath)) {
      try {
        memory = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      } catch (e) {}
    }

    const action = args[0] ? args[0].toLowerCase() : "";

    if (action === "on") {
      memory.globalProtection = true;
      fs.writeFileSync(dbPath, JSON.stringify(memory, null, 2), 'utf8');
      return api.sendMessage("🛡️ [SHIELD]: تم تفعيل الحماية القصوى للأبد بنجاح!", threadID);
    } 
    else if (action === "off") {
      memory.globalProtection = false;
      fs.writeFileSync(dbPath, JSON.stringify(memory, null, 2), 'utf8');
      return api.sendMessage("⚠️ [SHIELD]: تم إيقاف الحماية.", threadID);
    } 
    else {
      return api.sendMessage("⚙️ للتحكم بالحماية اكتب:\n• `.shield on` للتفعيل\n• `.shield off` للإيقاف", threadID);
    }
  }
};
