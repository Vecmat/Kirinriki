/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import lodash from "lodash";
import { Logger } from "../base/index.js";


/**
 * unittest running environment detection
 * only support jest
 * @returns {boolean}
 */
export const isUnintTest = (): boolean => {
    let isUTRuntime = false;
    // Running environment judgment, temporarily only judge jest
    const argv = JSON.stringify(process.argv[1]);
    if (argv.indexOf("jest") > -1) {
        isUTRuntime = true;
    }
    return isUTRuntime;
};
