const cp = require('child_process')
const path = require('path')
const iconv = require('iconv-lite');
const BufferHelper = require('bufferhelper');
const moment = require('moment');
const fse = require('fs-extra')
let outObj = {
    aid: '',
    info: '',
    error: ''
}
function download(aid, dir, sessdata = '') {
    return new Promise((resolve, reject) => {
        const child = cp.spawn(path.resolve(__dirname, '../bin/BBDown.exe'), ['--work-dir', dir, '-c', 'SESSDATA=' + sessdata, aid], {
            cwd: path.resolve('.')
        })
        var bufferInfo = new BufferHelper();
        var bufferError = new BufferHelper();
        outObj.aid = aid;
        child.stdout.on('data', function (chunk) {
            bufferInfo.concat(chunk);
          
        });
        child.stderr.on('data', function (chunk) {
            bufferError.concat(chunk);
          
        });
        child.on('error', e => { // 监听错误
            reject();
            process.exit(1);
        });
        child.on('exit', e => {// 监听执行成功后的退出事件
            outObj.info = iconv.decode(bufferInfo.toBuffer(), 'gbk')
            outObj.error = iconv.decode(bufferError.toBuffer(), 'gbk')
            setLog(outObj);

            resolve();
        });
    })

}
function setLog(outObj) {
    const logPath = path.resolve(__dirname, '../log/log.json');
    fse.ensureFileSync(logPath)
    if (!outObj.info.match(/[\s\S]+?(任务完成)/g)) {
        outObj.error = '1'
    }
    outObj.time= moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    let data = require(logPath);
    if (!data || !Array.isArray(data.list)) {
        data = {
            list: []
        }
    }

    data.list.push(outObj);
    fse.writeJsonSync(logPath, data)
}

module.exports = {
    download
}