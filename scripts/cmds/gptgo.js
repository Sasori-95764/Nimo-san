const axios = require("axios");
const fs = require("fs");

module.exports = {
    config: {
        name: 'gptgo',
        version: '4.2.0',
        author: 'Fixed',
        countDown: 3,
        role: 0,
        shortDescription: 'GPT with memory',
        longDescription: {
            en: 'GPTGO - memory + multi API',
            ar: 'GPTGO مطور - ذاكرة + عدة سيرفرات'
        },
        category: 'ai',
        guide: {
            en: ' gpt <question>\n {pn} clear\n {pn} memory\n {pn} debug',
            ar: ' gpt <سؤال>\n {pn} clear\n {pn} memory\n {pn} debug'
        }
    },
    langs: {
        en: {
            chatting: '⏳ Thinking...',
            error: '❌ Error: ',
            cleared: '✅ Memory cleared',
            noMemory: '❌ No memory found',
            apiDown: '❌ All servers are down'
        },
        ar: {
            chatting: '⏳ كنفكر...',
            error: '❌ وقع خطأ: ',
            cleared: '✅ مسحت الذاكرة ديالك',
            noMemory: '❌ ما عندك حتى ذاكرة',
            apiDown: '❌ جميع السيرفرات طايحة'
        }
    },

    onStart: async function ({ args, message, event, getLang, usersData }) {
        const senderID = event.senderID;

        if (args[0] == "debug") {
            return message.reply("🔧 Testing APIs...\n" + await testAPIs());
        }

        if (args[0] == "clear" || args[0] == "مسح") {
            if (!global.gptMemory) global.gptMemory = {};
            global.gptMemory[senderID] = [];
            return message.reply(getLang("cleared"));
        }

        if (args[0] == "memory" || args[0] == "ذاكرة") {
            if (!global.gptMemory ||!global.gptMemory[senderID] || global.gptMemory[senderID].length == 0) {
                return message.reply(getLang("noMemory"));
            }
            const memory = global.gptMemory[senderID].slice(-5);
            let msg = "🧠 Your Memory:\n\n";
            memory.forEach((m, i) => {
                msg += `${i+1}. You: ${m.user}\n Bot: ${m.bot.slice(0, 50)}...\n\n`;
            });
            return message.reply(msg);
        }

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
            return message.reply("Type: gpt + your question\n.gptgo clear\n.gptgo memory\n.gptgo debug");
        }
    },

    onChat: async function ({ event, message, getLang, usersData }) {
        const body = event.body.toLowerCase();
        const senderID = event.senderID;

        if (body.startsWith("gpt ")) {
            const question = event.body.slice(4).trim();
            if (!question) return message.reply("Type your question after gpt");

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

        if (body == "bot" || body == "gpt") {
            return message.reply("Yes? Type: gpt + your question 💀");
        }
    }
};

// APIs خدامين دابا 2026
const APIS = [
    {
        url: "https://api.ryzendesu.vip/api/ai/v2/chatgpt",
        params: (text) => `?text=${encodeURIComponent(text)}`,
        extract: (data) => data.result
    },
    {
        url: "https://sh.web.id/api/ai/gpt4o",
        params: (text) => `?text=${encodeURIComponent(text)}`,
        extract: (data) => data.result
    },
    {
        url: "https://api.ryzendesu.vip/api/ai/claude",
        params: (text) => `?text=${encodeURIComponent(text)}`,
        extract: (data) => data.result
    }
];

async function getMessage(yourMessage, senderID, userName = "User") {
    if (!global.gptMemory) global.gptMemory = {};
    if (!global.gptMemory[senderID]) global.gptMemory[senderID] = [];

    const history = global.gptMemory[senderID].slice(-3);
    let context = "";
    if (history.length > 0) {
        context = "Previous: ";
        history.forEach(h => {
            context += `${h.user} -> ${h.bot.slice(0, 30)}... `;
        });
    }

    const fullPrompt = context + yourMessage;

    for (let i = 0; i < APIS.length; i++) {
        try {
            const apiUrl = APIS[i].url + APIS[i].params(fullPrompt);
            console.log(`[GPT] Trying API ${i+1}`);

            const res = await axios.get(apiUrl, {
                timeout: 20000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            const botReply = APIS[i].extract(res.data);

            if (botReply && botReply.length > 5) {
                global.gptMemory[senderID].push({
                    user: yourMessage,
                    bot: botReply,
                    time: Date.now()
                });

                if (global.gptMemory[senderID].length > 20) {
                    global.gptMemory[senderID].shift();
                }

                saveToFile(senderID, yourMessage, botReply);
                return botReply;
            }

        } catch (err) {
            console.log(`[GPT] API ${i+1} failed:`, err.message);
            if (i == APIS.length - 1) {
                throw new Error("All servers are down, try again later");
            }
            continue;
        }
    }
    throw new Error("Failed to get response");
}

async function testAPIs() {
    let result = "";
    for (let i = 0; i < APIS.length; i++) {
        try {
            const testUrl = APIS[i].url + APIS[i].params("hi");
            await axios.get(testUrl, { timeout: 5000 });
            result += `API ${i+1}: ✅ Working\n`;
        } catch (e) {
            result += `API ${i+1}: ❌ Down - ${e.message}\n`;
        }
    }
    return result;
}

function saveToFile(userID, question, answer) {
    try {
        if (!fs.existsSync("./gpt_logs")) {
            fs.mkdirSync("./gpt_logs");
        }
        const log = `[${new Date().toLocaleString()}] ${userID}\nQ: ${question}\nA: ${answer}\n---\n`;
        fs.appendFileSync(`./gpt_logs/${userID}.txt`, log);
    } catch (e) {
        console.log("Error saving log:", e);
    }
}
