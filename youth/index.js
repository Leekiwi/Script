/*
更新时间: 2020-07-05 18:45

赞赏:中青邀请码`46308484`,农妇山泉 -> 有点咸，万分感谢

本脚本仅适用于中青看点极速版领取青豆

增加每日打卡，打卡时间每日5:00-8:00❗️，请不要忘记设置运行时间，共3条Cookie，请全部获取，获取请注释掉

获取Cookie方法:
1.将下方[rewrite_local]和[MITM]地址复制的相应的区域
下，
2.进入app，进入任务中心或者签到一次,即可获取Cookie. 阅读一篇文章，获取阅读请求body，并获取阅读时长，在阅读文章最下面有个惊喜红包，点击获取惊喜红包请求
3.可随时获取Cookie.
4.增加转盘抽奖通知间隔，为了照顾新用户，前三次会有通知，以后默认每10次转盘抽奖通知一次，可自行修改❗️ 转盘完成后通知会一直开启
5.非专业人士制作，欢迎各位大佬提出宝贵意见和指导
6.更新日志: 
 31/05 v1.01 取消激励视频Cookie，添加阅读时长

阅读奖励和看视频得奖励一个请求只能运行三次‼️，请不要询问为什么，次日可以继续

by Macsuny

~~~~~~~~~~~~~~~~
Surge 4.0 :
[Script]
中青看点 = type=cron,cronexp=35 5 0 * * *,script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js,script-update-interval=0

中青看点 = type=http-request,pattern=https:\/\/\w+\.youth\.cn\/TaskCenter\/(sign|getSign),script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js

中青看点 = type=http-request,pattern=https:\/\/ios\.baertt\.com\/v5\/(article\/complete|article\/red_packet|user\/app_stay\.json),script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js, requires-body=true

~~~~~~~~~~~~~~~~
Loon 2.1.0+
[Script]
# 本地脚本
cron "04 00 * * *" script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js, enabled=true, tag=中青看点

http-request https:\/\/\w+\.youth\.cn\/TaskCenter\/(sign|getSign) script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js
http-request https:\/\/ios\.baertt\.com\/v5\/(article\/complete|article\/red_packet|user\/app_stay\.json) script-path=https://raw.staticdn.net/Sunert/Scripts/master/Task/youth.js, requires-body=true
-----------------
QX 1.0. 7+ :
[task_local]
0 9 * * * youth.js

[rewrite_local]
https:\/\/\w+\.youth\.cn\/TaskCenter\/(sign|getSign) url script-request-header youth.js

https?:\/\/ios\.baertt\.com\/v5\/(article\/complete|article\/red_packet|user\/app_stay\.json) url script-request-body youth.js

~~~~~~~~~~~~~~~~
[MITM]
hostname = *.youth.cn, ios.baertt.com 
~~~~~~~~~~~~~~~~

*/
const notifyInterval = 50  //通知间隔，默认抽奖每50次通知一次，如需关闭全部通知请设为0
const logs = 0;   //0为关闭日志，1为开启
const CookieName = "中青看点"
const signheaderKey = 'youthheader_zq'
const articlebodyKey = 'read_zq'
const redpbodyKey = 'red_zq'
const timebodyKey = 'readtime_zq'
const sy = init()
const lastSigninDate = sy.getdata('youth_signDate');
const lastClockedIn = sy.getdata('youth_daliy_clock_in');

const signheaderVal = sy.getdata(signheaderKey);
const redpbodyVal = sy.getdata(redpbodyKey);
const articlebodyVal = sy.getdata(articlebodyKey);
const timebodyVal = sy.getdata(timebodyKey);
let rotarynum = "";
let rotaryres = {};
let isGetCookie = typeof $request !== 'undefined';

isGetCookie ? GetCookie() : all();

