/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { Logger } from "./Logger";
import { version, engines } from "../../package.json";

export const KIRINRIKI_VERSION = version;
export const ENGINES_VERSION = engines.node.slice(1) || "12.0.0";

/**
 * check node version
 * @return {void} []
 */
export function checkRuntime() {
    let nodeEngines = ENGINES_VERSION;
    nodeEngines = nodeEngines.slice(0, nodeEngines.lastIndexOf("."));
    let nodeVersion = process.version;
    if (nodeVersion[0] === "v") {
        nodeVersion = nodeVersion.slice(1);
    }
    nodeVersion = nodeVersion.slice(0, nodeVersion.lastIndexOf("."));

    if (lodash.toNumber(nodeEngines) > lodash.toNumber(nodeVersion)) {
        Logger.Error(`Kirinriki need node version > ${nodeEngines}, current version is ${nodeVersion}, please upgrade it.`);
        process.exit(-1);
    }
}

/**
 * unittest running environment detection
 * only support jest
 * @returns {boolean}
 */
export const checkUTRuntime = (): boolean => {
    let isUTRuntime = false;
    // UT运行环境判断，暂时先只判断jest
    const argv = JSON.stringify(process.argv[1]);
    if (argv.indexOf("jest") > -1) {
        isUTRuntime = true;
    }
    return isUTRuntime;
};
