/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { IMiddleware } from "../base/Component";
import { Kirinriki } from "../core";
import { Trace } from "../trace";

export class TraceMiddleware implements IMiddleware {
    run(options: any, app: Kirinriki) {
        return Trace(options, app);
    }
}
