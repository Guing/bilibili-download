
const axios = require('axios');
const fse = require('fs-extra')
const listUrl = 'http://api.bilibili.com/x/space/arc/search?mid=23244083'
const mid = '23244083';
const moment = require('moment');
const { startDownload } = require('./download');
const path = require('path')
// moment
let pageIndex = 1;
let pageSize = 1;

async function getList(url) {
    const { data } = await axios.get(url, {
        params: {
            mid: mid,
            pn: pageIndex,
            ps: pageSize
        }
    })
     if(data.code === 0 && data.data.list && data.data.list.vlist.length > 0 ){
        data.data.list.vlist.map(item=>{
            
            let dir = path.join(__dirname,  `../download/${moment(item.created*1000).format('YYYY-MM-DD')}_${item.typeid}_${item.title}/`);
            fse.ensureDirSync(dir)
            fse.outputJSONSync(dir+'info.json',item);
            startDownload(item.aid,'360P',dir)
        })
     }

}

getList(listUrl)