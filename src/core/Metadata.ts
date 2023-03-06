/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */

/**
 * MetadataClass
 *
 * @export
 * @class MetadataClass
 */
export class MetadataClass {
    protected internalRepr = new Map<string, any[]>();
    /**
     * Set the given value for the given key
     */
    set(key: string, value: any): void {
        this.internalRepr.set(key, [value]);
    }
    /**
     * Adds the given value for the given key by appending to a list of previous
     * values associated with that key.
     */
    add(key: string, value: any): void {
        const existingValue: any[] | undefined = this.internalRepr.get(key);
        if (existingValue === undefined) {
            this.internalRepr.set(key, [value]);
        } else {
            existingValue.push(value);
        }
    }
    /**
     * Removes the given key and any associated values. Normalizes the key.
     * @param key The key whose values should be removed.
     */
    remove(key: string): void {
        this.internalRepr.delete(key);
    }
    /**
     * Gets a list of all values associated with the key. Normalizes the key.
     * @param key The key whose value should be retrieved.
     * @return A list of values associated with the given key.
     */
    get(key: string): any[] {
        let existingValue: any[] | undefined = this.internalRepr.get(key);
        existingValue = existingValue || [];
        if (existingValue.length === 1) {
            return existingValue[0];
        }
        return existingValue;
    }
    /**
     * Gets a plain object mapping each key to the first value associated with it.
     * This reflects the most common way that people will want to see metadata.
     * @return A key/value mapping of the metadata.
     */
    getMap(): {
        [key: string]: any;
    } {
        const result: { [key: string]: any } = {};

        this.internalRepr.forEach((values, key) => {
            if (values.length > 0) {
                const v = values[0];
                result[key] = v instanceof Buffer ? v.slice() : v;
            }
        });
        return result;
    }
    /**
     * Clones the metadata object.
     * @return The newly cloned object.
     */
    clone(): MetadataClass {
        const newMetadata = new MetadataClass();
        const newInternalRepr = newMetadata.internalRepr;

        this.internalRepr.forEach((value, key) => {
            const clonedValue: any[] = value.map(v => {
                if (v instanceof Buffer) {
                    return Buffer.from(v);
                } else {
                    return v;
                }
            });

            newInternalRepr.set(key, clonedValue);
        });

        return newMetadata;
    }
    /**
     * Merges all key-value pairs from a given Metadata object into this one.
     * If both this object and the given object have values in the same key,
     * values from the other Metadata object will be appended to this object's
     * values.
     * @param other A Metadata object.
     */
    merge(other: MetadataClass): void {
        other.internalRepr.forEach((values: any, key: string) => {
            const mergedValue: any[] = (this.internalRepr.get(key) || []).concat(values);

            this.internalRepr.set(key, mergedValue);
        });
    }
    /**
     * copy all key-value pairs from a given object into this new Metadata.
     *
     */
    static from(obj: { [key: string]: any }): MetadataClass {
        const metadata = new this();
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const values = obj[key];
                metadata.internalRepr.set(key, values);
            }
        }
        return metadata;
    }
    /**
     * This modifies the behavior of JSON.stringify to show an object
     * representation of the metadata map.
     */
    toJSON(): {
        [key: string]: any;
    } {
        const result: { [key: string]: any[] } = {};
        for (const [key, values] of this.internalRepr.entries()) {
            result[key] = values;
        }
        return result;
    }
}
