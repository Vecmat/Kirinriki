/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { Logger } from "../../base/Logger";
import { ListeningOptions } from "../index";
import { CreateTerminus } from "../terminus";
import { Kirinriki, IApplication } from "../../core";
import { createServer, IncomingMessage, Server, ServerResponse } from "http";
/**
 *
 *
 * @export
 * @class Http
 */
export class HttpServer implements IApplication {
    app: Kirinriki;
    options: ListeningOptions;
    readonly server: Server;
    readonly protocol: string;
    status: number;
    listenCallback?: () => void;

    constructor(app: Kirinriki, options: ListeningOptions) {
        this.app = app;
        this.protocol = options.protocol;
        this.options = options;
        this.server = createServer((req, res) => {
            app.callback()(req, res);
        });
        CreateTerminus(this);
    }

    /**
     * Start Server
     *
     * @param {() => void} listenCallback
     * @memberof Http
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