function GetCookie() {
    if ($request && $request.method != `OPTIONS` && $request.url.match(/\/TaskCenter\/(sign|getSign)/)) {
        const signheaderVal = JSON.stringify($request.headers)
        if (signheaderVal) sy.setdata(signheaderVal, signheaderKey)
        sy.log(`[${CookieName}] 获取Cookie: 成功,signheaderVal: ${signheaderVal}`)
        // sy.msg(CookieName, `获取Cookie: 成功🎉`, ``)
    }
    else if ($request && $request.method != `OPTIONS` && $request.url.match(/\/article\/complete/)) {
        const articlebodyVal = $request.body
        if (articlebodyVal) sy.setdata(articlebodyVal, articlebodyKey)
        sy.log(`[${CookieName}] 获取阅读: 成功,articlebodyVal: ${articlebodyVal}`)
        sy.msg(CookieName, `获取阅读请求: 成功🎉`, ``)
    }
    else if ($request && $request.method != `OPTIONS` && $request.url.match(/\/v5\/user\/app_stay/)) {
        const timebodyVal = $request.body
        if (timebodyVal) sy.setdata(timebodyVal, timebodyKey)
        sy.log(`[${CookieName}] 获取阅读: 成功,timebodyVal: ${timebodyVal}`)
        sy.msg(CookieName, `获取阅读时长: 成功🎉`, ``)
    }
    else if ($request && $request.method != `OPTIONS` && $request.url.match(/\/article\/red_packet/)) {
        const redpbodyVal = $request.body
        if (redpbodyVal) sy.setdata(redpbodyVal, redpbodyKey)
        sy.log(`[${CookieName}] 获取惊喜红包: 成功,redpbodyVal: ${redpbodyVal}`)
        sy.msg(CookieName, `获取惊喜红包请求: 成功🎉`, ``)
    }
}

async function all() {
    if (!signheaderVal) {
        return sy.msg(CookieName, `请先获取cookie再执行脚本`, ``);
    }
    await sign();
    await signInfo();
    const firstcache = await punchCard();
    if(firstcache){
        await endCard();
        await Cardshare();
    }
    await getAdVideo();
    // await gameVideo();
    await Articlered();
    await aticleshare();
    await rotary();
    await rotaryCheck();
    await openbox();
    await share();
    await readArticle();
    await readTime();
    await earningsInfo();
    await showmsg();
}

function sign() {
    return new Promise((resolve, reject) => {
        const dateobj = new Date();
        const signinDate = dateobj.getMonth()+dateobj.getDate();
        if(signinDate == lastSigninDate){
            resolve();
        }
        const signurl = {
            url: 'https://kd.youth.cn/TaskCenter/sign',
            headers: JSON.parse(signheaderVal),
        }
        sy.post(signurl, (error, response, data) => {
            if (logs) sy.log(`${CookieName}, data: ${data}`)
            signres = JSON.parse(data)
            if (signres.status == 2) {
                signresult = `签到失败，Cookie已失效‼️`;
                detail = ``;
                return sy.msg(CookieName, signresult, detail);
            } else if (signres.status == 0) {
                signresult = `【签到信息】重复`;
                detail = ``;
            }else if (signres.status == 1) {
                signresult = `【签到信息】成功`;
                detail = `金币: +${signres.score}，明日金币: +${signres.nextScore}\n`;
                sy.setdata(signinDate, 'youth_signDate');
            }
            resolve()
        })
    })
}

function signInfo() {
    return new Promise((resolve, reject) => {
        const infourl = {
            url: 'https://kd.youth.cn/TaskCenter/getSign',
            headers: JSON.parse(signheaderVal),
        }
        sy.post(infourl, (error, response, data) => {
            if (logs) sy.log(`${CookieName}, 签到信息: ${data}`);
            signinfo = JSON.parse(data);
            if (signinfo.status == 1) {
                subTitle = `【收益总计】${signinfo.data.user.score}青豆  现金约${signinfo.data.user.money}元\n`;
                nick = `账号: ${signinfo.data.user.nickname}`;
                detail = `${signresult}(+${signinfo.data.sign_score}青豆) 已连签: ${signinfo.data.sign_day}天\n<本次收益>：\n`;
            } else {
                subTitle = `${signinfo.msg}`;
                detail = ``;
            }
            resolve()
        })
    })
}

function aticleshare() {
    return new Promise((resolve, reject) => {
        const rand = Math.random().toFixed(3).toString().substr(2).replace("0", "7");
        shareurl = {
            url: `https://kd.youth.cn/n/27043${rand}?46746961.html`,
            headers: { Cookie: JSON.parse(signheaderVal)['Cookie'] },
        }
        sy.get(shareurl, (error, response, data) => {
            // sy.log(`aticleshare:${data}`);
            resolve();
        })
    })
}


