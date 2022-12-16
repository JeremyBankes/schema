/**
 * Names of valid output types.
 * Used for runtime validation.
 */
const TYPE_NAMES = [
    'string',
    'number',
    'boolean',
    'Date',
    'any'
];

/**
 * A mapping of type conversion callbacks
 * @see {TypeConversionCallbackMap}
 */
const TYPE_CONVERSION_CALLBACK_MAP: TypeConversionCallbackMap = {
    string: {
        number: (value) => parseFloat(value),
        boolean: (value) => Boolean(value),
        Date: (value) => new Date(value),
        any: (value) => JSON.parse(value)
    },
    number: {
        string: (value) => value.toString(),
        boolean: (value) => value !== 0,
        Date: (value) => new Date(value)
    },
    boolean: {
        string: (value) => value ? 'true' : 'false',
        number: (value) => value ? 1 : 0
    },
    Date: {
        string: (value) => value.toString(),
        number: (value) => value.getTime()
    }
};

/**
 * A mapping of names to their corresponding types.
 * Used for static analysis.
 */
export interface TypeMap {
    'string': string,
    'number': number,
    'boolean': boolean,
    'Date': Date,
    'any': any
}

/**
 * Represents the name of a type.
 */
type TypeName = keyof TypeMap;

/**
 * An item that describes the structure, type or layout of data.
 */
type SchemaValue = TypeName | ItemSchema | [SchemaValue] | Schema;

/**
 * A callback that converts a given value to a different type.
 */
export type TypeConversionCallback<FromType, ToType> = (value: FromType) => ToType;

/**
 * A mapping of callbacks.
 * A key in the first level hierarchy represents the type of source data.
 * A key in the second level hierarchy represents the type of converted data.
 */
type TypeConversionCallbackMap = (
    { [FromTypeName in TypeName]?: { [ToTypeName in TypeName]?: TypeConversionCallback<TypeMap[FromTypeName], TypeMap[ToTypeName]> } } &
    { [Key: string]: { [ToTypeName in TypeName]?: TypeConversionCallback<any, TypeMap[ToTypeName]> } }
);

/**
 * A hierarchy of SchemaValues that represent the structure of an object.
 * @see SchemaValue
 */
export type Schema = { [Key: string]: SchemaValue };

/**
 * A collect of meta describing a single value within an object. Used extensively within Schemas
 * @see Schema
 */
type ItemSchema = {
    type: SchemaValue,
    required: boolean
    default?: any
};

/**
 * Represents the typing for an object that has been validated to match a SchemaValue
 * @see SchemaValue
 */
export type Model<Value extends SchemaValue> = (
    Value extends TypeName ? (
        TypeMap[Value]
    ) :
    Value extends ItemSchema ? (
        IsModelValueOptional<Value> extends true ? (
            Model<Value['type']> | undefined
        ) : (
            Model<Value['type']>
        )
    ) :
    Value extends [SchemaValue] ? (
        Model<Value[0]>[]
    ) :
    Value extends Schema ? (
        { [Key in keyof Value as IsModelValueOptional<Value[Key]> extends true ? never : Key]: Model<Value[Key]> } &
        { [Key in keyof Value as IsModelValueOptional<Value[Key]> extends true ? Key : never]?: Model<Value[Key]> }
    ) :
    'Error: Value not a handled SchemaValue'
);

/**
 * Determines if a SchemaValue is required within a Schema
 * @see SchemaValue
 * @see Schema
 */
type IsModelValueOptional<Value extends SchemaValue> = (
    Value extends ItemSchema ? (
        Value['required'] extends true ? (
            false
        ) : (
            Value extends { default: any } ? false : true
        )
    ) :
    Value extends [SchemaValue] ? (
        IsModelValueOptional<Value[0]>
    ) :
    Value extends Schema ? (
        {
            [Key in keyof Value]: IsModelValueOptional<Value[Key]>
        } extends {
            [Key in keyof Value]: true
        } ? true : false
    ) :
    never
);

