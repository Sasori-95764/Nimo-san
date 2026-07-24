const axios = require("axios");
const fs = require("fs");

module.exports = {
    config: {
        name: 'gptgo',
        version: '4.0.0',
        author: 'KENLIEPLAYS + Upgraded',
        countDown: 3,
        role: 0,
        shortDescription: 'GPT مع ذاكرة ورد تلقائي',
        longDescription: {
            ar: 'GPTGO مطور - ذاكرة لكل مستخدم + رد تلقائي + أوامر'
        },
        category: 'ai',
        guide: {
            ar: ' gpt <سؤال> - سول البوت\n {pn} clear - مسح الذاكرة\n {pn} memory - شوف الذاكرة'
        }
    },
    langs: {
        ar: {
            chatting: '⏳ كنفكر...',
            error: '❌ وقع خطأ، عاود جرب',
            cleared: '✅ مسحت الذاكرة ديالك',
            noMemory: '❌ ما عندك حتى ذاكرة'
        }
    },

    onStart: async function ({ args, message, event, getLang, usersData }) {
        const senderID = event.senderID;

        // أمر مسح الذاكرة
        if (args[0] == "clear" || args[0] == "مسح") {
            if (!global.gptMemory) global.gptMemory = {};
            global.gptMemory[senderID] = [];
            return message.reply(getLang("cleared"));
        }

        // أمر عرض الذاكرة
        if (args[0] == "memory" || args[0] == "ذاكرة") {
            if (!global.gptMemory ||!global.gptMemory[senderID] || global.gptMemory[senderID].length == 0) {
                return message.reply(getLang("noMemory"));
            }
            const memory = global.gptMemory[senderID].slice(-5); // آخر 5 رسائل
            let msg = "🧠 الذاكرة ديالك:\n\n";
            memory.forEach((m, i) => {
                msg += `${i+1}. أنت: ${m.user}\n البوت: ${m.bot.slice(0, 50)}...\n\n`;
            });
            return message.reply(msg);
        }

        // سؤال عادي بالأمر
        if (args[0]) {
            const yourMessage = args.join(" ");
            try {
                message.reply(getLang("chatting"));
                const responseMessage = await getMessage(yourMessage, senderID);
                return message.reply(`${responseMessage}`);
            } catch (err) {
                console.log(err)
                return message.reply(getLang("error"));
            }
        } else {
            return message.reply("كتب gpt + السؤال ديالك\n.gptgo clear - مسح الذاكرة\n.gptgo memory - شوف الذاكرة");
        }
    },

    onChat: async function ({ event, message, getLang, usersData }) {
        const body = event.body.toLowerCase();
        const senderID = event.senderID;

        // رد تلقائي إلا كتب gpt
        if (body.startsWith("gpt ")) {
            const question = event.body.slice(4).trim();

            if (!question) {
                return message.reply("كتب السؤال ديالك مورا gpt\nمثال: gpt شنو هي عاصمة المغرب");
            }

            try {
                message.reaction("⏳", event.messageID);
                const userName = await usersData.getName(senderID);
                const responseMessage = await getMessage(question, senderID, userName);
                message.reaction("✅", event.messageID);
                return message.reply(`${responseMessage}`);
            } catch (err) {
                console.log(err);
                message.reaction("❌", event.messageID);
                return message.reply(getLang("error"));
            }
        }

        // رد تلقائي على "بوت"
        if (body == "بوت" || body == "gpt") {
            const replies = [
                "نعام أسيدي؟ كتب gpt + سؤالك 💀",
                "أنا هنا، شنو بغيتي؟ ⚔️",
                "سولني أي حاجة بكلمة gpt فالأول 🤖"
            ];
            return message.reply(replies[Math.floor(Math.random() * replies.length)]);
        }
    }
};

// دالة جلب الجواب مع الذاكرة
async function getMessage(yourMessage, senderID, userName = "المستخدم") {
    try {
        // تهيئة الذاكرة
        if (!global.gptMemory) global.gptMemory = {};
        if (!global.gptMemory[senderID]) global.gptMemory[senderID] = [];

        // جيب آخر 5 محادثات للسياق
        const history = global.gptMemory[senderID].slice(-5);
        let context = "";
        if (history.length > 0) {
            context = "المحادثات السابقة:\n";
            history.forEach(h => {
                context += `المستخدم: ${h.user}\nالبوت: ${h.bot}\n`;
            });
            context += "\n";
        }

        // صيفط للـ API مع السياق
        const fullPrompt = context + `المستخدم ${userName}: ${yourMessage}`;
        const res = await axios.get(`https://api.kenliejugarap.com/gptgo/?text=${encodeURIComponent(fullPrompt)}`);

        if (!res.data.response) {
            throw new Error('No response from API');
        }

        const botReply = res.data.response;

        // حفظ فالذاكرة
        global.gptMemory[senderID].push({
            user: yourMessage,
            bot: botReply,
            time: Date.now()
        });

        // إلا فات 20 رسالة مسح القدام
        if (global.gptMemory[senderID].length > 20) {
            global.gptMemory[senderID].shift();
        }

        // حفظ فملف - اختياري
        saveToFile(senderID, yourMessage, botReply);

        return botReply;
    } catch (err) {
        console.error('Error while getting a message:', err);
        throw err;
    }
}

// دالة حفظ السجل فملف
function saveToFile(userID, question, answer) {
    try {
        if (!fs.existsSync("./gpt_logs")) {
            fs.mkdirSync("./gpt_logs");
        }
        const log = `[${new Date().toLocaleString("ar-MA")}] ${userID}\nQ: ${question}\nA: ${answer}\n---\n`;
        fs.appendFileSync(`./gpt_logs/${userID}.txt`, log);
    } catch (e) {
        console.log("Error saving log:", e);
    }
}
