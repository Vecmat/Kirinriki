import "reflect-metadata";
import { Middleware } from "koa";
import { IOCContainer } from "../container";
import { Exception } from "@vecmat/vendor";
import { Kirinriki, IContext, INext } from "../core";
import { MIXTURE_SCOPT, CONTROLLER_ROUTER } from "../router";
import { ISavant } from "./Component";

/**
 * todo
 * Interface for Plugin
 */
export interface IPlugin {
    name: string;

    // 中间件
    Savant?: (ctx: IContext, next: INext) => Middleware;

    // 同步拦截请求？
    // 使用注解添加？
    // 所有的请求都会拦截，会在第一执行？
    Aspect?: (ctx: IContext) => Promise<any>;
    // 参考
    // https://tiejs.vercel.app/docs/basic/plugin
    // 添加 load config、svant 、plugin 等事件
    // 设置某些状态
    onAppReady?: (app: Kirinriki) => Promise<any> | any;

    onPluginLoaded?: (app: Kirinriki) => Promise<any> | any;
    // 更新一些配置，特别是自己相关的
    onConfigLoaded?: (app: Kirinriki) => Promise<any> | any;
    // 中间件准备好后的处理，调整顺序等
    onSvantReady?: (app: Kirinriki) => Promise<any> | any;

    // 监听前处理一些事情
    onServerReady?: (app: Kirinriki) => Promise<any> | any;

    // 用于某些插件更新状态
    onStartListening?: (app: Kirinriki) => Promise<any> | any;
}

/**
 * Indicates that an decorated class is a "plugin".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Plugin(identifier?: string): ClassDecorator {
    return (target: any) => {
        identifier = identifier || IOCContainer.getIdentifier(target);
        if (!identifier.endsWith("Plugin")) {
            throw new Exception("BOOTERR_LOADER_NAMELACK", "Plugin class name must be 'Plugin' suffix.");
        }
        IOCContainer.saveClass("PLUGIN", target, `${identifier}`);
    };
}
