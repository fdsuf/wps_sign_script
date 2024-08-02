// 海信爱家自动签到、自动更新token
// 20240511

let sheetNameSubConfig = "hxaj"; // 分配置表名称
let pushHeader = "【海信爱家】";
let sheetNameConfig = "CONFIG"; // 总配置表
let sheetNamePush = "PUSH"; // 推送表名称
let sheetNameEmail = "EMAIL"; // 邮箱表
let flagSubConfig = 0; // 激活分配置工作表标志
let flagConfig = 0; // 激活主配置工作表标志
let flagPush = 0; // 激活推送工作表标志
let line = 21; // 指定读取从第2行到第line行的内容
var message = ""; // 待发送的消息
var messageOnlyError = 0; // 0为只推送失败消息，1则为推送成功消息。
var messageNickname = 0; // 1为用昵称替代单元格，0为不替代
var jsonPush = [
  { name: "bark", key: "xxxxxx", flag: "0" },
  { name: "pushplus", key: "xxxxxx", flag: "0" },
  { name: "ServerChan", key: "xxxxxx", flag: "0" },
  { name: "email", key: "xxxxxx", flag: "0" },
  { name: "dingtalk", key: "xxxxxx", flag: "0" },
  { name: "discord", key: "xxxxxx", flag: "0" },
]; // 推送数据，flag=1则推送
var jsonEmail = {
  server: "",
  port: "",
  sender: "",
  authorizationCode: "",
}; // 有效邮箱配置

flagConfig = ActivateSheet(sheetNameConfig); // 激活推送表
// 主配置工作表存在
if (flagConfig == 1) {
  console.log("开始读取主配置表");
  let name; // 名称
  let onlyError;
  let nickname;
  for (let i = 2; i <= 100; i++) {
    // 从工作表中读取推送数据
    name = Application.Range("A" + i).Text;
    onlyError = Application.Range("C" + i).Text;
    nickname = Application.Range("D" + i).Text;
    if (name == "") {
      // 如果为空行，则提前结束读取
      break; // 提前退出，提高效率
    }
    if (name == sheetNameSubConfig) {
      if (onlyError == "是") {
        messageOnlyError = 1;
        console.log("只推送错误消息");
      }

      if (nickname == "是") {
        messageNickname = 1;
        console.log("单元格用昵称替代");
      }

      break; // 提前退出，提高效率
    }
  }
}

flagPush = ActivateSheet(sheetNamePush); // 激活推送表
// 推送工作表存在
if (flagPush == 1) {
  console.log("开始读取推送工作表");
  let pushName; // 推送类型
  let pushKey;
  let pushFlag; // 是否推送标志
  for (let i = 2; i <= line; i++) {
    // 从工作表中读取推送数据
    pushName = Application.Range("A" + i).Text;
    pushKey = Application.Range("B" + i).Text;
    pushFlag = Application.Range("C" + i).Text;
    if (pushName == "") {
      // 如果为空行，则提前结束读取
      break;
    }
    jsonPushHandle(pushName, pushFlag, pushKey);
  }
  // console.log(jsonPush)
}

// 邮箱配置函数
emailConfig();

flagSubConfig = ActivateSheet(sheetNameSubConfig); // 激活分配置表
if (flagSubConfig == 1) {
  console.log("开始读取分配置表");
  for (let i = 2; i <= line; i++) {
    var cookie = Application.Range("A" + i).Text;
    var exec = Application.Range("B" + i).Text;
    if (cookie == "") {
      // 如果为空行，则提前结束读取
      break;
    }
    if (exec == "是") {
      execHandle(cookie, i);
    }
  }

  push(message); // 推送消息
}

// 总推送
function push(message) {
  if (message != "") {
    message = pushHeader + message; // 加上推送头
    let length = jsonPush.length;
    let name;
    let key;
    for (let i = 0; i < length; i++) {
      if (jsonPush[i].flag == 1) {
        name = jsonPush[i].name;
        key = jsonPush[i].key;
        if (name == "bark") {
          bark(message, key);
        } else if (name == "pushplus") {
          pushplus(message, key);
        } else if (name == "ServerChan") {
          serverchan(message, key);
        } else if (name == "email") {
          email(message);
        } else if (name == "dingtalk") {
          dingtalk(message, key);
        } else if (name == "discord") {
          discord(message, key);
        }
      }
    }
  } else {
    console.log("消息为空不推送");
  }
}

