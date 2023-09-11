/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { CountryCode } from "libphonenumber-js";
import {
    contains,
    equals,
    isDate,
    isEmail,
    isHash,
    isIn,
    isIP,
    IsIpVersion,
    isNotIn,
    isPhoneNumber,
    isURL,
    length,
    notEquals,
    registerDecorator,
    ValidationArguments,
    ValidationOptions
} from "class-validator";
import lodash from "lodash";
import { Check } from "@vecmat/vendor";
import { getOriginMetadata, IOCContainer } from "../container";
import { PARAM_CHECK_KEY, PARAM_RULE_KEY, PARAM_TYPE_KEY, ValidRules } from "./rule";
import { cnName, idNumber, mobile, plateNumber, setExpose, zipCode } from "./util";


// options for isEmail
export interface IsEmailOptions {
    allow_display_name?: boolean;
    require_display_name?: boolean;
    allow_utf8_local_part?: boolean;
    require_tld?: boolean;
}

// options for isURL
export interface IsURLOptions {
    protocols?: string[];
    require_tld?: boolean;
    require_protocol?: boolean;
    require_host?: boolean;
    require_valid_protocol?: boolean;
    allow_underscores?: boolean;
    host_whitelist?: (string | RegExp)[];
    host_blacklist?: (string | RegExp)[];
    allow_trailing_dot?: boolean;
    allow_protocol_relative_urls?: boolean;
    disallow_auth?: boolean;
}
// HashAlgorithm
export type HashAlgorithm =
    | "md4"
    | "md5"
    | "sha1"
    | "sha256"
    | "sha384"
    | "sha512"
    | "ripemd128"
    | "ripemd160"
    | "tiger128"
    | "tiger160"
    | "tiger192"
    | "crc32"
    | "crc32b";

// ValidOtpions
export type ValidOtpions = { message: string; value: any };

/**
 * Validation parameter's type and values.
 *
 * @export
 * @param {(ValidRules | ValidRules[] | Function)} rule
 * @param {*} [options] If the options type is a string, the value is the error message of the validation rule.
 * Some validation rules require additional parameters, ext: @Valid("Gte", {message:"Requires value greater than or equal to 100", value: 100})
 * @returns {*}  {ParameterDecorator}
 */
export function Valid(rule: ValidRules | ValidRules[] | Function, options?: string | ValidOtpions): ParameterDecorator {
    let rules: any = [];
    if (lodash.isString(rule)) rules = (<string>rule).split(",");
    else rules = rule;
    return (target: any, propertyKey: string, descriptor: any) => {
        const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey);
        const type = paramTypes[descriptor]?.name ? paramTypes[descriptor].name : "object";
        if (lodash.isString(options)) options = { message: <string>options, value: null };

        IOCContainer.attachPropertyData(
            PARAM_RULE_KEY,
            {
                name: propertyKey,
                rule: rules,
                options,
                index: descriptor,
                type
            },
            target,
            propertyKey
        );
    };
}

/**
 * Validation parameter's type and values from DTO class.
 *
 * @export
 * @returns {MethodDecorator}
 */
export function Validated(): MethodDecorator {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        //
        IOCContainer.savePropertyData(
            PARAM_CHECK_KEY,
            {
                dtoCheck: 1
            },
            target,
            propertyKey
        );

        // const paramTypes = Reflect.getMetadata("design:paramtypes", target, propertyKey) || [];

        // const { value, configurable, enumerable } = descriptor;
        // descriptor = {
        //     configurable,
        //     enumerable,
        //     writable: true,
        //     value: async function valid(...props: any[]) {
        //         const ps: any[] = [];
        //         // tslint:disable-next-line: no-unused-expression
        //         (props || []).map((value: any, index: number) => {
        //             const type = (paramTypes[index] && paramTypes[index].name) ? paramTypes[index].name : "any";
        //             if (!paramterTypes[type]) {
        //                 ps.push(ClassValidator.valid(paramTypes[index], value, true));
        //             } else {
        //                 ps.push(Promise.resolve(value));
        //             }
        //         });
        //         if (ps.length > 0) {
        //             props = await Promise.all(ps);
        //         }
        //         // tslint:disable-next-line: no-invalid-this
        //         return value.apply(this, props);
        //     }
        // };
        // return descriptor;
    };
}

/**
 * Marks property as included in the process of transformation.
 *
 * @export
 * @returns {PropertyDecorator}
 */
export function Expose(): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        const types = Reflect.getMetadata("design:type", object, propertyName);
        if (types) {
            const originMap = getOriginMetadata(PARAM_TYPE_KEY, object);
            originMap.set(propertyName, types.name);
        }
    };
}

/**
 * Identifies that the field needs to be defined
 *
 * @export
 * @returns {PropertyDecorator}
 */
export function IsDefined(): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);
    };
}

