const fs = require("fs-extra");
const request = require("request");

module.exports = {
config: {
    name: "groupinfo",
    aliases: ['boxinfo'],
    version: "1.0",
    author: "Kyle pogi",
    countDown: 5,
    role: 2,
    shortDescription: "See Full Box Information With Image",
    longDescription: "",
    category: "Group Chat",
    guide: { en: "{p} [groupinfo|boxinfo]" }
},

onStart: async function ({ api, event, args }) {
    try {
        let threadInfo = await api.getThreadInfo(event.threadID);
        var memLength = threadInfo.participantIDs.length;
        let threadMem = threadInfo.participantIDs.length;
        var nameMen = [];
        var gendernam = [];
        var gendernu = [];
        var nope = [];

        for (let z in threadInfo.userInfo) {
            var gioitinhone = threadInfo.userInfo[z].gender;
            var nName = threadInfo.userInfo[z].name;
            if(gioitinhone == "MALE"){ gendernam.push(z+gioitinhone) }
            else if(gioitinhone == "FEMALE"){ gendernu.push(gioitinhone) }
            else{ nope.push(nName) }
        };

        var nam = gendernam.length;
        var nu = gendernu.length;
        var listad = '';
        var qtv2 = threadInfo.adminIDs;
        let qtv = threadInfo.adminIDs.length;
        let sl = threadInfo.messageCount;
        let icon = threadInfo.emoji;
        let threadName = threadInfo.threadName;
        let id = threadInfo.threadID;

        for (let i = 0; i < qtv2.length; i++) {
            const infu = (await api.getUserInfo(qtv2[i].id));
            const name = infu[qtv2[i].id].name;
            listad += '•' + name + '\n';
        }

        let sex = threadInfo.approvalMode;
        var pd = sex == false? 'Turned off' : sex == true? 'Turned on' : 'kyle';

        let body = `🔰𝐆𝐂 𝐍𝐚𝐦𝐞 :${threadName}🔰\n📜 𝐆𝐫𝐨𝐮𝐩 𝐈𝐃 : ${id}\n⚙️ 𝐀𝐩𝐩𝐫𝐨𝐯𝐚𝐥 : ${pd}\n⪼ 𝐄𝐦𝐨𝐣𝐢 ⪻: ${icon}\n📜 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧 : 𝐈𝐧𝐜𝐥𝐮𝐝𝐢𝐧𝐠 ${threadMem} 𝐌𝐞𝐦𝐛𝐞𝐫𝐬\n👨‍🦰 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐌𝐚𝐥𝐞𝐬 : ${nam}\n👩‍🦰 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐅𝐞𝐦𝐚𝐥𝐞𝐬 : ${nu}\n🔱 𝐓𝐨𝐭𝐚𝐥 𝐀𝐝𝐦𝐢𝐧𝐢𝐬𝐭𝐫𝐚𝐭𝐨𝐫𝐬 : ${qtv} \n⚙️ 𝐈𝐧𝐜𝐥𝐮𝐝𝐞 :\n${listad}\n🌐 𝐓𝐨𝐭𝐚𝐥 𝐍𝐮𝐦𝐛𝐞𝐫 𝐎𝐟 𝐌𝐞𝐬𝐚𝐠𝐞𝐬 : ${sl} messages.\n\n𝐁𝐲: KYLE BAIT-IT.\n\ncontact him or Follow: https://www.facebook.com/profile.php?id=100052395031835`;

        // إلا ما كايناش صورة صيفط النص بوحدو
        if (!threadInfo.imageSrc) {
            return api.sendMessage(body, event.threadID, event.messageID);
        }

        // إلا كاينة صورة هبطها وصيفطها
        var callback = () => {
            api.sendMessage(
                { body: body, attachment: fs.createReadStream(__dirname + '/cache/1.png') },
                event.threadID,
                (err, info) => {
                    // مسح الملف من بعد 5 ثواني باش ما يكراشيش
                    setTimeout(() => {
                        if (fs.existsSync(__dirname + '/cache/1.png'))
                            fs.unlinkSync(__dirname + '/cache/1.png');
                    }, 5000);
                },
                event.messageID
            );
        };

        return request(encodeURI(`${threadInfo.imageSrc}`))
       .pipe(fs.createWriteStream(__dirname + '/cache/1.png'))
       .on('close', () => callback())
       .on('error', (err) => {
            console.log(err);
            return api.sendMessage(body, event.threadID, event.messageID);
        });

    } catch(e) {
        console.log(e);
        return api.sendMessage("❌ صار خطأ: " + e.message, event.threadID, event.messageID);
    }
}
};