//看视频奖励
function getAdVideo() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://kd.youth.cn/taskCenter/getAdVideoReward`,
            headers: JSON.parse(signheaderVal),
            body: 'type=taskCenter'
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`视频广告:${data}`)
            adVideores = JSON.parse(data)
            if (adVideores.status == 1) {
                detail += `【观看视频】+${adVideores.score}个青豆\n`
            }
            resolve()
        })
    })
}
// 点我激励视频奖励
function gameVideo() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://ios.baertt.com/v5/Game/GameVideoReward.json`,
            body: articlebodyVal,
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`激励视频:${data}`)
            gameres = JSON.parse(data)
            if (gameres.success == true) {
                detail += `【激励视频】${gameres.items.score}\n`
            }else{
                if(gameres.error_code == "10003"){
                    detail += `【激励视频】${gameres.message},疑似cookie没有\n`
                }
            }
            resolve()
        })
    })
}

//阅读奖励
function readArticle() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://ios.baertt.com/v5/article/complete.json`,
            body: articlebodyVal,
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`阅读奖励:${data}`)
            readres = JSON.parse(data);
            if (readres.items.max_notice == '\u770b\u592a\u4e45\u4e86\uff0c\u63621\u7bc7\u8bd5\u8bd5') {
                detail += `【阅读奖励】看太久了，换1篇试试\n`;
            }else if (readres.items.read_score !== undefined) {
                detail += `【阅读奖励】+${readres.items.read_score}个青豆\n`;
            }
            resolve()
        })
    })
}

//文章阅读附加
function Articlered() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://ios.baertt.com/v5/article/red_packet.json`,
            body: redpbodyVal,
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`阅读附加:${data}`)
            redres = JSON.parse(data)
            if (redres.success == true) {
                detail += `【惊喜红包】+${redres.items.score}个青豆\n`
            }else{
                if(redres.error_code == "200001"){
                    detail += `【惊喜红包】${redres.message},疑似cookie没有\n`
                }
            }
            resolve()
        })
    })
}

//转盘奖励
function rotary() {
    const rotarbody = signheaderVal.split("&")[15] + '&' + signheaderVal.split("&")[8]
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const time = new Date().getTime()
            const url = {
                url: `https://kd.youth.cn/WebApi/RotaryTable/turnRotary?_=${time}`,
                headers: JSON.parse(signheaderVal),
                body: rotarbody
            }
            sy.post(url, (error, response, data) => {
                if (logs) sy.log(`转盘抽奖:${data}`)
                rotaryres = JSON.parse(data)
                if (rotaryres.status == 1) {
                    detail += `【转盘抽奖】+${rotaryres.data.score}个青豆 剩余${rotaryres.data.remainTurn}次\n`
                }
                if (rotaryres.code == 10010) {
                    rotarynum = ` 转盘${rotaryres.msg}🎉`
                }else{
                    if (rotaryres.data.doubleNum != 0) {
                        TurnDouble()
                    }
                }
                resolve();
            })
        }, Math.ceil(Math.random() * 1000).toFixed(0));
    })
}

//转盘宝箱判断
function rotaryCheck() {
    return new Promise(async resolve => {
        if (rotaryres.code == 10010) {
            return resolve();
        }
        let i = 0;
        while (i <= 3) {
            if (100 - rotaryres.data.remainTurn == rotaryres.data.chestOpen[i].times) {
                await runRotary(i + 1)
            }
            i++;
        }
        resolve();
    })
}

//开启宝箱1-4
function runRotary(index) {
    return new Promise((resolve, reject) => {
        const rotarbody = signheaderVal.split("&")[15] + '&' + signheaderVal.split("&")[8] + '&num=' + index;
        const time = new Date().getTime();
        const url = {
            url: `https://kd.youth.cn/WebApi/RotaryTable/chestReward?_=${time}`,
            headers: JSON.parse(signheaderVal),
            body: rotarbody
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`转盘宝箱${index}抽奖:${data}`)
            const rotaryresp = JSON.parse(data);
            if (rotaryresp.status == 1) {
                detail += `【转盘宝箱${index}】+${rotaryresp.data.score}个青豆\n`;
            }else{
                if(rotaryresp.code == "10010"){
                    // TODO .今日抽奖完成
                    detail += `【转盘宝箱${index}】+今日抽奖完成\n`;
                }
            }
            resolve();
        })
    })
}

