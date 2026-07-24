module.exports = {
    config: {
        name: "xo",
        aliases: ["لعبة", "tic", "xogame"],
        version: "2.0",
        author: "Samuel + Updated",
        countDown: 3,
        role: 0,
        shortDescription: { ar: "لعبة XO بين شخصين" },
        longDescription: { ar: "تحدى صاحبك فـ لعبة XO - إكس أو" },
        category: "games",
        guide: "{pn} @منشن - باش تبدا لعبة\n{pn} close - باش تسالي اللعبة وتخسر"
    },

    onStart: async function ({ event, message, usersData, args }) {
        // تأكد أن المتغيرات موجودة
        if (!global.game) global.game = {};
        if (!global.gameScore) global.gameScore = {};

        const mention = Object.keys(event.mentions);
        const threadID = event.threadID;
        const senderID = event.senderID;

        // أمر إغلاق اللعبة
        if (args[0] == "close" || args[0] == "خروج") {
            if (!global.game[threadID] ||!global.game[threadID].on) {
                return message.reply("❌ ما كايناش حتى لعبة خدامة فهاد الكروب");
            }

            const game = global.game[threadID];
            if (senderID!= game.player1.id && senderID!= game.player2.id) {
                return message.reply("❌ ما عندكش لعبة باش تسدها");
            }

            const loser = senderID == game.player1.id? game.player1 : game.player2;
            const winner = senderID == game.player1.id? game.player2 : game.player1;

            // زيد نقطة للرابح
            if (!global.gameScore[winner.id]) global.gameScore[winner.id] = 0;
            global.gameScore[winner.id]++;

            message.reply({
                body: `🏳️ ${loser.name} استسلم!\n🏆 الفائز: ${winner.name}\n📊 النقاط: ${global.gameScore[winner.id]}`,
                mentions: [
                    { tag: loser.name, id: loser.id },
                    { tag: winner.name, id: winner.id }
                ]
            });
            global.game[threadID].on = false;
            return;
        }

        // بدا لعبة جديدة
        if (mention.length == 0) {
            return message.reply("❌ منشن الشخص اللي بغيتي تلعب معاه\nمثال:.xo @احمد");
        }

        if (mention[0] == senderID) {
            return message.reply("❌ ما يمكنش تلعب مع راسك أصاحبي 💀");
        }

        if (global.game[threadID] && global.game[threadID].on) {
            return message.reply("⚠️ كاينة لعبة خدامة دابا فهاد الكروب\nكتب.xo close باش تساليها");
        }

        const player1Name = await usersData.getName(mention[0]);
        const player2Name = await usersData.getName(senderID);

        global.game[threadID] = {
            on: true,
            board: "🔲🔲🔲\n🔲🔲🔲\n🔲🔲🔲",
            boardArray: ["1","2","3","4","5","6","7","8","9"],
            turn: mention[0], // اللي تمنشناه يبدا هو الأول
            player1: { id: mention[0], name: player1Name, symbol: "❌" },
            player2: { id: senderID, name: player2Name, symbol: "⭕" },
            lastMessageID: "",
            moves: 0
        };

        const game = global.game[threadID];
        message.reply({
            body: `🎮 بدات اللعبة!\n❌ ${game.player1.name} VS ⭕ ${game.player2.name}\n\n${game.board}\n\nالدور ديال: ${game.player1.name}\nرد على هاد الرسالة برقم من 1-9`,
            mentions: [
                { tag: game.player1.name, id: game.player1.id },
                { tag: game.player2.name, id: game.player2.id }
            ]
        }, (err, info) => {
            global.game[threadID].lastMessageID = info.messageID;
        });
    },

    onChat: async function ({ event, message, usersData }) {
        const threadID = event.threadID;
        const senderID = event.senderID;

        // Easter egg
        if (event.type == "message" && event.body.includes("-,-")) {
            return message.reply({
                body: "شنو كاين ألباكا 😂",
                attachment: await global.utils.getStreamFromURL("https://i.imgur.com/8Km9tLL.jpg")
            });
        }

        // تحقق من اللعبة
        if (!global.game ||!global.game[threadID] ||!global.game[threadID].on) return;
        if (event.type!= "message_reply") return;
        if (event.messageReply.messageID!= global.game[threadID].lastMessageID) return;

        const game = global.game[threadID];

        // تحقق من الدور
        if (senderID!= game.turn) {
            return message.reply("❌ ماشي الدور ديالك! سنا شوية");
        }

        const choice = event.body.trim();
        if (!["1","2","3","4","5","6","7","8","9"].includes(choice)) {
            return message.reply("❌ اختار رقم من 1 حتى 9 فقط");
        }

        const index = parseInt(choice) - 1;
        if (game.boardArray[index] == "❌" || game.boardArray[index] == "⭕") {
            return message.reply("❌ هاد الخانة عامرة! ختار وحدة خاوية");
        }

        // لعب الدور
        const currentPlayer = senderID == game.player1.id? game.player1 : game.player2;
        game.boardArray[index] = currentPlayer.symbol;
        game.moves++;

        // حدث اللوحة
        let newBoard = "";
        for (let i = 0; i < 9; i++) {
            if (["❌", "⭕"].includes(game.boardArray[i])) {
                newBoard += game.boardArray[i];
            } else {
                newBoard += "🔲";
            }
            if ((i + 1) % 3 == 0) newBoard += "\n";
        }
        game.board = newBoard;

        // تحقق من الفوز
        const winConditions = [
            [0,1,2], [3,4,5], [6,7,8], // أفقي
            [0,3,6], [1,4,7], [2,5,8], // عمودي
            [0,4,8], [2,4,6] // قطري
        ];

        let winner = null;
        for (const condition of winConditions) {
            const [a, b, c] = condition;
            if (game.boardArray[a] == currentPlayer.symbol &&
                game.boardArray[b] == currentPlayer.symbol &&
                game.boardArray[c] == currentPlayer.symbol) {
                winner = currentPlayer;
                break;
            }
        }

        // مسح الرسالة القديمة
        message.unsend(event.messageReply.messageID);

        if (winner) {
            // زيد نقطة
            if (!global.gameScore[winner.id]) global.gameScore[winner.id] = 0;
            global.gameScore[winner.id]++;

            message.reply({
                body: `🎉 ${game.board}\n\n🏆 الفائز: ${winner.name} ${winner.symbol}\n📊 مجموع النقاط: ${global.gameScore[winner.id]}`,
                mentions: [{ tag: winner.name, id: winner.id }]
            });
            game.on = false;
            return;
        }

        // تحقق من التعادل
        if (game.moves == 9) {
            message.reply(`🤝 ${game.board}\n\nتعادل! ما كاين حتى رابح`);
            game.on = false;
            return;
        }

        // بدل الدور
        game.turn = senderID == game.player1.id? game.player2.id : game.player1.id;
        const nextPlayer = game.turn == game.player1.id? game.player1 : game.player2;

        message.reply({
            body: `${game.board}\nالدور ديال: ${nextPlayer.name} ${nextPlayer.symbol}\nرد برقم من 1-9`,
            mentions: [{ tag: nextPlayer.name, id: nextPlayer.id }]
        }, (err, info) => {
            game.lastMessageID = info.messageID;
        });
    }
};
