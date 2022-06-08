const fs = require('fs');
const path = require('path');
const axios = require('axios');
const request = require('request');
const md5 = require('md5');
const { isBV, bv2av } = require('./utils');

const Progress = require('./progress');
let downloadDir ;
const appkey = 'iVGUTjsxvpLeuDCf',
	sec = 'aHRmhWMLkdeMuILqORnYZocwMBpMEOdt';
const qualityMap = {
	'1080P': 80,
	'720P': 64,
	'480P': 32,
	'360P': 16,
};
/**
 * 
 * @param {*} url    视频URL地址   
 * @param {*} quality  质量选择
 * @param {*} format   下载格式： mp4,flv
 */
async function startDownload(aid, quality,dir, format='mp4') {
	// const aid = url.substr(31, 12);
	quality = qualityMap[quality];
	downloadDir = dir;
	// isBV(aid) && (aid = bv2av(aid).substr(2));

	let startUrl = 'https://api.bilibili.com/x/web-interface/view?aid=' + aid;
	let headers = {
		'User-Agent':
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
	};
	const res = await axios.get(startUrl, { headers });
	const { pages } = res.data.data;

	for (let i = 0; i < pages.length; i++) {
		let { cid, part, page } = pages[i];
		startUrl += '/?p=' + page;
		const list = await getPlayList(startUrl, cid, quality);
		if (list.length > 2) {
			console.warn('暂时只能下载第一条视频');
		}
		await download([list[0]], part, startUrl, page, format);
	}
}

async function getPlayList(startUrl, cid, quality) {

	const params = `appkey=${appkey}&cid=${cid}&otype=json&qn=${quality}&quality=${quality}&type=`;
	const chksum = md5(params + sec);
	const api = `https://interface.bilibili.com/v2/playurl?${params}&sign=${chksum}`;
	const headers = {
		Referer: startUrl,
		'User-Agent':
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.87 Safari/537.36',
	};
	const res = await axios.get(api, { headers });
	return res.data.durl;
}

async function download(list, title, startUrl, page, format) {
	return new Promise((resolve) => {
		const dir =  downloadDir;
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir);
		}
		console.log(dir);
		for (let i = 0; i < list.length; i++) {
			const { size: total, url } = list[i];
			const headers = {
				// Host: 'upos-hz-mirrorks3.acgvideo.com', // 注意修改host,不用也行
				'User-Agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:56.0) Gecko/20100101 Firefox/56.0',
				Accept: '*/*',
				'Accept-Language': 'en-US,en;q=0.5',
				'Accept-Encoding': 'gzip, deflate, br',
				Range: 'bytes=0-',
				Referer: startUrl,
				Origin: 'https://www.bilibili.com',
				Connection: 'keep-alive',
			};

			let completed = 0;
			const ProgressBar = new Progress('正在下载：' + title);
			const downloadPath = path.join(dir, title + '.' + format);
			const out = fs.createWriteStream(downloadPath);
			const req = request({ url, headers });
			req.pipe(out);
			req.on('data', (data) => {
				completed += data.length;
				ProgressBar.render({
					completed,
					total,
				});
			});
			req.on('end', () => {
				console.log('  下载完成！');
				resolve();
			});
		}
	});
}


module.exports = {
	startDownload
}