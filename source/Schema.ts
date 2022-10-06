import { Data } from '@jeremy-bankes/toolbox';
import { StringToNumberConverter, StringToBooleanConverter, StringToDateConverter } from './converters.js';
import { TypeConverter } from './TypeConverter.js';

/**
 * Represents a mapping of strings to their corresponding types.
 */
export interface TypeMap {
    'string': string;
    'number': number;
    'boolean': boolean;
    'Date': Date;
    'any': any;
};

/**
 * Represents a definition of a schema.
 */
export type SchemaDefinition = {
    [SchemaDefinitionKey: string]: SchemaItem | SchemaDefinition
};

/**
 * Represents the meta information describing a value held by an object described by a {@link SchemaDefinition}.
 */
type SchemaItem = {
    type: keyof TypeMap | (keyof TypeMap)[] | SchemaDefinition | SchemaDefinition[],
    required?: boolean,
    default?: any
};

/**
 * Represents the type of a value within a {@link Model} (or {@link ModelDefinition} if {@link IsModelDefinition} is true).
 * Either a type from {@link TypeMap} or a nested {@link Model} (or {@link ModelDefinition}).
 */
type ModelItemType<Item extends SchemaItem | SchemaDefinition, IsModelDefinition extends boolean> = (
    Item extends SchemaDefinition ? (
        // Handle Item is SchemaDefinition, not SchemaItem 
        IsModelDefinition extends true ? ModelDefinition<Item> : Model<Item>
    ) :
    Item extends SchemaItem & { type: keyof TypeMap } ? (
        // Handle type = keyof TypeMap
        TypeMap[Item['type']]
    ) :
    Item extends SchemaItem & { type: (keyof TypeMap)[] } ? (
        // Handle type = (keyof TypeMap)[]
        TypeMap[Item['type'][0]][]
    ) :
    Item extends SchemaItem & { type: SchemaDefinition } ? (
        // Handle type = SchemaDefinition
        IsModelDefinition extends true ? ModelDefinition<Item['type']> : Model<Item['type']>
    ) :
    Item extends { type: SchemaDefinition[] } ? (
        // Handle type = SchemaDefinition[]
        IsModelDefinition extends true ? ModelDefinition<Item['type'][0]>[] : Model<Item['type'][0]>[]
    ) : (
        never
    )
);

/**
 * Determines if a given {@link SchemaValue} is required when creating a {@link ModelDefinition}.
 */
type IsValueRequired<SchemaValue extends SchemaItem | SchemaDefinition> = (
    SchemaValue extends SchemaItem ? (
        SchemaValue extends { required: true } ? true : false
    ) : (
        SchemaValue extends SchemaDefinition ? (
            {
                [Key in keyof SchemaValue]: IsValueRequired<SchemaValue[Key]> extends true ? true : never
            }[keyof SchemaValue] extends never ? false : true
        ) : (
            false
        )
    )
);

/**
 * Determines if a given {@link SchemaValue} is present when accessing values in a {@link Model}.
 */
type IsValuePresent<SchemaValue extends SchemaItem | SchemaDefinition> = (
    SchemaValue extends SchemaItem ? (
        SchemaValue extends { required: true } ? (
            true
        ) : (
            SchemaValue extends { default: any } ? true : false
        )
    ) : (
        SchemaValue extends SchemaDefinition ? (
            (
                { [Key in keyof SchemaValue]: IsValuePresent<SchemaValue[Key]> extends true ? true : never }
            )[keyof SchemaValue] extends never ? false : true
        ) : (
            false
        )
    )
);

/**
 * Typing for inline data that matches a {@link Definition}.
 */
export type ModelDefinition<Definition extends SchemaDefinition> = (
    { [Key in keyof Definition as IsValueRequired<Definition[Key]> extends true ? Key : never]: ModelItemType<Definition[Key], true> } &
    { [Key in keyof Definition as IsValueRequired<Definition[Key]> extends false ? Key : never]?: ModelItemType<Definition[Key], true> }
);

/**
 * Typing for data that has been validated as matching a {@link Definition}.
 */
export type Model<Definition extends SchemaDefinition> = (
    { [Key in keyof Definition as IsValuePresent<Definition[Key]> extends true ? Key : never]: ModelItemType<Definition[Key], false> } &
    { [Key in keyof Definition as IsValuePresent<Definition[Key]> extends false ? Key : never]?: ModelItemType<Definition[Key], false> }
);

/**
 * An error that is thrown if supplied data does not pass validation.
 */
