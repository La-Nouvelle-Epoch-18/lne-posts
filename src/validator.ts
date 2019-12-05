import moment = require('moment');
import validate = require('validate.js');

import { Response } from 'express';

abstract class TValidator<TResult>
{
    protected obj: any = {};
    protected date_extended: boolean = false;

    check(data: any, res: Response): data is TResult
    {
        const notValid = validate(data, this.obj);
        if (notValid)
        {
            res.status(400).json({
                error: "Invalid parameters",
                details: notValid
            });
            return false;
        }
        else
        {
            return true;
        }
    }

    extentDate(): void
    {
        validate.extend(validate.validators.datetime, {
            parse: function(value: any, options: any)
            {
                const format = options.dateOnly ? "YYYY-MM-DD" : moment.ISO_8601;
                return +moment.utc(value, format);
            },
            format: function(value: any, options: any)
            {
                const format = options.dateOnly ? "YYYY-MM-DD" : undefined;
                return moment.utc(value).format(format);
            }
        });
    }

}

export class QueryValidator<TResult> extends TValidator<TResult>
{
    /**
     * Check for a parameter to be a boolean ('true' or 'false')
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    boolean<TParam extends string>(name: TParam, required: false): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    boolean<TParam extends string>(name: TParam, required: true): QueryValidator<TResult & { [P in TParam]: string }>;
    boolean<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            inclusion: ['true', 'false']
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a date
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param onlyPast Only allows date in the past (default true)
     * @param onlyFuture Only allows date in the future (default false)
     * @param include_today Include todays in checks (default false)
     * @param dateOnly If true only the date is required (YYYY-MM-DD) otherwise the time is required (YYYY-MM-DDTHH-mm-SS.ZZZ\Z) (default true)
     */
    date<TParam extends string>(name: TParam, required: false, onlyPast?: boolean, onlyFuture?: boolean, include_today?: boolean, dateOnly?: boolean): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    date<TParam extends string>(name: TParam, required: true, onlyPast?: boolean, onlyFuture?: boolean, include_today?: boolean, dateOnly?: boolean): QueryValidator<TResult & { [P in TParam]: string }>;
    date<TParam extends string>(name: TParam, required: boolean, onlyPast = true, onlyFuture = false, include_today = false, dateOnly = true)
    {
        if (!this.date_extended)
        {
            this.extentDate();
            this.date_extended = true;
        }

        this.obj[name] = {
            presence: required,
            datetime: {
                dateOnly,
                latest: onlyPast ? (include_today ? moment.utc().add(1, 'day') : moment.utc()) : undefined,
                earliest: onlyFuture ? (include_today ? moment.utc().subtract(1, 'day') : moment.utc()) : undefined
            }
        };

        return this as unknown;
    }

    /**
     * Check for the paramter 'email' to be an email
     * @param required If the parameter is required
     */
    email(required: false): QueryValidator<TResult & { email: string | undefined }>;
    email(required: true): QueryValidator<TResult & { email: string }>;
    email(required: boolean)
    {
        this.obj.email = {
            presence: required,
            email: true
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be an identifier (integer greater that 0)
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    id<TParam extends string>(name: TParam, required: false): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    id<TParam extends string>(name: TParam, required: true): QueryValidator<TResult & { [P in TParam]: string }>;
    id<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            numericality: {
                onlyInteger: true,
                strict: true,
                greaterThan: 0,
                noStrings: false
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to match any of the given values
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param inclusion The allowed values
     */
    inclusion<TParam extends string>(name: TParam, required: false, inclusion: string[]): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    inclusion<TParam extends string>(name: TParam, required: true, inclusion: string[]): QueryValidator<TResult & { [P in TParam]: string }>;
    inclusion<TParam extends string>(name: TParam, required: boolean, inclusion: string[])
    {
        this.obj[name] = {
            presence: required,
            inclusion
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a number
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param min Optional lower bound for the allowed values
     * @param max Optional upper bound for the allowed values
     * @param onlyInteger Set this to false to check floating point number (default true)
     */
    number<TParam extends string>(name: TParam, required: false, min?: number, max?: number, onlyInteger?: boolean): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    number<TParam extends string>(name: TParam, required: true, min?: number, max?: number, onlyInteger?: boolean): QueryValidator<TResult & { [P in TParam]: string }>;
    number<TParam extends string>(name: TParam, required: boolean, min?: number, max?: number, onlyInteger = true)
    {
        this.obj[name] = {
            presence: required,
            numericality: {
                onlyInteger: onlyInteger,
                strict: true,
                greaterThanOrEqualTo: min,
                lessThanOrEqualTo: max,
                noStrings: false
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameters lat and lng to be present and match coordinates requirement
     */
    pos()
    {
        this.obj.lat = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: -90,
                lessThanOrEqualTo: 90,
                noStrings: false
            }
        };

        this.obj.lng = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: -180,
                lessThanOrEqualTo: 180,
                noStrings: false
            }
        };

        return this as unknown as QueryValidator<TResult & { lat: string, lng: string }>;
    }

    /**
     * Check for a parameters lat and lng to be present and match coordinates requirement
     */
    posDeg()
    {
        this.obj.latdeg = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: 0,
                noStrings: false
            }
        };

        this.obj.lngdeg = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: 0,
                noStrings: false
            }
        };

        return this as unknown as QueryValidator<TResult & { latdeg: string, lngdeg: string }>;
    }

