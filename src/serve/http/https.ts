/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Logger } from "../../base/Logger.js";
import { ListeningOptions } from "../serve.js";
import { CreateTerminus } from "../terminus.js";
import { Kirinriki } from "../../core/Application.js";
import { IncomingMessage, ServerResponse } from "http";
import { IApplication } from "../../core/IApplication.js";
import { createServer, Server, ServerOptions } from "https";

/**
 *
 *
 * @export
 * @class Http
 */
export class HttpsServer implements IApplication {
    app: Kirinriki;
    options: ListeningOptions;
    readonly server: Server;
    readonly protocol: string;
    status: number | undefined;
    listenCallback?: () => void;

    /**
     * Creates an instance of HttpsServer.
     * @param {Kirinriki} app
     * @param {ListeningOptions} options
     * @memberof HttpsServer
     */
    constructor(app: Kirinriki, options: ListeningOptions) {
        this.app = app;
        this.protocol = options.protocol;
        this.options = options;
        const opt: ServerOptions = {
            key: this.options.ext.key,
            cert: this.options.ext.cert
        };
        this.server = createServer(opt, (req, res) => {
            app.callback()(req, res);
        });
        CreateTerminus(this);
    }

    /**
     * Start Server
     *
     * @param {boolean} openTrace
     * @param {() => void} listenCallback
     * @memberof Https
     */
    // Start(listenCallback?: () => void): Server<typeof IncomingMessage, typeof ServerResponse> {
    Start(listenCallback?: () => void): Server {
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
