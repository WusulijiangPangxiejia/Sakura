const $ = new Env('network-speed')
$.isPanel = () => $.isSurge() && typeof $input != 'undefined' && $.lodash_get($input, 'purpose') === 'panel'
$.isTile = () => $.isStash() && typeof $script != 'undefined' && $.lodash_get($script, 'type') === 'tile'
// $.isStashCron = () => $.isStash() && typeof $script != 'undefined' && $.lodash_get($script, 'type') === 'cron'
let arg
if (typeof $argument != 'undefined') {
  arg = Object.fromEntries($argument.split('&').map(item => item.split('=')));
}
let title = ''
let content = ''
!(async () => {
  if($.isTile()) {
    await notify('网络速率', '面板', '开始查询')
  }
  const mb = $.lodash_get(arg, 'mb') || 1
  const bytes = mb * 1024 * 1024
  // 下行速率测试
  let start = Date.now()
  const res = await $.http.get({
    url: `https://speed.cloudflare.com/__down?bytes=${bytes}`
  })
  const end = Date.now()
  const duration = (end - start) / 1000
  const speed = mb / duration

  // 上行速率测试
  const uploadBytes = bytes / 2; // 假设上行数据量为下载的一半
  let uploadStart = Date.now()
  const uploadRes = await $.http.post({
    url: `https://speed.cloudflare.com/__up?bytes=${uploadBytes}`,
    body: Buffer.alloc(uploadBytes, 'a').toString() // 用指定大小的数据进行上行测试
  })
  const uploadEnd = Date.now()
  const uploadDuration = (uploadEnd - uploadStart) / 1000
  const uploadSpeed = (uploadBytes / (1024 * 1024)) / uploadDuration

  const pingstart = Date.now()
  const ping = await $.http.get({
    url: `http://cp.cloudflare.com/generate_204`
  })
  const pingt = Date.now() - pingstart
  console.log('to see:' + pingt)
  console.log(duration)
  const a = Diydecide(0, 80, 120, round(Math.abs(speed * 8)))
  const b = Diydecide(0, 150, 300, pingt) + 3
  let shifts = {
    '1': arg?.iconslow,
    '2': arg?.iconmid,
    '3': arg?.iconfast,
    '4': arg?.colorlow,
    '5': arg?.colormid,
    '6': arg?.colorhigh
  }
  icon = shifts[a]
  color = shifts[b]
  console.log(`icon=shifts[${a}]:` + shifts[a])
  console.log(`icon-color[${b}]:` + shifts[b])
  title = `NetSpeed`
  content = `下行速率: ${round(Math.abs(speed * 8))} Mbps [${round(Math.abs(speed, 2), 1)} MB/s]\n测试耗时: ${round(Math.abs(duration, 2), 2)}s\n上行速率: ${round(Math.abs(uploadSpeed * 8))} Mbps [${round(Math.abs(uploadSpeed, 2), 1)} MB/s]\n上行测试耗时: ${round(Math.abs(uploadDuration, 2), 2)}s\n网络延迟: ${pingt} ms\n执行时间: ${new Date().toTimeString().split(' ')[0]}`
  if ($.isTile()) {
    await notify('网络速率', '面板', '查询完成')
  } else if(!$.isPanel()) {
    await notify('网络速率', title, content)
  }
})()
.catch(async e => {
  $.logErr(e)
  $.logErr($.toStr(e))
  const msg = `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`
  title = `❌`
  content = msg
  await notify('网络速率', title, content)
  $.log(title)
  $.log(content)
  const result = { title, content }
  $.done(result)
})
.finally(async () => {
  const result = { title, content, icon, 'icon-color': color, ...arg }
  $.log($.toStr(result))
  $.done(result)
})
// 通知
async function notify(title, subt, desc, opts) {
  if ($.lodash_get(arg, 'notify')) {
    $.msg(title, subt, desc, opts)
  } else {
    // $.log('🔕', title, subt, desc, opts)  
  }
}
function createRound(methodName) {
  const func = Math[methodName]
  return (number, precision) => {
    precision = precision == null ? 0 : precision >= 0 ? Math.min(precision, 292) : Math.max(precision, -292)
    if (precision) {
      // Shift with exponential notation to avoid floating-point issues.
      // See [MDN](https://mdn.io/round#Examples) for more details.
      let pair = `${number}e`.split('e')
      const value = func(`${pair[0]}e${+pair[1] + precision}`)
      pair = `${value}e`.split('e')
      return +`${pair[0]}e${+pair[1] - precision}`
    }
    return func(number)
  }
}
function round(...args) {
  return createRound('round')(...args)
}
//确定变量所在区间
function Diydecide(x, y, z, item) {
  let array = [x, y, z]
  array.push(item)
  return array.sort((a, b) => a - b).findIndex(i => i === item)
}
// prettier-ignore
function Env(t, s) { class e { constructor(t) { this.env = t } send(t, s = "GET") { t = "string" == typeof t ? { url: t } : t; let e = this.get; return "POST" === s && (e = this.post), new Promise((s, i) => { e.call(this, t, (t, e, r) => { t ? i(t) : s(e) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, s) { this.name = t, this.http = new e(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, /*this.logSeparator="\n\n",*/this.encoding = "utf-8", this.startTime = (new Date).getTime(), Object.assign(this, s)/*,this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)*/ } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $environment && $environment["surge-version"] } isLoon() { return "undefined" != typeof $loon } isShadowrocket() { return "undefined" != typeof $rocket } isStash() { return "undefined" != typeof $environment && $environment["stash-version"] } toObj(t, s = null) { try { return JSON.parse(t) } catch { return s } } toStr(t, s = null) { try { return JSON.stringify(t) } catch { return s } } getjson(t, s) { let e = s; const i = this.getdata(t); if (i) try { e = JSON.parse(this.getdata(t)) } catch { } return e } setjson(t, s) { try { return this.setdata(JSON.stringify(t), s) } catch { return !1 } } getScript(t) { return new Promise(s => { this.get({ url: t }, (t, e, i) => s(i)) }) } runScript(t, s) { return new Promise(e => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = s && s.timeout ? s.timeout : r; const [o, h] = i.split("@"), a = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(a, (t, s, i) => e(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), s = this.path.resolve(process.cwd(), this.dataFile), e = this.fs.existsSync(t), i = !e && this.fs.existsSync(s);