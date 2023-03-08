/**
 * @ Author: Hanrea
 * @ version: 2022-03-21 13:14:21
 * @ copyright: Vecmat (c) - <hi(at)vecmat.com>
 */
import { CountryCode } from "libphonenumber-js";

import {
    contains,
    equals,
    isEmail,
    isHash,
    isIn,
    isIP,
    isNotIn,
    isPhoneNumber,
    isURL,
    notEquals,
    validate,
    ValidationError
} from "class-validator";
import lodash from "lodash";
import { Exception, Check } from "@vecmat/vendor";
import { IsEmailOptions, IsURLOptions, HashAlgorithm, ValidOtpions } from "./decorator";
import { cnName, idNumber, mobile, plainToClass, plateNumber, zipCode } from "./util";


// constant
export const PARAM_TYPE_KEY = "PARAM_TYPE_KEY";
export const PARAM_RULE_KEY = "PARAM_RULE_KEY";
export const PARAM_CHECK_KEY = "PARAM_CHECK_KEY";
export const ENABLE_VALIDATED = "ENABLE_VALIDATED";

/**
 * paramterTypes
 *
 * @export
 * @enum {number}
 */
export enum paramterTypes {
    "Number",
    "number",
    "String",
    "string",
    "Boolean",
    "boolean",
    "Array",
    "array",
    "Tuple",
    "tuple",
    "Object",
    "object",
    "Enum",
    "enum",
    "Bigint",
    "bigint",
    "Null",
    "null",
    "Undefined",
    "undefined"
}

export class ValidateClass {
    private static instance: ValidateClass;

    private constructor() {}

    /**
     *
     *
     * @static
     * @returns
     * @memberof ValidateUtil
     */
    static getInstance() {
        return this.instance || (this.instance = new ValidateClass());
    }

    /**
     * validated data vs dto class
     *
     * @param {*} Clazz
     * @param {*} data
     * @param {boolean} [convert=false] auto convert parameters type
     * @returns {Promise<any>}
     * @memberof ValidateClass
     */
    async valid(Clazz: any, data: any, convert = false): Promise<any> {
        let obj: any = {};
        if (data instanceof Clazz) obj = data;
        else obj = plainToClass(Clazz, data, convert);

        let errors: ValidationError[] = [];
        if (convert) errors = await validate(obj);
        else errors = await validate(obj, { skipMissingProperties: true });

        if (errors.length > 0) throw new Exception("APIERR_VALIDED", "params validated error", Object.values(errors[0].constraints)[0]);

        return obj;
    }
}

/**
 * ClassValidator for manual
 */
export const ClassValidator = ValidateClass.getInstance();

/**
 * type checked rules
 *
 * @export
 * @type {number}
 */
export type ValidRules =
    | "IsNotEmpty"
    | "IsDate"
    | "IsEmail"
    | "IsIP"
    | "IsPhoneNumber"
    | "IsUrl"
    | "IsHash"
    | "IsCnName"
    | "IsIdNumber"
    | "IsZipCode"
    | "IsMobile"
    | "IsPlateNumber"
    | "Equals"
    | "NotEquals"
    | "Contains"
    | "IsIn"
    | "IsNotIn"
    | "Gt"
    | "Lt"
    | "Gte"
    | "Lte";

/**
 * Validator Functions
 */
