
import { Exception } from "@vecmat/vendor";
import { IOCContainer } from "../container/Container.js";


/**
 * todo: Define necessary parameters
 * Interface for IAddon
 */
export interface IAddon {
    version: string;
}

/**
 * Indicates that an decorated class is a "Addon".
 *
 * @export
 * @param {string} [identifier] class name
 * @returns {ClassDecorator}
 */
export function Addon(identifier?: string): ClassDecorator {
    return (target: any) => {

        identifier = identifier || IOCContainer.getIdentifier(target);
        if (!identifier.endsWith("Addon")) {
            throw new Exception("BOOTERR_LOADER_NAMELACK", `Addon class ${identifier} name must be 'Addon' suffix.`);
        }
        IOCContainer.saveClass("ADDON", target, `${identifier}`);
    };
}

