/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { ISavant } from "../base/Component";
import { Kirinriki } from "../core";
import { Payload } from "../payload";


export class PayloadSavant implements ISavant {
    run(options: any, app: Kirinriki) {
        return Payload(options, app);
    }
}