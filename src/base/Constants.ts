/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

export const WELCOME = "\n      == https://github.com/vecmat == " + "\n         🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌑    \n";
const LOGOSTR = "ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKX18gICAgIF9fICAgICAgICAgICAgICAgICAgICAgICAgXyAgIApcIFwgICAvIC9fXyAgX19fIF8gX18gX19fICAgX18gX3wgfF8gCiBcIFwgLyAvIF8gXC8gX198ICdfIGAgXyBcIC8gX2AgfCBfX3wKICBcIFYgLyAgX18vIChfX3wgfCB8IHwgfCB8IChffCB8IHxfIAogICBcXy8gXF9fX3xcX19ffF98IHxffCB8X3xcX18sX3xcX198CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg";

export const LOGO = Buffer.from(LOGOSTR, "base64").toString();

export const COMPONENT_SCAN = 'COMPONENT_SCAN';
export const CONFIGURATION_SCAN = 'CONFIGURATION_SCAN';
export const PRIORITY_KEY = 'PRIORITY_KEY';
export const APP_READY_HOOK = "APP_READY_HOOK";
export const CAPTURER_KEY = "CAPTURER_KEY";

// $ 生成LOGOSTR代码（js）
// 读取文件并转为base64格式
// const fs = require("fs")
// function stringToBase64(str) {
//     return new Buffer.from(str).toString("base64");
// }
// function base64ToString(b64) {
//     return new Buffer.from(b64, "base64").toString();
// }
// // 2.调用fs.readFile（）文件读取方法
// fs.readFile("./test.txt", "utf8", function (err, dataStr) {
//     // 如果读取成功，则err的值为null，dataStr会显示例1.txt的文本内容
//     // 如果读取失败，err的值为错误对象，展示出错误信息，dataStr的值为undefined
//     console.log(dataStr)
//     let str = stringToBase64(dataStr);
//     console.log(str)
//     console.log(base64ToString(str));
// })

