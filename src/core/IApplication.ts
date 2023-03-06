/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

import { Kirinriki } from "./Application";

/**
 * InitOptions
 *
 * @interface InitOptions
 */
export interface InitOptions {
    appPath?: string;
    appDebug?: boolean;
    rootPath?: string;
    thinkPath?: string;
}

type unknownServer = unknown;

/**
 * interface Server
 *
 * @export
 * @interface IApplication
 */
export interface IApplication {
    app: Kirinriki;
    options: any;
    status: number;
    server: unknownServer;

    readonly Start: (listenCallback: () => void) => unknownServer;
    readonly Stop: (callback?: () => void) => void;
    /**
     * gRPC service register
     * @param {ServiceImplementation} impl
     */
    readonly RegisterService?: (impl: any) => void;
}

/**
 * Router interface
 *
 * @export
 * @interface IRouter
 */
export interface IRouter {
    app: Kirinriki;
    options: any;
    router: any;

    SetRouter: (path: string, func: Function, method?: any) => void;
    LoadRouter: (list: any[]) => void;
    ListRouter?: () => any;
}