export class SchemaValidationError extends Error {

    private _data: string;
    private _path: string | null;

    /**
     * @param message The error message.
     * @param path The path to the value that failed validation.
     * @param data The data that failed validation.
     */
    public constructor(message: string, path: string | null, data: any) {
        super(message);
        this._path = path;
        this._data = data;
    }

    public get path() {
        return this._path;
    }

    public get data() {
        return this._data;
    }

}

/**
 * A static class for interacting with structured data.
 */
export class Schema {

    private static _typeConverters: TypeConverter<any, any>[] = [
        new StringToNumberConverter(),
        new StringToBooleanConverter(),
        new StringToDateConverter()
    ];

    /**
     * Allows you to define the structure of data. Required for validating an object with {@link Schema.validate}.
     * @param schema The structure of data.
     * @returns An meta object representing the structure of data.
     */
    public static create<Schema extends SchemaDefinition>(schema: Schema) {
        return schema;
    }

    /**
     * Ensures that 'data' matches the structure and typing of 'schema'.
     * @param data The data to be validated.
     * @param schema The structure of 'data'.
     * @returns Validated 'data'.
     * @throws A {@link SchemaValidationError} if 'data' could not be validated as matching 'schema'.
     */
    public static async validate<Schema extends SchemaDefinition>(data: ModelDefinition<Schema> | null, schema: Schema) {
        if (typeof data !== 'object' || data === null) {
            throw new SchemaValidationError(`Invalid data "${data}". Cannot apply schema.`, null, data);
        }
        const ensureDefault = async (itemSchema: SchemaItem, path: string, error: boolean) => {
            if (!Data.has(data, path)) {
                if (itemSchema.default === undefined) {
                    if (error) {
                        throw new SchemaValidationError(`Missing required path "${path}" in ${JSON.stringify(data)}.`, path, data);
                    } else {
                        Data.set(data, path, null);
                    }
                } else {
                    Data.set(data, path, await Schema._evaluateDefault(itemSchema));
                }
            }
        };
        const ensureType = async (itemSchema: SchemaItem, dataValue: any, path: string) => {
            const defaultOrError = async (dataType: string) => {
                if (itemSchema.default === undefined) {
                    throw new SchemaValidationError(
                        `Incorrect type at "${path}" in ${JSON.stringify(data)}. ` +
                        `Expected "${itemSchema.type}[]", got "${dataType}". ` +
                        'If this is a declaration merged type, please ensure it is a class (has a constructor name).',
                        path, data
                    );
                } else {
                    Data.set(data, path, await Schema._evaluateDefault(itemSchema));
                }
            };
            if (Array.isArray(itemSchema.type)) {
                if (itemSchema.type.length !== 1) {
                    throw new Error('Schema definition array types should have exactly one value.');
                }
                let arrayType = itemSchema.type[0];
                if (typeof arrayType === 'string') {
                    const dataType = Schema._getTypeName(dataValue);
                    if (!Schema._isTypeMatch(dataType, arrayType + '[]')) {
                        if (Array.isArray(dataValue)) {
                            const convertedValues = dataValue.map(value => Schema._attemptTypeConversion(value, arrayType as keyof TypeMap));
                            if (convertedValues.every(value => value !== null)) {
                                Data.set(data, path, convertedValues);
                            } else {
                                defaultOrError(dataType);
                            }
                        } else {
                            defaultOrError(dataType);
                        }
                    }
                } else {
                    if (Array.isArray(dataValue)) {
                        for (const item of dataValue) {
                            await this.validate(item, arrayType);
                        }
                    } else {
                        if (itemSchema.default === undefined) {
                            throw new SchemaValidationError(
                                `Incorrect type at "${path}" in ${JSON.stringify(data)}. ` +
                                `Expected array.`,
                                path, data
                            );
                        } else {
                            Data.set(data, path, await Schema._evaluateDefault(itemSchema));
                        }
                    }
                }
            } else {
                if (typeof itemSchema.type === 'string') {
                    const dataType = Schema._getTypeName(dataValue);
                    if (!Schema._isTypeMatch(dataType, itemSchema.type)) {
                        dataValue = Schema._attemptTypeConversion(dataValue, itemSchema.type);
                        if (dataValue !== null) {
                            Data.set(data, path, dataValue);
                        } else {
                            defaultOrError(dataType);
                        }
                    }
                } else {
                    await this.validate(dataValue, itemSchema.type);
                }
            }
        };
        const tasks: Promise<void>[] = [];
        Data.walk(schema, (target, property, path) => {
            if (Schema._isItemSchema(property)) {
                tasks.push(new Promise<void>(async (resolve, reject) => {
                    try {
                        const itemSchema: SchemaItem = property;
                        if (itemSchema.required === true) {
                            await ensureDefault(itemSchema, path, true);
                            const dataValue: any = Data.get(data, path);
                            await ensureType(itemSchema, dataValue, path);
                        } else {
                            if (Data.has(data, path)) {
                                const dataValue: any = Data.get(data, path);
                                await ensureType(itemSchema, dataValue, path);
                            } else {
                                await ensureDefault(itemSchema, path, false);
                            }
                        }
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                }));
                return true;
            }
            return false;
        });
        await Promise.all(tasks);
        return data as Model<Schema>;
    }

    public static registerTypeConverter(converter: TypeConverter<any, any>) {
        this._typeConverters.push(converter);
    }

    public static _attemptTypeConversion<FromType extends any>(value: FromType, toType: keyof TypeMap) {
        const fromType = Schema._getTypeName(value);
        if (fromType === toType) {
            return value;
        }
        let converter: TypeConverter<FromType, TypeMap[typeof toType]> | null = null;
        for (let i = 0; i < Schema._typeConverters.length && converter === null; i++) {
            const potentialTypeConverter = Schema._typeConverters[i];
            if (potentialTypeConverter.fromType === fromType && potentialTypeConverter.toType === toType) {
                converter = potentialTypeConverter;
            }
        }
        if (converter !== null) {
            return converter.convert(value);
        }
        return null;
    }

    public static async validateArray<Schema extends SchemaDefinition>(data: ModelDefinition<Schema>[], schema: Schema) {
        const tasks = [];
        for (const item of data) {
            tasks.push(this.validate(item, schema));
        }
        return await Promise.all(tasks) as Model<Schema>[];
    }

    /**
     * Gets the type of name of 'value'. Useful for indexing {@link TypeMap}.
     * If you are trying to extend your Schemas to work with custom types,
     * the type names returned by this function can be used as keys in a typescript declaration merge with {@link TypeMap}.
     * @param value The value to retrieve the type of.
     * @returns The type of 'value' as it would appear as if it were to be a key in {@link TypeMap}.
     */
    private static _getTypeName(value: any) {
        const extendedTypeOf = (value: any) => {
            let type: string = typeof value;
            if (value === undefined) {
                type = 'undefined';
            } else if (value === null) {
                type = 'null';
            } else if (type === 'object' && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
                type = value.constructor.name;
            }
            return type;
        };
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return 'any[]';
            } else {
                let type = extendedTypeOf(value[0]);
                for (let i = 1; i < value.length; i++) {
                    const nextType = value[i];
                    if (extendedTypeOf(nextType) !== type) {
                        return 'any[]';
                    }
                }
                return type + '[]';
            }
        }
        return extendedTypeOf(value);
    }

    /**
     * A runtime implementation of the instanceof operator to work with types returned by {@link Schema._getTypeName}.
     * @param givenType A type name created by {@link Schema._getTypeName}.
     * @param intendedType A type name created by {@link Schema._getTypeName}.
     * @returns True if a 'givenType' matches 'intendedType'.
     */
    private static _isTypeMatch(givenType: string, intendedType: string): boolean {
        if (givenType === intendedType) {
            return true;
        }
        const givenTypeIsArray = givenType.endsWith('[]');
        const intendedTypeIsArray = intendedType.endsWith('[]');
        if (givenTypeIsArray && intendedTypeIsArray) {
            return this._isTypeMatch(givenType.substring(0, givenType.length - 2), intendedType.substring(0, intendedType.length - 2));
        }
        if (givenType === 'any' || intendedType === 'any') {
            return true;
        }
        return false;
    }

    private static _isItemSchema(object: any): boolean {
        if (typeof object === 'object' && object !== null) {
            if (typeof object.type === 'string' || typeof object.type === 'object') {
                return true;
            }
        }
        return false;
    }

    private static async _evaluateDefault(itemSchema: SchemaItem) {
        let value: any;
        if (itemSchema.default instanceof Promise) {
            value = await itemSchema.default;
        } else if (typeof itemSchema.default === 'function') {
            value = await Promise.resolve(itemSchema.default());
        } else {
            value = itemSchema.default;
        }
        return value;
    }

    private constructor() {
        throw new Error('The Schema class is not meant to be instantiated.');
    }

}