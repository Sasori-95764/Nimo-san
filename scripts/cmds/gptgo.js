const axios = require("axios");
const fs = require("fs");

const GEMINI_API_KEY = "AIzaSyCAh4CtN9cui6u-U1uoANrUxYgSiRG56bk";

module.exports = {
    config: {
        name: 'gptgo',
        version: '6.0.0',
        author: 'Gemini Pro',
        countDown: 2,
        role: 0,
        shortDescription: 'Gemini Pro شغال',
        longDescription: { ar: 'Gemini Pro API - سريع وذكي' },
        category: 'ai',
        guide: { ar: ' gpt <سؤال>\n {pn} clear\n {pn} memory' }
    },
    langs: {
        en: {
            chatting: '⏳ Thinking...',
            error: '❌ Error: ',
            cleared: '✅ Memory cleared',
            noMemory: '❌ No memory found'
        },
        ar: {
            chatting: '⏳ كنفكر...',
            error: '❌ خطأ: ',
            cleared: '✅ مسحت الذاكرة',
            noMemory: '❌ ما كايناش ذاكرة'
        }
    },

    onStart: async function ({ args, message, event, getLang }) {
        const senderID = event.senderID;

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
            let msg = "🧠 الذاكرة:\n\n";
            memory.forEach((m, i) => {
                msg += `${i+1}. أنت: ${m.user}\nالبوت: ${m.bot.slice(0, 60)}...\n\n`;
            });
            return message.reply(msg);
        }

        if (args[0]) {
            const yourMessage = args.join(" ");
            try {
                message.reply(getLang("chatting"));
                const responseMessage = await getMessage(yourMessage, senderID);
                return message.reply(responseMessage);
            } catch (err) {
                console.log("Error:", err.message);
                return message.reply(getLang("error") + err.message);
            }
        } else {
            return message.reply("كتب: gpt + سؤالك\n.gptgo clear - مسح\n.gptgo memory - الذاكرة");
        }
    },

    onChat: async function ({ event, message, getLang, usersData }) {
        const body = event.body.toLowerCase();
        const senderID = event.senderID;

        if (body.startsWith("gpt ")) {
            const question = event.body.slice(4).trim();
            if (!question) return message.reply("كتب السؤال مورا gpt");

            try {
                message.reaction("⏳", event.messageID);
                const userName = await usersData.getName(senderID);
                const responseMessage = await getMessage(question, senderID, userName);
                message.reaction("✅", event.messageID);
                return message.reply(responseMessage);
            } catch (err) {
                console.log("Chat Error:", err.message);
                message.reaction("❌", event.messageID);
                return message.reply(getLang("error") + err.message);
            }
        }

        if (body == "بوت" || body == "bot") {
            return message.reply("نعام؟ كتب gpt + سؤالك 💀");
        }
    }
};

async function getMessage(yourMessage, senderID, userName = "User") {
    if (!global.gptMemory) global.gptMemory = {};
    if (!global.gptMemory[senderID]) global.gptMemory[senderID] = [];

    const history = global.gptMemory[senderID].slice(-6);
    const contents = [];

    history.forEach(h => {
        contents.push({ role: "user", parts: [{ text: h.user }] });
        contents.push({ role: "model", parts: [{ text: h.bot }] });
    });

    contents.push({ role: "user", parts: [{ text: yourMessage }] });

    try {
        const res = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: contents,
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 2048
                },
                systemInstruction: {
                    parts: [{ text: "You are a helpful AI assistant. Reply in Moroccan Darija when the user speaks Darija. Be friendly and use emojis." }]
                }
            },
            {
                timeout: 30000,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (res.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const botReply = res.data.candidates[0].content.parts[0].text;

            global.gptMemory[senderID].push({
                user: yourMessage,
                bot: botReply,
                time: Date.now()
            });

            if (global.gptMemory[senderID].length > 20) {
                global.gptMemory[senderID].shift();
            }

            return botReply;
        } else {
            throw new Error("No response from Gemini");
        }

    } catch (err) {
        console.error("Gemini Error:", err.response?.data || err.message);
        if (err.response?.status == 400) throw new Error("API Key غالط");
        if (err.response?.status == 429) throw new Error("بزاف طلبات، تسنى دقيقة");
        if (err.response?.status == 403) throw new Error("API Key محظور");
        throw new Error("السيرفر فيه مشكل");
    }
}