/**
 * Used to define a metadata object that represents the structure and typing of an object. 
 * @see Schema
 * 
 * @param schema The metadata describing an object.
 * @returns A schema that can be used to validate an object with {@link validate}.
 */
export function build<Definition extends Schema>(schema: Definition): Definition {
    return schema;
}

/**
 * Validates that a given 'object' matches a given 'schema'.
 * @param object An object to test the structure and type of against 'schema'.
 * @param schema The schema used to validate 'object'.
 * @param path Used within the implementation and can be ignored for external use.
 * @returns A validated and evaluated copy of 'object'.
 */
export function validate<Value extends SchemaValue>(object: any, schema: Value, path: string[] = []): Model<Value> {
    if (isTypeName(schema)) {
        // Validate value is of type typeName
        object = attemptConversion(object, schema);
        const suppliedType = getTypeName(object);
        if (suppliedType === schema || schema === 'any') {
            return object;
        }
        throw new ValidationError(
            `Wrong type at "${path.join('.')}". Expected "${schema}", got "${suppliedType}".`,
            'incorrect_type', object, path.join('.')
        );
    } else if (isItemSchema(schema)) {
        // Validate value matches itemSchema
        try {
            // @ts-ignore
            const model = validate(object, schema.type, path);
            if (model === undefined) {
                throw new ValidationError(
                    path.length > 0 ? `Missing required field at "${path.join('.')}".` : `Cannot validate "${object}."`,
                    'missing', object, path.join('.')
                );
            }
            return model;
        } catch (error) {
            if ('default' in schema) {
                if (typeof schema.default === 'function') {
                    return schema.default();
                }
                return schema.default;
            } else if (schema.required) {
                throw error;
            }
            // Field is not required
            return undefined as Model<Value>;
        }
    } else if (isArrayValueSchema(schema)) {
        // Validate value matches arrayValueSchema
        if (object === undefined || object === null) {
            if (isModelValueOptional(schema)) {
                return undefined as Model<Value>;
            } else {
                throw new ValidationError(
                    path.length > 0 ? `Missing required field at "${path.join('.')}".` : `Cannot validate "${object}."`,
                    'missing', object, path.join('.')
                );
            }
        }
        const validated: any[] = [];
        for (let i = 0; i < object.length; i++) {
            validated.push(validate(object[i], schema[0], [...path, i.toString()]));
        }
        return validated as Model<Value>;
    } else if (isSchema(schema)) {
        // Validate value matches schema
        if (object === undefined || object === null) {
            if (isModelValueOptional(schema)) {
                return undefined as Model<Value>;
            } else {
                throw new ValidationError(
                    path.length > 0 ? `Missing required field at "${path.join('.')}".` : `Cannot validate "${object}."`,
                    'missing', object, path.join('.')
                );
            }
        }
        const validated: any = {};
        for (const key in schema) {
            const schemaValue = validate(object[key], schema[key], [...path, key]);
            if (schemaValue !== undefined) {
                validated[key] = schemaValue;
            }
        }
        return validated as Model<Value>;
    } else {
        throw new Error('Invalid schema. Are all custom type names registered?');
    }
}

/**
 * Registers a type converter used for runtime type conversions during validation passes.
 *  
 * @param fromTypeName The name of the type to convert from.
 * @param toTypeName The name of the type to convert to.
 * @param conversionCallback A callback that can convert the type represented by 'fromTypeName' to the type represented by 'toTypeName'.
 */
export function registerTypeConversion<FromType, ToType>(
    fromTypeName: string, toTypeName: TypeName,
    conversionCallback: TypeConversionCallback<FromType, ToType>
) {
    if (!(fromTypeName in TYPE_CONVERSION_CALLBACK_MAP)) {
        TYPE_CONVERSION_CALLBACK_MAP[fromTypeName] = {};
    }
    TYPE_CONVERSION_CALLBACK_MAP[fromTypeName][toTypeName] = conversionCallback as any;
}