    /**
     * Check for a parameter to be present
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    present<TParam extends string>(name: TParam, required: false): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    present<TParam extends string>(name: TParam, required: true): QueryValidator<TResult & { [P in TParam]: string }>;
    present<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to match a regex
     * @param name The name of the parameter
     * @param reg The regex to match
     * @param required If the parameter is required
     */
    regex<TParam extends string>(name: TParam, reg: RegExp, required: false): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    regex<TParam extends string>(name: TParam, reg: RegExp, required: true): QueryValidator<TResult & { [P in TParam]: string }>;
    regex<TParam extends string>(name: TParam, reg: RegExp, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            format: {
                pattern: reg
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a number
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param max Optional upper bound for the length of the string (default -1 (unlimited))
     * @param min Optional lower bound for the length of the string (default 0)
     */
    str<TParam extends string>(name: TParam, required: false, max?: number, min?: number): QueryValidator<TResult & { [P in TParam]: string | undefined }>;
    str<TParam extends string>(name: TParam, required: true, max?: number, min?: number): QueryValidator<TResult & { [P in TParam]: string }>;
    str<TParam extends string>(name: TParam, required: boolean, max = -1, min = 0)
    {
        const len: any = {};
        if (max > 0)
        {
            len['maximum'] = max;
        }
        if (min > 0)
        {
            len['minimum'] = min;
        }

        this.obj[name] = {
            presence: required,
            length: len
        };

        return this as unknown;
    }
}

export class BodyValidator<TResult> extends TValidator<TResult>
{
    /**
     * Check for a parameter to be an array of identifier
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    idArray<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: number[] | undefined }>;
    idArray<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: number[] }>;
    idArray<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            type: {
                type: (v: any) =>
                {
                    if (!Array.isArray(v))
                    {
                        return false;
                    }
                    for (const e of v)
                    {
                        if (!isAnIdentifier(e))
                        {
                            return false;
                        }
                    }
                    return true;
                },
                message: "should be an array of identifier (integer greater than zero)"
            }
        };
        return this as unknown;
    }

    /**
     * Check for a parameter to be a boolean (true or false)
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    boolean<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: boolean | undefined }>;
    boolean<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: boolean }>;
    boolean<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            inclusion: [true, false]
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a date
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param onlyPast Only allows date in the past (default true)
     * @param onlyFuture Only allows date in the future (default false)
     * @param include_today Include todays in checks (default false)
     * @param dateOnly If true only the date is required (YYYY-MM-DD) otherwise the time is required (YYYY-MM-DDTHH-mm-SS.ZZZ\Z) (default true)
     */
    date<TParam extends string>(name: TParam, required: false, onlyPast?: boolean, onlyFuture?: boolean, include_today?: boolean, dateOnly?: boolean): BodyValidator<TResult & { [P in TParam]: string | undefined }>;
    date<TParam extends string>(name: TParam, required: true, onlyPast?: boolean, onlyFuture?: boolean, include_today?: boolean, dateOnly?: boolean): BodyValidator<TResult & { [P in TParam]: string }>;
    date<TParam extends string>(name: TParam, required: boolean, onlyPast = true, onlyFuture = false, include_today = false, dateOnly = true)
    {
        if (!this.date_extended)
        {
            this.extentDate();
            this.date_extended = true;
        }

        this.obj[name] = {
            presence: required,
            datetime: {
                dateOnly,
                latest: onlyPast ? (include_today ? moment.utc().add(1, 'day') : moment.utc()) : undefined,
                earliest: onlyFuture ? (include_today ? moment.utc().subtract(1, 'day') : moment.utc()) : undefined
            }
        };

        return this as unknown;
    }

    /**
     * Check for the paramter 'email' to be an email
     * @param required If the parameter is required
     */
    email(required: false): BodyValidator<TResult & { email: string | undefined }>;
    email(required: true): BodyValidator<TResult & { email: string }>;
    email(required: boolean)
    {
        this.obj.email = {
            presence: required,
            email: true
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be an identifier (integer greater that 0)
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    id<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: number | undefined }>;
    id<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: number }>;
    id<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            numericality: {
                onlyInteger: true,
                strict: true,
                greaterThan: 0,
                noStrings: true
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to match any of the given values
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param inclusion The allowed values
     */
    inclusion<TParam extends string, TType>(name: TParam, required: false, inclusion: TType[]): BodyValidator<TResult & { [P in TParam]: TType | undefined }>;
    inclusion<TParam extends string, TType>(name: TParam, required: true, inclusion: TType[]): BodyValidator<TResult & { [P in TParam]: TType }>;
    inclusion<TParam extends string, TType>(name: TParam, required: boolean, inclusion: TType[])
    {
        this.obj[name] = {
            presence: required,
            inclusion
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to match any of the given values
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param min Optional lower bound for the allowed values
     * @param max Optional upper bound for the allowed values
     * @param onlyInteger Set this to false to check floating point number (default true)
     */
    number<TParam extends string>(name: TParam, required: false, min?: number, max?: number, onlyInteger?: boolean): BodyValidator<TResult & { [P in TParam]: number | undefined }>;
    number<TParam extends string>(name: TParam, required: true, min?: number, max?: number, onlyInteger?: boolean): BodyValidator<TResult & { [P in TParam]: number }>;
    number<TParam extends string>(name: TParam, required: boolean, min?: number, max?: number, onlyInteger = true)
    {
        this.obj[name] = {
            presence: required,
            numericality: {
                onlyInteger: onlyInteger,
                strict: true,
                greaterThanOrEqualTo: min,
                lessThanOrEqualTo: max,
                noStrings: true
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameters lat and lng to be present and match coordinates requirement
     */
    pos()
    {
        this.obj.lat = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: -90,
                lessThanOrEqualTo: 90,
                noStrings: true
            }
        };

        this.obj.lng = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: -180,
                lessThanOrEqualTo: 180,
                noStrings: true
            }
        };

        return this as unknown as BodyValidator<TResult & { lat: number, lng: number }>;
    }

    /**
     * Check for a parameters lat and lng to be present and match coordinates requirement
     */
    posDeg()
    {
        this.obj.latdeg = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: 0,
                noStrings: true
            }
        };

        this.obj.lngdeg = {
            presence: true,
            numericality: {
                onlyInteger: false,
                strict: true,
                greaterThanOrEqualTo: 0,
                noStrings: true
            }
        };

        return this as unknown as BodyValidator<TResult & { latdeg: number, lngdeg: number }>;
    }

    /**
     * Check for a parameter to be present
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    present<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: any | undefined }>;
    present<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: any }>;
    present<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to match a regex
     * @param name The name of the parameter
     * @param reg The regex to match
     * @param required If the parameter is required
     */
    regex<TParam extends string>(name: TParam, reg: RegExp, required: false): BodyValidator<TResult & { [P in TParam]: string | undefined }>;
    regex<TParam extends string>(name: TParam, reg: RegExp, required: true): BodyValidator<TResult & { [P in TParam]: string }>;
    regex<TParam extends string>(name: TParam, reg: RegExp, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            format: {
                pattern: reg
            }
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a number
     * @param name The name of the parameter
     * @param required If the parameter is required
     * @param max Optional upper bound for the length of the string (default -1 (unlimited))
     * @param min Optional lower bound for the length of the string (default 0)
     */
    str<TParam extends string>(name: TParam, required: false, max?: number, min?: number): BodyValidator<TResult & { [P in TParam]: string | undefined }>;
    str<TParam extends string>(name: TParam, required: true, max?: number, min?: number): BodyValidator<TResult & { [P in TParam]: string }>;
    str<TParam extends string>(name: TParam, required: boolean, max = -1, min = 0)
    {
        const len: any = {};

        if (max > 0)
        {
            len['maximum'] = max;
        }
        if (min > 0)
        {
            len['minimum'] = min;
        }

        this.obj[name] = {
            presence: required,
            length: len
        };

        return this as unknown;
    }

    /**
     * Check for a parameter to be a shape
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    shape<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: Array<[number, number]> | undefined }>;
    shape<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: Array<[number, number]> }>;
    shape<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            type: {
                type: (v: any) =>
                {
                    if (!Array.isArray(v) || v.length < 3)
                    {
                        return false;
                    }
                    for (const e of v)
                    {
                        if (!Array.isArray(e) || e.length != 2)
                        {
                            return false;
                        }
                        if (!isANumber(e[0]) || e[0] < -90 || e[0] > 90) // Check the latitude
                        {
                            return false;
                        }
                        if (!isANumber(e[1]) || e[1] < -180 || e[1] > 180) // Check the longitude
                        {
                            return false;
                        }
                    }
                    return true;
                },
                message: "should be a shape (an array of at least 3 tuple with the latitude and the longitude)"
            }
        };
        return this as unknown;
    }

    /**
     * Check for a parameter to be an object
     * @param name The name of the parameter
     * @param required If the parameter is required
     */
    object<TParam extends string>(name: TParam, required: false): BodyValidator<TResult & { [P in TParam]: object | undefined }>;
    object<TParam extends string>(name: TParam, required: true): BodyValidator<TResult & { [P in TParam]: object }>;
    object<TParam extends string>(name: TParam, required: boolean)
    {
        this.obj[name] = {
            presence: required,
            type: {
                type: (v: any) =>
                {
                    if (typeof v != "object")
                    {
                        return false;
                    }
                    if (Array.isArray(v))
                    {
                        return false;
                    }
                    return true;
                },
                message: "should be an object"
            }
        };
        return this as unknown;
    }

}

export function isANumber(val: any): val is number
{
    return typeof (val) == "number" && !isNaN(val);
}

export function isAnInteger(val: any): val is number
{
    return isANumber(val) && val % 1 === 0;
}

export function isAnIdentifier(val: any): val is number
{
    return isAnInteger(val) && val > 0;
}