//开启打卡
function punchCard() {
    return new Promise((resolve, reject) => {
        const dateobj = new Date();
        const mark = dateobj.getMonth() + dateobj.getDate();
        if(lastClockedIn && mark == lastClockedIn){
            resolve(false);
        }
        const url = {
            url: `https://kd.youth.cn/WebApi/PunchCard/signUp?`,
            headers: JSON.parse(signheaderVal),
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`每日开启打卡:${data}`);
            punchcardstart = JSON.parse(data);
            if (punchcardstart.code == 1) {
                detail += `【打卡报名】打卡报名${punchcardstart.msg} ✅ \n`;
                sy.setdata(mark, 'youth_daliy_clock_in');
                resolve(true);
            }
            detail += `【打卡报名】${punchcardstart.msg}\n`
            resolve(false);
        })
    })
}

//结束打卡
function endCard() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const url = {
                url: `https://kd.youth.cn/WebApi/PunchCard/doCard?`,
                headers: JSON.parse(signheaderVal),
            }
            sy.post(url, (error, response, data) => {
                if (logs) sy.log(`打卡结果:${data}`)
                punchcardend = JSON.parse(data)
                if (punchcardend.code == 1) {
                    detail += `【早起打卡】${punchcardend.data.card_time}${punchcardend.msg}✅\n`
                } else if (punchcardend.code == 0) {
                    // TODO .不在打卡时间范围内
                    detail += `【早起打卡】${punchcardend.msg}\n`
                }
                resolve()
            })
        })
    })
}

//打卡分享
function Cardshare() {
    return new Promise((resolve, reject) => {
        const starturl = {
            url: `https://kd.youth.cn/WebApi/PunchCard/shareStart?`,
            headers: JSON.parse(signheaderVal),
        }
        sy.post(starturl, (error, response, data) => {
            if (logs) sy.log(`打卡分享开启:${data}`)
            sharestart = JSON.parse(data)
            detail += `【打卡分享】${sharestart.msg}\n`
            if (sharestart.code == 1) {
                setTimeout(() => {
                    let endurl = {
                        url: `https://kd.youth.cn/WebApi/PunchCard/shareEnd?`,
                        headers: JSON.parse(signheaderVal),
                    }
                    sy.post(endurl, (error, response, data) => {
                        if (logs) sy.log(`打卡分享:${data}`)
                        shareres = JSON.parse(data)
                        if (shareres.code == 1) {
                            detail += `+${shareres.data.score}青豆\n`
                        } else {
                            detail += `${shareres.msg}\n`
                        }
                        resolve()
                    })
                }, 3000 + Math.ceil(Math.random()*1000));
            }else{
                resolve()
            }
        })
    })
}

//开启时段宝箱
function openbox() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const url = {
                url: `https://kd.youth.cn/WebApi/invite/openHourRed`,
                headers: JSON.parse(signheaderVal),
            }
            sy.post(url, (error, response, data) => {
                if (logs) sy.log(`时段开启宝箱:${data}`)
                boxres = JSON.parse(data)
                if (boxres.code == 1) {
                    detail += `【开启宝箱】+${boxres.data.score}青豆 下次奖励${boxres.data.time / 60}分钟\n`
                }else{
                    detail += `【开启宝箱】${boxres.msg}\n`
                }
                resolve()
            })
        })
    })
}

//宝箱分享
function share() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const url = {
                url: `https://kd.youth.cn/WebApi/invite/shareEnd`,
                headers: JSON.parse(signheaderVal),
            }
            sy.post(url, (error, response, data) => {
                if (logs) sy.log(`宝箱分享:${data}`)
                shareres = JSON.parse(data)
                if (shareres.code == 1) {
                    detail += `【宝箱分享】+${shareres.data.score}青豆\n`
                }else{
                    detail += `【宝箱分享】${shareres.msg}\n`
                }
                resolve()
            })
        }, 6000);
    })
}

