
const axios = require('axios');
const fse = require('fs-extra')
const listUrl = 'http://api.bilibili.com/x/space/arc/search?mid=23244083'
const mid = '23244083';
const moment = require('moment');
const { startDownload, download } = require('./download');
const path = require('path')
const os = require('os')
// moment
let pageIndex = 1;
let pageSize = 10;

async function getList(url) {
    const { data } = await axios.get(url, {
        params: {
            mid: mid,
            pn: pageIndex,
            ps: pageSize
        }
    })
    if (data.code === 0 && data.data.list && data.data.list.vlist.length > 0 ) {
        await Promise.allSettled(data.data.list.vlist.map(async item => {

            let dir = path.join(__dirname, `../download/${moment(item.created * 1000).format('YYYY-MM-DD HH-mm')}_${item.bvid}_${item.title}/`);
            fse.ensureDirSync(dir)
            fse.outputJSONSync(dir + 'info.json', item);
            let token = '';
            try {
                token = fse.readFileSync( path.join( os.homedir(),'bilili-download','token.txt' )).toString() || ''
            } catch (error) {
                
            }
            return await download(item.bvid, dir, token);
        }))
        pageIndex++;
        getList(listUrl);
    }

}

getList(listUrl)

 