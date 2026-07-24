const axios = require("axios");

module.exports = {
    config: {
        name: 'gptgo',
        version: '7.0.0',
        author: 'Free API',
        countDown: 3,
        role: 0,
        shortDescription: 'GPT مجاني بلا مفتاح',
        category: 'ai'
    },
    langs: {
        en: { chatting: '⏳ Thinking...', error: '❌ Error: ', cleared: '✅ Cleared' },
        ar: { chatting: '⏳ كنفكر...', error: '❌ خطأ: ', cleared: '✅ تم المسح' }
    },

    onStart: async function ({ args, message, event, getLang }) {
        const senderID = event.senderID;
        if (args[0] == "clear") {
            if (!global.gptMemory) global.gptMemory = {};
            global.gptMemory[senderID] = [];
            return message.reply(getLang("cleared"));
        }
        if (args[0]) {
            try {
                message.reply(getLang("chatting"));
                const res = await getMessage(args.join(" "), senderID);
                return message.reply(res);
            } catch (err) {
                return message.reply(getLang("error") + err.message);
            }
        }
    },

    onChat: async function ({ event, message, getLang }) {
        const body = event.body.toLowerCase();
        if (body.startsWith("gpt ")) {
            const question = event.body.slice(4).trim();
            if (!question) return;
            try {
                message.reaction("⏳", event.messageID);
                const res = await getMessage(question, event.senderID);
                message.reaction("✅", event.messageID);
                return message.reply(res);
            } catch (err) {
                message.reaction("❌", event.messageID);
                return message.reply(getLang("error") + err.message);
            }
        }
    }
};

async function getMessage(yourMessage, senderID) {
    if (!global.gptMemory) global.gptMemory = {};
    if (!global.gptMemory[senderID]) global.gptMemory[senderID] = [];

    const history = global.gptMemory[senderID].slice(-4);
    let context = history.map(h => `User: ${h.user}\nBot: ${h.bot}`).join("\n");
    const prompt = context + `\nUser: ${yourMessage}\nBot:`;

    try {
        // API مجاني خدام 100%
        const res = await axios.get(`https://api.paxsenix.biz.id/ai/gemini?text=${encodeURIComponent(prompt)}`, {
            timeout: 20000
        });

        if (res.data?.message) {
            const reply = res.data.message;
            global.gptMemory[senderID].push({ user: yourMessage, bot: reply });
            if (global.gptMemory[senderID].length > 15) global.gptMemory[senderID].shift();
            return reply;
        }
        throw new Error("No response");
    } catch (err) {
        throw new Error("Server busy, try again");
    }
}
