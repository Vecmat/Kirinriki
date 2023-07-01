import { Kirinriki, IApplication } from "../core";
import { GrpcServer } from "./grpc/grpc";
import { HttpServer } from "./http/http";
import { Http2Server } from "./http/http2";
import { HttpsServer } from "./http/https";
import { WsServer } from "./ws/ws";

// KirinrikiProtocol
export type KirinrikiProtocol = 'http' | "https" | 'http2' | 'grpc' | 'ws' | 'wss'

/**
 * listening options
 *
 * @interface ListeningOptions
 */
export interface ListeningOptions {
    hostname: string
    port: number
    protocol: KirinrikiProtocol
    trace?: boolean // Full stack debug & trace, default: false
    ext?: any // Other extended configuration
}

/**
 * Create Server
 *
 * @export
 * @param {Kirinriki} app
 * @param {KirinrikiProtocol} [opt]
 * @returns {*}  {IApplication}
 */
export function Serve(app: Kirinriki, opt?: ListeningOptions): IApplication {
    const options: ListeningOptions = {
        ...{
            hostname: '127.0.0.1',
            port: 3000,
            protocol: "http",
            ext: {
                key: "",
                cert: "",
                protoFile: "",
            },
        }, ...opt
    };
    // todo 修改为可配置为整体server，公用端口或者
    // https 不提供支持，可以提供http2支持。http/http2 切换
    // ws 和 https 共用 。grpc通过协议ws提供代理

    let server: IApplication;
    // todo 添加 命令行 参数协议
    // todo 如果是数组，则合并服务,
    switch (options.protocol) {
        case "ws":
        case "wss":
            server = new WsServer(app, options);
            break;
        case "grpc":
            server = new GrpcServer(app, options);
            break;
        case "https":
            server = new HttpsServer(app, options);
            break;
        case "http2":
            server = new Http2Server(app, options);
            break;
        case "http":
        default:
            server = new HttpServer(app, options);
            break;
    }
    return server;
}