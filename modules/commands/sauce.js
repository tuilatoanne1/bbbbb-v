module.exports.config = {
	name: "sauce",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "CatalizCS",
	description: "Tìm kiếm thông tin ảnh thông qua ảnh (chỉ dành cho anime và hentai)",
	commandCategory: "general",
	usages: "sauce",
	cooldowns: 5,
	dependencies: ["sagiri","axios","nsfwjs","@tensorflow/tfjs-node"],
	info: [
		{
			key: "reply ảnh",
			prompt: "Bạn cần phải reply (phản hồi) ảnh/gif để có thể tìm sauce",
			type: 'Reply',
			example: 'Không Có'
		}
	]
};

const axios = require("axios");
const tf = require("@tensorflow/tfjs-node");
const nsfw = require("nsfwjs");
let nsfw_model;

(async () => {
	nsfw_model = await nsfw.load();
})();

async function moderate(url) {
	const pic = await axios.get(url, {
		responseType: "arraybuffer",
	});
	const image = await tf.node.decodeImage(pic.data, 3);
	const predictions = await nsfw_model.classify(image);
	image.dispose();
	let final_result = "";
	let final_probability = 0;
	console.log(predictions);
	predictions.forEach((prediction) => {
		if (prediction.probability >= final_probability) {
			final_probability = prediction.probability;
			final_result = prediction.className;
		}
	})
	if (final_probability >= 0.5) return final_result;
	else return "";
}

module.exports.event = async ({ api, event, __GLOBAL }) => {
	console.log(event);
	const sagiri = require('sagiri'), search = sagiri(__GLOBAL.settings.SAUCENAO_API);
	if (!event.attachments[0]) return;
	if(event.attachments[0].type !== 'photo') return;
	let detectValue = await moderate(event.attachments[0].url);
	if (["Drawing"].includes(detectValue) || ["Hentai"].includes(detectValue)) {
		return search(event.attachments[0].url).then(response => {
			let data = response[0];
			let results = {
				similarity: data.similarity,
				material: data.raw.data.material || 'Không có',
				characters: data.raw.data.characters || 'Original',
				creator: data.raw.data.creator || 'Không biết',
				site: data.site,
				url: data.url
			};
			const minSimilarity = 50;
			if (minSimilarity <= ~~results.similarity) {
				api.sendMessage(
					'Đây là kết quả tìm kiếm được\n' +
					'-------------------------\n' +
					'- Độ tương tự: ' + results.similarity + '%\n' +
					'- Material: ' + results.material + '\n' +
					'- Characters: ' + results.characters + '\n' +
					'- Creator: ' + results.creator + '\n' +
					'- Original site: ' + results.site + ' - ' + results.url,
					event.threadID, event.messageID
				);
			}
			else api.sendMessage(`Không thấy kết quả nào trùng với ảnh bạn đang tìm kiếm :'(`, event.threadID, event.messageID);
		});
	}
	else return;
}

module.exports.run = async ({ api, event, args, __GLOBAL }) => {
	const sagiri = require('sagiri'), search = sagiri(__GLOBAL.settings.SAUCENAO_API);
	if (event.type != "message_reply") return api.sendMessage(`Vui lòng bạn reply bức ảnh cần phải tìm!`, event.threadID, event.messageID);
	if (event.messageReply.attachments.length > 1) return api.sendMessage(`Vui lòng reply chỉ một ảnh!`, event.threadID, event.messageID);
	if (event.messageReply.attachments[0].type == 'photo') {
		return search(event.messageReply.attachments[0].url).then(response => {
			let data = response[0];
			let results = {
				similarity: data.similarity,
				material: data.raw.data.material || 'Không có',
				characters: data.raw.data.characters || 'Original',
				creator: data.raw.data.creator || 'Không biết',
				site: data.site,
				url: data.url
			};
			const minSimilarity = 50;
			if (minSimilarity <= ~~results.similarity) {
				api.sendMessage(
					'Đây là kết quả tìm kiếm được\n' +
					'-------------------------\n' +
					'- Độ tương tự: ' + results.similarity + '%\n' +
					'- Material: ' + results.material + '\n' +
					'- Characters: ' + results.characters + '\n' +
					'- Creator: ' + results.creator + '\n' +
					'- Original site: ' + results.site + ' - ' + results.url,
					event.threadID, event.messageID
				);
			}
			else api.sendMessage(`Không thấy kết quả nào trùng với ảnh bạn đang tìm kiếm :'(`, event.threadID, event.messageID);
		});
	}
}