//转盘双倍奖励
function TurnDouble() {
    const rotarbody = signheaderVal.split("&")[15] + '&' + signheaderVal.split("&")[8]
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const time = (new Date()).getTime()
            const url = {
                url: `https://kd.youth.cn/WebApi/RotaryTable/toTurnDouble?_=${time}`,
                headers: JSON.parse(signheaderVal),
                body: rotarbody
            }
            sy.post(url, (error, response, data) => {
                if (logs) sy.log(`转盘双倍奖励:${data}`)
                Doubleres = JSON.parse(data)
                if (Doubleres.status == 1) {
                    detail += `【转盘双倍】+${Doubleres.data.score1}青豆 剩余${rotaryres.data.doubleNum}次\n`
                }else{
                    detail += `【转盘双倍】+${Doubleres.msg}\n`
                }
                resolve()
            })
        })
    })
}

function readTime() {
    return new Promise((resolve, reject) => {
        const url = {
            url: `https://ios.baertt.com/v5/user/stay.json`,
            body: timebodyVal,
        }
        sy.post(url, (error, response, data) => {
            if (logs) sy.log(`阅读时长:${data}`)
            let timeres = JSON.parse(data)
            if (timeres.error_code == 0) {
                readtimes = timeres.time / 60
                detail += `【阅读时长】共计` + Math.floor(readtimes) + `分钟\n`
            } else {
                if (timeres.error_code == 200001) {
                    detail += `【阅读时长】❎ 未获取阅读时长Cookie\n`
                }else{
                    detail += `【阅读时长】❎ ${timeres.msg}\n`
                }
            }
            resolve()
        })
    })
}

function earningsInfo() {
    return new Promise((resolve, reject) => {
        const token = JSON.parse(signheaderVal)['Referer'].split("?")[1]
        setTimeout(() => {
            const url = {
                url: `https://kd.youth.cn/wap/user/balance?${token}`,
                headers: signheaderVal,
            }
            sy.get(url, (error, response, data) => {
                if (logs) sy.log(`收益信息:${data}`)
                infores = JSON.parse(data)
                if (infores.status == 0) {
                    detail += `<收益统计>：\n`
                    for (i = 0; i < infores.history[0].group.length; i++) {
                        detail += '【' + infores.history[0].group[i].name + '】' + infores.history[0].group[i].money + '个青豆\n'
                    }
                    detail += '<今日合计>： ' + infores.history[0].score + " 青豆"
                }
                sy.log(CookieName + "\n" + nick + "  \n" + subTitle + detail)
                resolve()
            })
        })
    })
}

function showmsg() {
    return new Promise(resolve => {
        if (rotaryres.status == 1 && rotaryres.data.remainTurn >= 97) {
            sy.msg(CookieName + " " + nick, subTitle, detail)  //默认前三次为通知
        }else if (rotaryres.status == 1 && rotaryres.data.remainTurn % notifyInterval == 0) {
            sy.msg(CookieName + " " + nick, subTitle, detail)//转盘次数/间隔整除时通知
        }else if (rotaryres.code == 10010 && notifyInterval != 0) {
            rotarynum = ` 转盘${rotaryres.msg}🎉`
            sy.msg(CookieName, subTitle,  `${nick}\n${rotarynum}\n${detail}`)//任务全部完成且通知间隔不为0时通知
        }
        resolve();
    })
}

function init() {
    isSurge = () => {
        return undefined === this.$httpClient ? false : true
    }
    isQuanX = () => {
        return undefined === this.$task ? false : true
    }
    getdata = (key) => {
        if (isSurge()) return $persistentStore.read(key)
        if (isQuanX()) return $prefs.valueForKey(key)
    }
    setdata = (key, val) => {
        if (isSurge()) return $persistentStore.write(key, val)
        if (isQuanX()) return $prefs.setValueForKey(key, val)
    }
    msg = (title, subtitle, body) => {
        if (isSurge()) $notification.post(title, subtitle, body)
        if (isQuanX()) $notify(title, subtitle, body)
    }
    log = (message) => console.log(message)
    get = (url, cb) => {
        if (isSurge()) {
            $httpClient.get(url, cb)
        }
        if (isQuanX()) {
            url.method = `GET`
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    post = (url, cb) => {
        if (isSurge()) {
            $httpClient.post(url, cb)
        }
        if (isQuanX()) {
            url.method = 'POST'
            $task.fetch(url).then((resp) => cb(null, {}, resp.body))
        }
    }
    done = (value = {}) => {
        $done(value)
    }
    return { isSurge, isQuanX, msg, log, getdata, setdata, get, post, done }
}