/**
 * Checks if value is a chinese name.
 *
 * @export
 * @param {string} property
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsCnName(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsCnName",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return cnName(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks if value is a idCard number(chinese).
 *
 * @export
 * @param {string} property
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsIdNumber(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsIdNumber",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return idNumber(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks if value is a zipCode(chinese).
 *
 * @export
 * @param {string} property
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsZipCode(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsZipCode",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return zipCode(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks if value is a mobile phone number(chinese).
 *
 * @export
 * @param {string} property
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsMobile(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsMobile",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return mobile(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks if value is a plate number(chinese).
 *
 * @export
 * @param {string} property
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsPlateNumber(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsPlateNumber",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return plateNumber(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks value is not empty, undefined, null, '', NaN, [], {} and any empty string(including spaces, tabs, formfeeds, etc.), returns false.
 *
 * @export
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsNotEmpty(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "IsNotEmpty",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return !Check.isEmpty(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return "invalid parameter ($property).";
                }
            }
        });
    };
}

/**
 * Checks if value matches ("===") the comparison.
 *
 * @export
 * @param {*} comparison
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Equals(comparison: any, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vEquals",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return equals(value, comparison);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter, ($property) must be equals ${comparison}.`;
                }
            }
        });
    };
}

/**
 * Checks if value does not match ("!==") the comparison.
 *
 * @export
 * @param {*} comparison
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function NotEquals(comparison: any, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vNotEquals",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return notEquals(value, comparison);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter, ($property) must be not equals ${comparison}.`;
                }
            }
        });
    };
}

/**
 * Checks if the string contains the seed.
 *
 * @export
 * @param {string} seed
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Contains(seed: string, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vContains",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return contains(value, seed);
                    // return typeof value === "string" && (value.indexOf(seed) > -1);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter, ($property) must be contains ${seed}.`;
                }
            }
        });
    };
}

/**
 * Checks if given value is in a array of allowed values.
 *
 * @export
 * @param {any[]} possibleValues
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsIn(possibleValues: any[], validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsIn",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isIn(value, possibleValues);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if given value not in a array of allowed values.
 *
 * @export
 * @param {any[]} possibleValues
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsNotIn(possibleValues: any[], validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsNotIn",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isNotIn(value, possibleValues);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if a given value is a real date.
 *
 * @export
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsDate(validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsDate",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isDate(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the first number is greater than or equal to the min value.
 *
 * @export
 * @param {number} min
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Gt(min: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vMin",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return lodash.toNumber(value) > min;
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the first number is less than or equal to the max value.
 *
 * @export
 * @param {number} max
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Lt(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vMax",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return lodash.toNumber(value) < max;
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}
/**
 * Checks if the first number is greater than or equal to the min value.
 *
 * @export
 * @param {number} min
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Gte(min: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vMin",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return lodash.toNumber(value) >= min;
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the first number is less than or equal to the max value.
 *
 * @export
 * @param {number} max
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Lte(max: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vMax",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return lodash.toNumber(value) <= max;
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the string's length falls in a range. Note: this function takes into account surrogate pairs.
 * If given value is not a string, then it returns false.
 *
 * @export
 * @param {number} min
 * @param {number} [max]
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function Length(min: number, max?: number, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vLength",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return length(value, min, max);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the string is an email. If given value is not a string, then it returns false.
 *
 * @export
 * @param {IsEmailOptions} [options]
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsEmail(options?: IsEmailOptions, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsEmail",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isEmail(value);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the string is an IP (version 4 or 6). If given value is not a string, then it returns false.
 *
 * @export
 * @param {number} [version]
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsIP(version?: IsIpVersion, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsIP",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isIP(value, version);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the string is a valid phone number.
 *
 * @export
 * @param {string} {string} region 2 characters uppercase country code (e.g. DE, US, CH).
 * If users must enter the intl. prefix (e.g. +41), then you may pass "ZZ" or null as region.
 * See [google-libphonenumber, metadata.js:countryCodeToRegionCodeMap on github]
 * {@link https://github.com/ruimarinho/google-libphonenumber/blob/1e46138878cff479aafe2ce62175c6c49cb58720/src/metadata.js#L33}
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsPhoneNumber(region?: CountryCode, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsPhoneNumber",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isPhoneNumber(value, region);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * Checks if the string is an url.
 *
 * @export
 * @param {IsURLOptions} [options]
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsUrl(options?: IsURLOptions, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsUrl",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isURL(value, options);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter ($property).`;
                }
            }
        });
    };
}

/**
 * check if the string is a hash of type algorithm. Algorithm is one of ['md4', 'md5', 'sha1', 'sha256',
 * 'sha384', 'sha512', 'ripemd128', 'ripemd160', 'tiger128', 'tiger160', 'tiger192', 'crc32', 'crc32b']
 *
 * @export
 * @param {HashAlgorithm} algorithm
 * @param {ValidationOptions} [validationOptions]
 * @returns {PropertyDecorator}
 */
export function IsHash(algorithm: HashAlgorithm, validationOptions?: ValidationOptions): PropertyDecorator {
    return function (object: Object, propertyName: string) {
        setExpose(object, propertyName);

        registerDecorator({
            name: "vIsHash",
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: {
                validate(value: any, args: ValidationArguments) {
                    return isHash(value, algorithm);
                },
                defaultMessage(args: ValidationArguments) {
                    return `invalid parameter, ($property) must be is an ${algorithm} Hash string.`;
                }
            }
        });
    };
}
