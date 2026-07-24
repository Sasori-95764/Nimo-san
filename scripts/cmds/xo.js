module.exports = {
    config: {
        name: "xo",
        aliases: ["لعبة", "tic", "xogame"],
        version: "4.0",
        author: "Samuel + Updated",
        countDown: 3,
        role: 0,
        shortDescription: { ar: "لعبة XO - بلا منشن" },
        longDescription: { ar: "تحدى البوت أو صاحبك فـ لعبة XO بلا منشن" },
        category: "games",
        guide: "{pn} start - تبدا لعبة وتسنا صاحبك\n{pn} bot - تلعب ضد البوت\n{pn} join - تدخل للعبة\n{pn} close - تسالي اللعبة"
    },

    onStart: async function ({ event, message, usersData, args }) {
        if (!global.game) global.game = {};
        if (!global.gameScore) global.gameScore = {};

        const threadID = event.threadID;
        const senderID = event.senderID;

        // أمر إغلاق اللعبة
        if (args[0] == "close" || args[0] == "خروج") {
            if (!global.game[threadID] ||!global.game[threadID].on) {
                return message.reply("❌ ما كايناش حتى لعبة خدامة فهاد الكروب");
            }

            const game = global.game[threadID];
            if (game.waiting) {
                if (senderID == game.player1.id) {
                    message.reply("❌ لغيتي اللعبة");
                    delete global.game[threadID];
                } else {
                    return message.reply("❌ غير اللي بدا اللعبة يقدر يلغيها");
                }
                return;
            }

            if (senderID!= game.player1.id && (game.vsBot || senderID!= game.player2.id)) {
                return message.reply("❌ ما عندكش لعبة باش تسدها");
            }

            if (game.vsBot) {
                message.reply("🏳️ استسلمتي! البوت ربح 😈");
            } else {
                const loser = senderID == game.player1.id? game.player1 : game.player2;
                const winner = senderID == game.player1.id? game.player2 : game.player1;
                if (!global.gameScore[winner.id]) global.gameScore[winner.id] = 0;
                global.gameScore[winner.id]++;
                message.reply(`🏳️ ${loser.name} استسلم!\n🏆 الفائز: ${winner.name}\n📊 النقاط: ${global.gameScore[winner.id]}`);
            }
            delete global.game[threadID];
            return;
        }

        // أمر دخول للعبة
        if (args[0] == "join" || args[0] == "دخول") {
            if (!global.game[threadID] ||!global.game[threadID].waiting) {
                return message.reply("❌ ما كايناش حتى لعبة كتسنا\nكتب.xo start باش تبدا وحدة");
            }

            if (senderID == global.game[threadID].player1.id) {
                return message.reply("❌ نتا اللي بديتي اللعبة، تسنا صاحبك يدخل");
            }

            const player2Name = await usersData.getName(senderID);
            global.game[threadID].player2 = { id: senderID, name: player2Name, symbol: "⭕" };
            global.game[threadID].waiting = false;
            global.game[threadID].on = true;
            global.game[threadID].turn = global.game[threadID].player1.id;

            const game = global.game[threadID];
            message.reply(`🎮 بدات اللعبة!\n❌ ${game.player1.name} VS ⭕ ${game.player2.name}\n\n${game.board}\n\nالدور ديال: ${game.player1.name}\nرد على هاد الرسالة برقم من 1-9`, (err, info) => {
                global.game[threadID].lastMessageID = info.messageID;
            });
            return;
        }

        // اللعب ضد البوت
        if (args[0] == "bot" || args[0] == "بوت") {
            if (global.game[threadID] && global.game[threadID].on) {
                return message.reply("⚠️ كاينة لعبة خدامة دابا\nكتب.xo close باش تساليها");
            }

            const player1Name = await usersData.getName(senderID);
            global.game[threadID] = {
                on: true,
                waiting: false,
                board: "🔲🔲🔲\n🔲🔲🔲\n🔲🔲🔲",
                boardArray: ["1","2","3","4","5","6","7","8","9"],
                turn: senderID,
                player1: { id: senderID, name: player1Name, symbol: "❌" },
                player2: { id: "BOT", name: "البوت 🤖", symbol: "⭕" },
                lastMessageID: "",
                moves: 0,
                vsBot: true
            };

            const game = global.game[threadID];
            message.reply(`🎮 بدات اللعبة ضد البوت!\n❌ ${game.player1.name} VS ⭕ ${game.player2.name}\n\n${game.board}\n\nالدور ديالك: ${game.player1.name}\nرد على هاد الرسالة برقم من 1-9`, (err, info) => {
                global.game[threadID].lastMessageID = info.messageID;
            });
            return;
        }

        // بدا لعبة جديدة - كتسنا لاعب آخر
        if (args[0] == "start" || args[0] == "بدا") {
            if (global.game[threadID] && (global.game[threadID].on || global.game[threadID].waiting)) {
                return message.reply("⚠️ كاينة لعبة خدامة ولا كتسنا\nكتب.xo close باش تساليها");
            }

            const player1Name = await usersData.getName(senderID);
            global.game[threadID] = {
                on: false,
                waiting: true,
                board: "🔲🔲🔲\n🔲🔲🔲\n🔲🔲🔲",
                boardArray: ["1","2","3","4","5","6","7","8","9"],
                player1: { id: senderID, name: player1Name, symbol: "❌" },
                player2: null,
                lastMessageID: "",
                moves: 0,
                vsBot: false
            };

            message.reply(`🎮 ${player1Name} بدا لعبة XO!\n\nأي واحد بغا يلعب يكتب:.xo join\n\n❌ ${player1Name} كيتسنا...`);
            return;
        }

        // إلا ما كتب والو
        return message.reply("🎮 لعبة XO\n\n.xo start - تبدا لعبة مع صاحبك\n.xo bot - تلعب ضد البوت\n.xo join - تدخل للعبة كتسنا\n.xo close - تسالي اللعبة");
    },

    onChat: async function ({ event, message }) {
        const threadID = event.threadID;
        const senderID = event.senderID;

        if (!global.game ||!global.game[threadID] ||!global.game[threadID].on) return;
        if (event.type!= "message_reply") return;
        if (event.messageReply.messageID!= global.game[threadID].lastMessageID) return;

        const game = global.game[threadID];

        if (senderID!= game.turn) {
            return message.reply("❌ ماشي الدور ديالك!");
        }

        const choice = event.body.trim();
        if (!["1","2","3","4","5","6","7","8","9"].includes(choice)) {
            return message.reply("❌ اختار رقم من 1 حتى 9 فقط");
        }

        const index = parseInt(choice) - 1;
        if (game.boardArray[index] == "❌" || game.boardArray[index] == "⭕") {
            return message.reply("❌ هاد الخانة عامرة!");
        }

        await this.makeMove(game, index, message, event);

        if (game.on && game.vsBot && game.turn == "BOT") {
            setTimeout(async () => {
                const botMove = this.getBotMove(game.boardArray);
                if (botMove!== -1) {
                    await this.makeMove(game, botMove, message, event, true);
                }
            }, 1000);
        }
    },

    makeMove: async function(game, index, message, event, isBot = false) {
        const currentPlayer = isBot? game.player2 : game.turn == game.player1.id? game.player1 : game.player2;
        game.boardArray[index] = currentPlayer.symbol;
        game.moves++;

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

        const winConditions = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        let winner = null;
        for (const [a,b,c] of winConditions) {
            if (game.boardArray[a] == currentPlayer.symbol &&
                game.boardArray[b] == currentPlayer.symbol &&
                game.boardArray[c] == currentPlayer.symbol) {
                winner = currentPlayer;
                break;
            }
        }

        message.unsend(event.messageReply.messageID);

        if (winner) {
            if (winner.id!= "BOT") {
                if (!global.gameScore[winner.id]) global.gameScore[winner.id] = 0;
                global.gameScore[winner.id]++;
            }

            const winMsg = winner.id == "BOT"?
                `😈 ${game.board}\n\nهزمك البوت! حاول مرة أخرى 💀` :
                `🎉 ${game.board}\n\n🏆 الفائز: ${winner.name} ${winner.symbol}\n📊 النقاط: ${global.gameScore[winner.id]}`;

            message.reply(winMsg);
            delete global.game[event.threadID];
            return;
        }

        if (game.moves == 9) {
            message.reply(`🤝 ${game.board}\n\nتعادل!`);
            delete global.game[event.threadID];
            return;
        }

        game.turn = currentPlayer.id == game.player1.id? game.player2.id : game.player1.id;
        const nextPlayer = game.turn == game.player1.id? game.player1 : game.player2;

        if (!isBot) {
            message.reply(`${game.board}\nالدور ديال: ${nextPlayer.name} ${nextPlayer.symbol}\nرد برقم من 1-9`, (err, info) => {
                game.lastMessageID = info.messageID;
            });
        }
    },

    getBotMove: function(board) {
        for (let i = 0; i < 9; i++) {
            if (board[i] == "❌" || board[i] == "⭕") continue;
            const temp = [...board];
            temp[i] = "⭕";
            if (this.checkWin(temp, "⭕")) return i;
        }
        for (let i = 0; i < 9; i++) {
            if (board[i] == "❌" || board[i] == "⭕") continue;
            const temp = [...board];
            temp[i] = "❌";
            if (this.checkWin(temp, "❌")) return i;
        }
        if (board[4]!= "❌" && board[4]!= "⭕") return 4;
        const corners = [0,2,6,8];
        const emptyCorners = corners.filter(i => board[i]!= "❌" && board[i]!= "⭕");
        if (emptyCorners.length > 0) return emptyCorners[Math.floor(Math.random() * emptyCorners.length)];
        for (let i = 0; i < 9; i++) {
            if (board[i]!= "❌" && board[i]!= "⭕") return i;
        }
        return -1;
    },

    checkWin: function(board, symbol) {
        const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
        return wins.some(([a,b,c]) => board[a]==symbol && board[b]==symbol && board[c]==symbol);
    }
};