/**
 * Uses the registered type converters to attemp a conversion of 'value' to the type represented by 'toTypeName'.
 * 
 * @param value The value to attempt a type conversion on.
 * @param toTypeName The name of the desired output type.
 * @returns 'value' converted to the type represented by 'toTypeName' or undefined if there is no valid type converter.
 */
export function attemptConversion<FromType, ToTypeName extends TypeName>(value: FromType, toTypeName: ToTypeName): TypeMap[ToTypeName] | FromType {
    const fromTypeName = getTypeName(value);
    if (fromTypeName === toTypeName || toTypeName === 'any') {
        return value as TypeMap[ToTypeName];
    }
    if (!(fromTypeName in TYPE_CONVERSION_CALLBACK_MAP)) {
        return value;
    }
    const conversionFunction = TYPE_CONVERSION_CALLBACK_MAP[fromTypeName][toTypeName];
    if (conversionFunction === undefined) {
        return value;
    }
    return conversionFunction(value);
}

/**
 * Registers a valid type name for runtime validation. For all custom types, you must both register and decleration merge with TypeMap. 
 * @see TypeMap
 * @param typeName The name of a type.
 */
export function registerTypeName(typeName: string) {
    TYPE_NAMES.push(typeName);
}

function isTypeName(value: SchemaValue): value is TypeName {
    return typeof value === 'string' && TYPE_NAMES.includes(value);
}

function isArrayValueSchema(value: SchemaValue): value is [SchemaValue] {
    if (!Array.isArray(value)) {
        return false;
    }
    if (value.length !== 1) {
        return false;
    }
    if (!isSchemaValue(value[0])) {
        return false;
    }
    return true;
}

function isItemSchema(value: SchemaValue): value is ItemSchema {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    if (!('type' in value) || !('required' in value) || !isSchemaValue(value.type)) {
        return false;
    }
    return true;
}

function isSchema(value: any): value is Schema {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    for (const key in value) {
        if (!isSchemaValue(value[key])) {
            return false;
        }
    }
    return true;
}

function isSchemaValue(value: any): value is SchemaValue {
    return isTypeName(value) || isItemSchema(value) || isArrayValueSchema(value) || isSchema(value);
}

function isModelValueOptional(schema: SchemaValue): boolean {
    if (isItemSchema(schema)) {
        if (schema.required === true) {
            return false;
        } else {
            return schema.default === undefined ? true : false;
        }
    } else if (isArrayValueSchema(schema)) {
        return isModelValueOptional(schema[0]);
    } else if (isSchema(schema)) {
        for (const key in schema) {
            if (!isModelValueOptional(schema[key])) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}

/**
 * Determines the name of name of the type of 'value'.
 * @param value The value to determine the type name of. 
 * @returns The name of value's type.
 */
export function getTypeName(value: any): string {
    if (value instanceof Object) {
        if (Array.isArray(value)) {
            if (value.length === 0) {
                return 'any[]';
            } else {
                return getTypeName(value[0]) + '[]';
            }
        } else if (value.constructor.name) {
            return value.constructor.name;
        } else {
            return 'any';
        }
    }
    return value === null ? 'null' : typeof value;
}

/**
 * Represents and error that occures while validating an object.
 * @see validate
 */
export class ValidationError extends Error {

    private _type: string;
    private _data: object;
    private _path: string | null;

    /**
     * @param message The error message.
     * @param type The type of validation error.
     * @param path The path to the value that failed validation.
     * @param data The data that failed validation.
     */
    public constructor(message: string, type: string, data: any, path: string | null) {
        super(message);
        this._type = type;
        this._path = path;
        this._data = data;
    }

    public get type() { return this._type; }
    public get path() { return this._path; }
    public get data() { return this._data; }

}