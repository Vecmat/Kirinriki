import "reflect-metadata";
import { IOCContainer } from "../container";
import { Exception } from "@vecmat/vendor";
import { Kirinriki, IContext, INext } from "../core";


/**
 * todo
 * Interface for Plugin
 */
export interface IPlugin {
    name: string;

    
    // todo: refer Captor to reg savant
    // any reg 
    // Savant?: (ctx: IContext, next: INext) => Middleware;

    
    // Aspect?: (ctx: IContext) => Promise<any>;


    onAppReady?: (app: Kirinriki) => Promise<any> | any;

    onPluginLoaded?: (app: Kirinriki) => Promise<any> | any;
    
    onConfigLoaded?: (app: Kirinriki) => Promise<any> | any;
    
    onSvantReady?: (app: Kirinriki) => Promise<any> | any;

    
    onServerReady?: (app: Kirinriki) => Promise<any> | any;

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
