/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Logger } from "../../base/Logger.js";
import { ListeningOptions } from "../serve.js";
import { CreateTerminus } from "../terminus.js";
import { Kirinriki } from "../../core/Application.js";
import { IApplication } from "../../core/IApplication.js";
import { createSecureServer, Http2SecureServer, SecureServerOptions } from "http2";
/**
 *
 *
 * @export
 * @class Http
 */
export class Http2Server implements IApplication {
    app: Kirinriki;
    options: ListeningOptions;
    readonly protocol: string;
    readonly server: Http2SecureServer;
    status: number | undefined;
    listenCallback?: () => void;

    constructor(app: Kirinriki, options: ListeningOptions) {
        this.app = app;
        this.protocol = options.protocol;
        this.options = options;
        const opt: SecureServerOptions = {
            allowHTTP1: true,
            key: this.options.ext.key,
            cert: this.options.ext.cert
        };
        this.server = createSecureServer(opt, (req, res) => {
            app.callback()(req, res);
        });
        CreateTerminus(this);
    }

    /**
     * Start Server
     *
     * @param {() => void} listenCallback
     * @memberof Http2Server
     */
    Start(listenCallback?: () => void): Http2SecureServer {
        listenCallback = listenCallback ? listenCallback : this.listenCallback;
        return this.server
            .listen(
                {
                    port: this.options.port,
                    host: this.options.hostname
                },
                listenCallback
            )
            .on("clientError", (err: any, sock: any) => {
                // Logger.error("Bad request, HTTP parse error");
                sock.end("400 Bad Request\r\n\r\n");
            });
    }

    /**
     * Stop Server
     *
     */
    Stop(callback?: () => void) {
        this.server.close((err?: Error) => {
            callback?.();
            Logger.Error(err);
        });
    }
}