// 推送bark消息
function bark(message, key) {
  if (key != "") {
    let url = "https://api.day.app/" + key + "/" + message;
    // 若需要修改推送的分组，则将上面一行改为如下的形式
    // let url = 'https://api.day.app/' + bark_id + "/" + message + "?group=分组名";
    let resp = HTTP.get(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    sleep(5000);
  }
}

// 推送pushplus消息
function pushplus(message, key) {
  if (key != "") {
    // url = "http://www.pushplus.plus/send?token=" + key + "&content=" + message;
    url = "http://www.pushplus.plus/send?token=" + key + "&content=" + message + "&title=" + pushHeader;  // 增加标题
    let resp = HTTP.fetch(url, {
      method: "get",
    });
    sleep(5000);
  }
}

// 推送serverchan消息
function serverchan(message, key) {
  if (key != "") {
    url =
      "https://sctapi.ftqq.com/" +
      key +
      ".send" +
      "?title=消息推送" +
      "&desp=" +
      message;
    let resp = HTTP.fetch(url, {
      method: "get",
    });
    sleep(5000);
  }
}

// email邮箱推送
function email(message) {
  var myDate = new Date(); // 创建一个表示当前时间的 Date 对象
  var data_time = myDate.toLocaleDateString(); // 获取当前日期的字符串表示
  let server = jsonEmail.server;
  let port = parseInt(jsonEmail.port); // 转成整形
  let sender = jsonEmail.sender;
  let authorizationCode = jsonEmail.authorizationCode;

  let mailer;
  mailer = SMTP.login({
    host: server,
    port: port,
    username: sender,
    password: authorizationCode,
    secure: true,
  });
  mailer.send({
    from: pushHeader + "<" + sender + ">",
    to: sender,
    subject: pushHeader + " - " + data_time,
    text: message,
  });
  // console.log("已发送邮件至：" + sender);
  console.log("已发送邮件");
  sleep(5000);
}

// 邮箱配置
function emailConfig() {
  console.log("开始读取邮箱配置");
  let length = jsonPush.length; // 因为此json数据可无序，因此需要遍历
  let name;
  for (let i = 0; i < length; i++) {
    name = jsonPush[i].name;
    if (name == "email") {
      if (jsonPush[i].flag == 1) {
        let flag = ActivateSheet(sheetNameEmail); // 激活邮箱表
        // 邮箱表存在
        // var email = {
        //   'email':'', 'port':'', 'sender':'', 'authorizationCode':''
        // } // 有效配置
        if (flag == 1) {
          console.log("开始读取邮箱表");
          for (let i = 2; i <= 2; i++) {
            // 从工作表中读取推送数据
            jsonEmail.server = Application.Range("A" + i).Text;
            jsonEmail.port = Application.Range("B" + i).Text;
            jsonEmail.sender = Application.Range("C" + i).Text;
            jsonEmail.authorizationCode = Application.Range("D" + i).Text;
            if (Application.Range("A" + i).Text == "") {
              // 如果为空行，则提前结束读取
              break;
            }
          }
          // console.log(jsonEmail)
        }
        break;
      }
    }
  }
}

// 推送钉钉机器人
function dingtalk(message, key) {
  let url = "https://oapi.dingtalk.com/robot/send?access_token=" + key;
  let resp = HTTP.post(url, { msgtype: "text", text: { content: message } });
  // console.log(resp.text())
  sleep(5000);
}
// 推送Discord机器人
function discord(message, key) {
  let url = key;
  let resp = HTTP.post(url, { content: message });
  //console.log(resp.text())
  sleep(5000);
}
function sleep(d) {
  for (var t = Date.now(); Date.now() - t <= d; );
}

// 激活工作表函数
function ActivateSheet(sheetName) {
  let flag = 0;
  try {
    // 激活工作表
    let sheet = Application.Sheets.Item(sheetName);
    sheet.Activate();
    console.log("激活工作表：" + sheet.Name);
    flag = 1;
  } catch {
    flag = 0;
    console.log("无法激活工作表，工作表可能不存在");
  }
  return flag;
}

// 对推送数据进行处理
function jsonPushHandle(pushName, pushFlag, pushKey) {
  let length = jsonPush.length;
  for (let i = 0; i < length; i++) {
    if (jsonPush[i].name == pushName) {
      if (pushFlag == "是") {
        jsonPush[i].flag = 1;
        jsonPush[i].key = pushKey;
      }
    }
  }
}

// cookie字符串转json格式
function cookie_to_json(cookies) {
  var cookie_text = cookies;
  var arr = [];
  var text_to_split = cookie_text.split(";");
  for (var i in text_to_split) {
    var tmp = text_to_split[i].split("=");
    arr.push('"' + tmp.shift().trim() + '":"' + tmp.join(":").trim() + '"');
  }
  var res = "{\n" + arr.join(",\n") + "\n}";
  return JSON.parse(res);
}

// 获取10 位时间戳
function getts10() {
  var ts = Math.round(new Date().getTime() / 1000).toString();
  return ts;
}

// 获取13位时间戳
function getts13(){
  // var ts = Math.round(new Date().getTime()/1000).toString()  // 获取10 位时间戳
  let ts = new Date().getTime()
  return ts
}

// 符合UUID v4规范的随机字符串 b9ab98bb-b8a9-4a8a-a88a-9aab899a88b9
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
        v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getUUIDDigits(length) {
    var uuid = generateUUID();
    return uuid.replace(/-/g, '').substr(16, length);
}
 


// 获取sign，返回小写
function getsign(data) {
  var sign = Crypto.createHash("md5")
    .update(data, "utf8")
    .digest("hex")
    // .toUpperCase() // 大写
    .toString();
  return sign;
}

// 登录获取token
function login(url, headers, data){
  messageSuccess = ""
  messageFail = ""
  token = ""
  resp = HTTP.post(
    url,
    JSON.stringify(data),
    // data,
    { headers: headers }
  );

  if (resp.status == 200) {
    resp = resp.json();
    console.log(resp)

    try{
      token = resp["data"]["tokenInfo"]["token"]
      console.log(token)
      content = "登录成功获取最新token" + " "
      messageSuccess += content;
      console.log(content)
    }catch
    {
      content = "登录失败 "
      messageFail += content;
      console.log(content);
    }
  } else {
    content = "登录失败 "
    messageFail += content;
    console.log(content);
  }

  msg = [messageSuccess, messageFail, token]
  return msg
}

// 签到
function sign(url, headers, data){
  messageSuccess = ""
  messageFail = ""
  flagstatus = 0  // 记录签到成功状态。0代表签到失败，1代表签到成功

  resp = HTTP.post(
    url,
    JSON.stringify(data),
    // data,
    { headers: headers }
  );
  
  if (resp.status == 200) {
    resp = resp.json();
    // console.log(resp)
    // {"error":{"code":"017004","message":"获取签到信息失败"},"signatureServer":""}

    try{
      resultCode = resp["data"]["resultCode"]
      if(resultCode == 0 )
      {
        keepSigningDays = resp["data"]["signTaskInfo"]["keepSigningDays"]
        signedToday = resp["data"]["signTaskInfo"]["signedToday"]
        if(signedToday == true)
        {
          content = "今日已签到,连续签到" + keepSigningDays + "天 "
          messageSuccess += content;
          console.log(content)
        }else
        {
          content = "签到成功,连续签到" + keepSigningDays + "天 "
          messageSuccess += content;
          console.log(content)
        }
        flagstatus = 1  // 签到成功
      }else{
        content = "签到失败" + " "
        messageFail += content;
        console.log(content)
        flagstatus = 0  // 签到失败
      }
    }
    catch
    {
      respmsg = resp["error"]["message"]
      content = respmsg + " "
      messageFail += content;
      console.log(content)
      flagstatus = 0  // 签到失败
    }

  } else {
    content = "签到失败 "
    messageFail += content;
    console.log(content);
    flagstatus = 0  // 签到失败
  }

  // console.log(messageSuccess)
  msg = [messageSuccess, messageFail,flagstatus]
  return msg

}


// 具体的执行函数
function execHandle(cookie, pos) {
  let messageSuccess = "";
  let messageFail = "";
  let messageName = "";
  if (messageNickname == 1) {
    messageName = Application.Range("C" + pos).Text;
  } else {
    messageName = "单元格A" + pos + "";
  }
  // try {
    var url1 = "https://account-mobi.hismarttv.com/muc/v1.9/task/signIn"; // 签到
    url2 = "https://portal-account.hismarttv.com/mobile/signon" // 登录，获取token
    
    token = cookie
    // 用户名密码用来获取最新的token
    username = Application.Range("D" + pos).Text;
    password = Application.Range("E" + pos).Text;
    // 需要时间戳和webSign已知，否则会“验签错误”
    webSign = Application.Range("F" + pos).Text;
    timeStamp = String(Application.Range("G" + pos).Text);
    requestUUID = ""

    // 签到
    headers= {
      'User-Agent': 'HD1910(Android/7.1.2) (pediy.UNICFBC0DD/1.0.5) Weex/0.26.0 720x1280',
      'Cookie': cookie,
      'Content-Type': 'application/json; charset=UTF-8',
      // 'Origin': 'https://account-mobi.hismarttv.com',
      // 'Host': 'account-mobi.hismarttv.com',
      // "Content-Type":"application/x-www-form-urlencoded; charset=UTF-8",
    }

    // console.log(data)
    // 如果有token，先用token进行签到
    // 如果签到失败则用账密登录获取新token，然后签到
    flagstatus = 0  // 记录签到成功状态。0代表签到失败，1代表签到成功
    if(token != "" )
    {
      // timeStamp = getts10()
      data = {
        "accessToken":cookie,
        "requestUUID":requestUUID,
        "timeStamp":timeStamp,
        "webSign":webSign,
        "termType":"mobile"
      }
      msg = sign(url1, headers, data)  // 签到
      if(msg[2] == 1){ // 第三个元素存放签到状态，1为签到成功
        // 签到成功了，不用重新获取新token了
        flagstatus = 1  // 签到成功
        messageSuccess += msg[0];
        console.log(content)
      }else
      {
        console.log("此accessToken签到失败，尝试登录获取新accessToken")
      }
    }else
    {
      console.log("accessToken为空，开始进行登录获取accessToken")
    }
    
    // 未签到时得执行流程
    if(flagstatus != 1) //  && 0) 
    {
      // 登录获取accessToken
      data = {
        "signature": password,
        "loginName": username
      }
      msg = login(url2, headers, data)
      if(msg[2] != ""){ // 第三个元素存放token
        // 签到成功了，已获取新token了
        token = msg[2]
        console.log("登录成功，已获得最新token:" + token)
        Application.Range("A" + pos).Value = token  // 将token写入单元格内，可下次使用
        data = {
          "accessToken": token,
          "requestUUID": requestUUID,
          "timeStamp": timeStamp,
          "webSign":webSign,
          "termType":"mobile"
        }
        msg = sign(url1, headers, data)  // 签到
        if(msg[2] == 1){ // 第三个元素存放签到状态，1为签到成功
          // 签到成功
          messageSuccess += msg[0];
          console.log(content)
        }else{  
          // 签到失败
          messageFail += msg[1];
          console.log(content)
        }
      }else 
      {
        console.log("获取最新accessToken为空")
        // 未获取到token，登录失败
        messageFail += msg[1];
        console.log(content)
      }

    }


  // } catch {
  //   messageFail += messageName + "失败";
  // }

  sleep(2000);
  if (messageOnlyError == 1) {
    message += messageFail;
  } else {
    message += messageFail + " " + messageSuccess;
  }

  message = "帐号：" + messageName + message  // 附加账号信息

  console.log(message);
}
