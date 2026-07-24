const axios = require("axios");
const fs = require("fs");

module.exports = {
    config: {
        name: 'gptgo',
        version: '4.1.0',
        author: 'KENLIEPLAYS + Fixed',
        countDown: 3,
        role: 0,
        shortDescription: 'GPT مع ذاكرة ورد تلقائي - 3 APIs',
        longDescription: {
            ar: 'GPTGO مطور - ذاكرة لكل مستخدم + 3 سيرفرات احتياط'
        },
        category: 'ai',
        guide: {
            ar: ' gpt <سؤال> - سول البوت\n {pn} clear - مسح الذاكرة\n {pn} memory - شوف الذاكرة\n {pn} debug - شوف حالة API'
        }
    },
    langs: {
        ar: {
            chatting: '⏳ كنفكر...',
            error: '❌ وقع خطأ: ',
            cleared: '✅ مسحت الذاكرة ديالك',
            noMemory: '❌ ما عندك حتى ذاكرة',
            apiDown: '❌ جميع السيرفرات طايحة جرب من بعد'
        }
    },

    onStart: async function ({ args, message, event, getLang, usersData }) {
        const senderID = event.senderID;

        // أمر debug
        if (args[0] == "debug") {
            return message.reply("🔧 كنجرب السيرفرات...\n" + await testAPIs());
        }

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
            const memory = global.gptMemory[senderID].slice(-5);
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
                console.log("Error:", err.message);
                return message.reply(getLang("error") + err.message);
            }
        } else {
            return message.reply("كتب gpt + السؤال ديالك\n.gptgo clear - مسح الذاكرة\n.gptgo memory - شوف الذاكرة\n.gptgo debug - فحص السيرفرات");
        }
    },

    onChat: async function ({ event, message, getLang, usersData }) {
        const body = event.body.toLowerCase();
        const senderID = event.senderID;

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
                console.log("Chat Error:", err.message);
                message.reaction("❌", event.messageID);
                return message.reply(getLang("error") + err.message);
            }
        }

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

// 3 APIs احتياطية
const APIS = [
    "https://api.kenliejugarap.com/gptgo/?text=",
    "https://hercai.onrender.com/v3/hercai?question=",
    "https://api.rosalynbot.xyz/gpt4?text="
];

async function getMessage(yourMessage, senderID, userName = "المستخدم") {
    // تهيئة الذاكرة
    if (!global.gptMemory) global.gptMemory = {};
    if (!global.gptMemory[senderID]) global.gptMemory[senderID] = [];

    // جيب آخر 3 محادثات للسياق فقط
    const history = global.gptMemory[senderID].slice(-3);
    let context = "";
    if (history.length > 0) {
        context = "سياق سابق: ";
        history.forEach(h => {
            context += `${h.user} → ${h.bot.slice(0, 30)}... `;
        });
    }

    const fullPrompt = context + yourMessage;

    // جرب 3 APIs بالترتيب
    for (let i = 0; i < APIS.length; i++) {
        try {
            const apiUrl = APIS[i] + encodeURIComponent(fullPrompt);
            console.log(`[GPT] Trying API ${i+1}: ${APIS[i]}`);

            const res = await axios.get(apiUrl, { timeout: 15000 }); // 15 ثانية timeout

            let botReply = "";

            // Kenlie API
            if (i == 0 && res.data.response) {
                botReply = res.data.response;
            }
            // Hercai API
            else if (i == 1 && res.data.reply) {
                botReply = res.data.reply;
            }
            // Rosalyn API
            else if (i == 2 && res.data.gpt4) {
                botReply = res.data.gpt4;
            }

            if (botReply) {
                // حفظ فالذاكرة
                global.gptMemory[senderID].push({
                    user: yourMessage,
                    bot: botReply,
                    time: Date.now()
                });

                if (global.gptMemory[senderID].length > 20) {
                    global.gptMemory[senderID].shift();
                }

                saveToFile(senderID, yourMessage, botReply);
                return `🤖 API ${i+1}:\n${botReply}`;
            }

        } catch (err) {
            console.log(`[GPT] API ${i+1} failed:`, err.message);
            if (i == APIS.length - 1) {
                throw new Error("جميع السيرفرات طايحة");
            }
            continue; // جرب API الجاي
        }
    }
    throw new Error("ما قدرتش نجاوب");
}

// فحص APIs
async function testAPIs() {
    let result = "";
    for (let i = 0; i < APIS.length; i++) {
        try {
            const res = await axios.get(APIS[i] + "hi", { timeout: 5000 });
            result += `API ${i+1}: ✅ خدام\n`;
        } catch (e) {
            result += `API ${i+1}: ❌ طايح\n`;
        }
    }
    return result;
}

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
