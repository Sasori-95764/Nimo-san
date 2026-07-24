const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
	const base = await axios.get(
`https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`
	);
	return base.data.api;
};

module.exports = {
	config: {
		name: "ytb", // يمكنك تغيير اسم الأمر هنا إذا أردت
		version: "1.3.0",
		aliases: ['youtube', 'play'],
		author: "dipto",
		countDown: 5,
		role: 0,
		description: {
			en: "Download video or audio from YouTube precisely"
		},
		category: "media",
		guide: {
			en: "  {pn} -v [رابط أو اسم] -> لتحميل فيديو\n  {pn} -a [رابط أو اسم] -> لتحميل صوت فقط (mp3)"
		}
	},
	onStart: async ({ api, args, event, commandName }) => {
		const action = args[0]?.toLowerCase();
		
		// التأكد من أن المستخدم حدد نوع الطلب (-v للفيديو أو -a للصوت)
		if (action !== '-v' && action !== '-a') {
			return api.sendMessage("❌ يرجى تحديد هل تريد فيديو أم صوت!\nاستعمل:\nytbu -v [اسم أو رابط]\nytbu -a [اسم أو رابط]", event.threadID, event.messageID);
		}

		args.shift(); // إزالة الأكشن (-v أو -a) ليبقى البحث أو الرابط
		const query = args.join(" ");
		if (!query) return api.sendMessage("❌ يرجى كتابة اسم الفيديو أو الرابط.", event.threadID, event.messageID);

		const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-}{11})(?:\S+)?$/;
		const isUrl = checkurl.test(query);

		// إذا كان رابط مباشرة
		if (isUrl) {
			try {
				const format = action === '-v' ? 'mp4' : 'mp3';
				const match = query.match(checkurl);
				const videoID = match ? match[1] : null;
				const path = `ytb_${format}_${videoID}.${format}`;
  
				const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`);
				
				return api.sendMessage({
					body: `• Title: ${title}\n• Type: ${format.toUpperCase()}\n• Quality: ${quality}`,
					attachment: await dipto(downloadLink, path)
				}, event.threadID, () => {
					if (fs.existsSync(path)) fs.unlinkSync(path);
				}, event.messageID);
			} catch (e) {
				console.error(e);
				return api.sendMessage('❌ فشل التحميل، حاول مرة أخرى.', event.threadID, event.messageID);
			}
		}

		// إذا كان بحث بالاسم
		const maxResults = 6;
		let result;
		try {
			result = (await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${query}`)).data.slice(0, maxResults);
		} catch (err) {
			return api.sendMessage("❌ حدث خطأ في البحث: " + err.message, event.threadID, event.messageID);
		}

		if (result.length === 0) {
			return api.sendMessage("⭕ لم يتم العثور على نتائج تطابق بحثك.", event.threadID, event.messageID);
		}

		let msg = "🔍 نتائج البحث:\n\n";
		let i = 1;
		const thumbnails = [];
		for (const info of result) {
			thumbnails.push(diptoSt(info.thumbnail, `thumbnail_${i}.jpg`));
			msg += `${i++}. ${info.title}\n⏱️ ${info.time} | 📺 ${info.channel.name}\n\n`;
		}

		api.sendMessage({
			body: msg + "قم بالرد على هذه الرسالة برقم الفيديو المطلوب لتحميله بالصيغة التي اخترتها (" + (action === '-v' ? 'فيديو 🎥' : 'صوت 🎵') + ")",
			attachment: await Promise.all(thumbnails)
		}, event.threadID, (err, info) => {
			global.GoatBot.onReply.set(info.messageID, {
				commandName,
				messageID: info.messageID,
				author: event.senderID,
				result,
				action // تخزين نوع الطلب (فيديو أو صوت) لاستخدامه عند الرد برقم
			});
		}, event.messageID);
	},

	onReply: async ({ event, api, Reply }) => {
		const { result, action } = Reply;
		const choice = parseInt(event.body);

		if (isNaN(choice) || choice <= 0 || choice > result.length) {
			return api.sendMessage('❌ اختيار غير صحيح، يرجى الرد برقم من القائمة.', event.threadID, event.messageID);
		}

		const selectedVideo = result[choice - 1];
		const videoID = selectedVideo.id;
		const format = action === '-v' ? 'mp4' : 'mp3'; // تحديد الصيغة بناءً على طلب المستخدم في البداية

		try {
			const path = `ytb_${format}_${videoID}.${format}`;
			const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${videoID}&format=${format}&quality=3`);

			api.unsendMessage(Reply.messageID);
			await api.sendMessage({
				body: `• Title: ${title}\n• Type: ${format.toUpperCase()}\n• Quality: ${quality}`,
				attachment: await dipto(downloadLink, path)
			}, event.threadID, () => {
				if (fs.existsSync(path)) fs.unlinkSync(path);
			}, event.messageID);
		} catch (e) {
			console.error(e);
			return api.sendMessage('❌ فشل تحميل الملف، حاول مرة أخرى.', event.threadID, event.messageID);
		}
	}
};

async function dipto(url, pathName) {
	try {
		const response = await axios({
			method: 'GET',
			url: url,
			responseType: 'stream'
		});
		
		const writer = fs.createWriteStream(pathName);
		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on('finish', () => resolve(fs.createReadStream(pathName)));
			writer.on('error', reject);
		});
	} catch (err) {
		throw err;
	}
}

async function diptoSt(url, pathName) {
	try {
		const response = await axios.get(url, {
			responseType: "stream"
		});
		response.data.path = pathName;
		return response.data;
	} catch (err) {
		throw err;
	}
}
