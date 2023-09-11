/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

export const WELCOME = "\n  == https://github.com/vecmat == " + "\n     🌑 🌒 🌓 🌔 🌕 🌖 🌗 🌘 🌑    \n\n";
const LOGOSTR = "ICBfICAgIF8gICAgICBfICAgICAgICAgICAgXyBfICAgIF8gCiB8IHwgIChfKSAgICAoXykgICAgICAgICAgKF8pIHwgIChfKQogfCB8IF9fXyBfIF9fIF8gXyBfXyAgXyBfXyBffCB8IF9fXyAKIHwgfC8gLyB8ICdfX3wgfCAnXyBcfCAnX198IHwgfC8gLyB8CiB8ICAgPHwgfCB8ICB8IHwgfCB8IHwgfCAgfCB8ICAgPHwgfAogfF98XF9cX3xffCAgfF98X3wgfF98X3wgIHxffF98XF9cX3wKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg";

export const LOGO = Buffer.from(LOGOSTR, "base64").toString();

export const COMPONENT_SCAN = 'COMPONENT_SCAN';
export const CONFIGURATION_SCAN = 'CONFIGURATION_SCAN';
export const PRIORITY_KEY = 'PRIORITY_KEY';
export const APP_READY_HOOK = "APP_READY_HOOK";
export const CAPTURER_KEY = "CAPTURER_KEY";