const ValidFuncs = {
    /**
     * Checks value is not empty, undefined, null, '', NaN, [], {} and any empty string(including spaces,
     * tabs, formfeeds, etc.), returns false
     */
    IsNotEmpty: (value: unknown) => {
        return !Check.isEmpty(value);
    },
    /**
     * Checks if a given value is a real date.
     */
    IsDate: (value: unknown) => {
        return lodash.isDate(value);
    },
    /**
     * Checks if the string is an email. If given value is not a string, then it returns false.
     */
    IsEmail: (value: unknown, options?: IsEmailOptions) => {
        return isEmail(value, options);
    },
    /**
     * Checks if the string is an IP (version 4 or 6). If given value is not a string, then it returns false.
     */
    IsIP: (value: unknown, version?: any) => {
        return isIP(value, version);
    },
    /**
     * Checks if the string is a valid phone number.
     * @param value — the potential phone number string to test
     * @param region 2 characters uppercase country code (e.g. DE, US, CH). If users must enter the intl.
     * prefix (e.g. +41), then you may pass "ZZ" or null as region.
     * See [google-libphonenumber, metadata.js:countryCodeToRegionCodeMap on github]
     * {@link https://github.com/ruimarinho/google-libphonenumber/blob/1e46138878cff479aafe2ce62175c6c49cb58720/src/metadata.js#L33}
     */
    IsPhoneNumber: (value: string, region?: CountryCode) => {
        return isPhoneNumber(value, region);
    },
    /**
     * Checks if the string is an url. If given value is not a string, then it returns false.
     */
    IsUrl: (value: string, options?: IsURLOptions) => {
        return isURL(value, options);
    },
    /**
     * check if the string is a hash of type algorithm. Algorithm is one of
     * ['md4', 'md5', 'sha1', 'sha256', 'sha384', 'sha512', 'ripemd128', 'ripemd160', 'tiger128', 'tiger160', 'tiger192', 'crc32', 'crc32b']
     */
    IsHash: (value: unknown, algorithm: HashAlgorithm) => {
        return isHash(value, algorithm);
    },
    /**
     * Checks if value is a chinese name.
     */
    IsCnName: (value: any) => {
        if (!lodash.isString(value)) return false;

        return cnName(value);
    },
    /**
     * Checks if value is a idcard number.
     */
    IsIdNumber: (value: any) => {
        if (!lodash.isString(value)) return false;

        return idNumber(value);
    },
    /**
     * Checks if value is a zipCode.
     */
    IsZipCode: (value: any) => {
        if (!lodash.isString(value)) return false;

        return zipCode(value);
    },
    /**
     * Checks if value is a mobile phone number.
     */
    IsMobile: (value: any) => {
        if (!lodash.isString(value)) return false;

        return mobile(value);
    },
    /**
     * Checks if value is a plateNumber.
     */
    IsPlateNumber: (value: any) => {
        if (!lodash.isString(value)) return false;

        return plateNumber(value);
    },
    /**
     * Checks if value matches ("===") the comparison.
     */
    Equals: (value: unknown, comparison: unknown) => {
        return equals(value, comparison);
    },
    /**
     * Checks if value does not match ("!==") the comparison.
     */
    NotEquals: (value: unknown, comparison: unknown) => {
        return notEquals(value, comparison);
    },
    /**
     * Checks if the string contains the seed. If given value is not a string, then it returns false.
     */
    Contains: (value: unknown, seed: string) => {
        return contains(value, seed);
    },
    /**
     * Checks if given value is in a array of allowed values.
     */
    IsIn: (value: unknown, possibleValues: unknown[]) => {
        return isIn(value, possibleValues);
    },
    /**
     * Checks if given value not in a array of allowed values.
     */
    IsNotIn: (value: unknown, possibleValues: unknown[]) => {
        return isNotIn(value, possibleValues);
    },
    /**
     * Checks if the first number is greater than or equal to the second.
     */
    Gt: (num: unknown, min: number) => {
        return lodash.toNumber(num) > min;
    },
    /**
     * Checks if the first number is less than or equal to the second.
     */
    Lt: (num: unknown, max: number) => {
        return lodash.toNumber(num) < max;
    },
    /**
     * Checks if the first number is greater than or equal to the second.
     */
    Gte: (num: unknown, min: number) => {
        return lodash.toNumber(num) >= min;
    },
    /**
     * Checks if the first number is less than or equal to the second.
     */
    Lte: (num: unknown, max: number) => {
        return lodash.toNumber(num) <= max;
    }
};

/**
 * Use functions or built-in rules for validation.
 *
 * @export
 * @param {ValidRules} rule
 * @param {unknown} value
 * @param {(string | ValidOtpions)} [options]
 * @returns {*}
 */
const FunctionValidator: {
    [key in ValidRules]: (value: unknown, options?: string | ValidOtpions) => void;
} = {
    IsNotEmpty(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsDate(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsEmail(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsIP(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsPhoneNumber(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsUrl(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsHash(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsCnName(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsIdNumber(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsZipCode(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsMobile(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsPlateNumber(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Equals(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    NotEquals(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Contains(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsIn(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    IsNotIn(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Gt(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Lt(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Gte(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    },
    Lte(value: unknown, options?: string | ValidOtpions): void {
        throw new Exception("SYSERR_RULE_UNREALIZED", "Function not implemented.");
    }
};

Object.keys(ValidFuncs).forEach((key: ValidRules) => {
    FunctionValidator[key] = (value: unknown, options?: string | ValidOtpions) => {
        if (lodash.isString(options)) options = { message: options, value: null } as ValidOtpions;

        if (!(<any>ValidFuncs)[key](value, (<ValidOtpions>options).value))
            throw new Exception("SYSERR_RULE_UNREALIZED", (<ValidOtpions>options).message || "ValidatorError: invalid arguments.");
    };
});

export { FunctionValidator };
