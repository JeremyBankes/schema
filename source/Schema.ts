/**
 * A mapping of names to their corresponding types.
 * Used for static analysis.
 */
export interface TypeMap {
    "string": string,
    "number": number,
    "boolean": boolean,
    "Date": Date,
    "any": any
}

/**
 * Typing for a function that converts a given value to a different type.
 */
export type TypeConverter<FromType, ToType> = (value: FromType) => ToType;

/**
 * A mapping of type converters.
 * A key in the first level hierarchy represents the type of source data.
 * A key in the second level hierarchy represents the type of converted data.
 */
type TypeConverterMap = (
    { [Key: string]: { [Key: string]: TypeConverter<any, any> } }
);

/**
 * Typing for possible validation error types.
 * @see ValidationError.type
 */
export type ValidationErrorType = "missing" | "incorrectType";

/**
 * Meta describing a single value within an object. Used extensively within Schemas.
 * @see Schema
 */
export type SchemaItem = {
    type: Schema,
    required: boolean,
    default?: any
};

/**
 * A hierarchy describing the structure of an object.
 */
export type SchemaHierarchy = { [Key: string]: Schema };

/**
 * An item that describes the structure, type or layout of data.
 */
export type Schema = keyof TypeMap | SchemaItem | [Schema] | SchemaHierarchy;

/**
 * Represents the typing for an object that has been validated to match the "Layout" Schema.
 * @see Schema
 */
export type Model<Layout extends Schema> = (
    Layout extends keyof TypeMap ? TypeMap[Layout] :
    Layout extends SchemaItem ? Model<Layout["type"]> :
    Layout extends [Schema] ? Model<Layout["0"]>[] :
    Layout extends SchemaHierarchy ? (
        { [Key in keyof Layout as Require<Layout[Key]> extends true ? Key : never]: Model<Layout[Key]> } &
        { [Key in keyof Layout as Require<Layout[Key]> extends true ? never : Key]?: Model<Layout[Key]> }
    ) :
    never
);

/**
 * Determines if a Schema is required.
 * By default values are not required unless otherwise specified in the meta of a SchemaItem.
 * @see SchemaItem
 * @see Schema
 */
type Require<Layout extends Schema> = (
    Layout extends SchemaItem ? (Layout["required"] extends true ? (Layout extends { default: any } ? false : true) : false) :
    Layout extends [Schema] ? Require<Layout[0]> :
    Layout extends SchemaHierarchy ? { [Key in keyof Layout]: Require<Layout[Key]> } extends { [Key in keyof Layout]: true } ? true : false :
    false
);

const TYPE_CONVERTER_MAP: TypeConverterMap = {
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
 * Used to define a metadata object that represents the structure and typing of an object. 
 * @see Schema
 * 
 * @param schema The metadata describing the structure and typing of an object.
 * @returns A schema that can be used to validate an object with the {@link validate} function.
 */
export function build<Layout extends Schema>(schema: Layout): Layout {
    return schema;
}

function validateByKeyOfTypeMap<Layout extends Schema>(value: any, schema: keyof TypeMap, path: string[]): Model<Layout> {
    const dataType = typeof value;
    if (dataType !== schema) {
        const converters = TYPE_CONVERTER_MAP[dataType];
        if (converters !== undefined) {
            const converter = converters[schema];
            if (converter !== undefined) {
                return converter(value);
            }
        }
        if (value === undefined) {
            throw new ValidationError("missing", value, schema, path);
        } else {
            throw new ValidationError("incorrectType", value, schema, path);
        }
    }
    return value;
}

function validateBySchemaItem<Layout extends Schema>(value: any, schema: SchemaItem, path: string[]): Model<Layout> {
    try {
        // @ts-ignore
        return validate(value, schema.type, path);
    } catch (error) {
        if (error instanceof ValidationError) {
            if ("default" in schema) {
                if (typeof schema.default === "function") {
                    return validate(schema.default(), schema.type, path);
                } else {
                    return validate(schema.default, schema.type, path);
                }
            } else if (schema.required) {
                throw error;
            }
        }
        throw error;
    }
}

function validateBySchemaArray<Layout extends Schema>(value: any, schema: [Schema], path: string[]): Model<Layout> {
    if (!Array.isArray(value)) {
        throw new ValidationError('incorrectType', value, schema, path);
    }
    const data: any = [];
    for (let i = 0; i < value.length; i++) {
        data[i] = validate(value[i], schema[0], [...path, i.toString()]);
    }
    return data;
}

function validateBySchemaHierarchy<Layout extends Schema>(value: any, schema: SchemaHierarchy, path: string[]): Model<Layout> {
    if (typeof value !== 'object' || value === null) {
        throw new ValidationError('incorrectType', value, schema, path);
    }
    const data: any = {};
    for (const key in schema) {
        try {
            data[key] = validate(value[key], schema[key], [...path, key]);
        } catch (error) {
            if (error instanceof ValidationError) {
                if (isRequired(schema[key])) {
                    throw error;
                }
            } else {
                throw error;
            }
        }
    }
    return data as Model<Layout>;
}

/**
 * Validates that a given 'value' matches a given 'schema' and evaluates any type conversions or defaults.
 * @see Schema
 * 
 * @param value A value to test the structure and type of against 'schema'.
 * @param schema The schema used to validate 'value'.
 * @param path Used within the implementation and can be ignored for external use.
 * @returns A validated and evaluated copy of 'value'
 */
export function validate<Layout extends Schema>(value: any, schema: Layout, path: string[] = []): Model<Layout> {
    if (isKeyOfTypeMap(schema)) {
        return validateByKeyOfTypeMap<Layout>(value, schema, path);
    } else if (isSchemaItem(schema)) {
        return validateBySchemaItem<Layout>(value, schema, path);
    } else if (isSchemaArray(schema)) {
        return validateBySchemaArray<Layout>(value, schema, path);
    } else if (isSchemaHierarchy(schema)) {
        return validateBySchemaHierarchy<Layout>(value, schema, path);
    } else {
        throw new Error(`Unsure how to interpret schema. ${JSON.stringify(schema)}`);
    }
}

function isKeyOfTypeMap(schema: Schema): schema is keyof TypeMap {
    return typeof schema === "string";
}

function isSchemaItem(schema: Schema): schema is SchemaItem {
    return typeof schema === "object" && !Array.isArray(schema) && typeof schema.required === "boolean" && isSchema(schema.type);
}

function isSchemaArray(schema: Schema): schema is [Schema] {
    return Array.isArray(schema) && isSchema(schema[0]);
}

function isSchemaHierarchy(schema: Schema): schema is SchemaHierarchy {
    return !isSchemaItem(schema);
}

function isSchema(value: any): value is Schema {
    return isKeyOfTypeMap(value) || isSchemaItem(value) || isSchemaArray(value) || isSchemaHierarchy(value);
}

function isRequired(schema: Schema): boolean {
    if (isSchemaItem(schema)) {
        return schema.required || schema.default;
    } else if (isSchemaArray(schema)) {
        return isRequired(schema[0]);
    } else if (isSchemaHierarchy(schema)) {
        for (const key in schema) {
            if (isRequired(schema[key])) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Registers a type converter used for runtime type conversions during validations with {@link validate}.
 *  
 * @param fromTypeName The name of the type to convert from.
 * @param toTypeName The name of the type to convert to.
 * @param conversionCallback A callback that can convert the type represented by 'fromTypeName' to the type represented by 'toTypeName'.
 */
export function registerTypeConversion<FromType, ToType>(fromTypeName: string, toTypeName: string, conversionCallback: TypeConverter<FromType, ToType>) {
    if (!(fromTypeName in TYPE_CONVERTER_MAP)) {
        TYPE_CONVERTER_MAP[fromTypeName] = {};
    }
    TYPE_CONVERTER_MAP[fromTypeName][toTypeName] = conversionCallback;
}

/**
 * Represents and error that occures while validating an object.
 * @see validate
 */
export class ValidationError extends Error {

    private _type: ValidationErrorType;
    private _data: object;
    private _schema: Schema;
    private _path: string[];

    /**
     * @param message The error message.
     * @param type The type of validation error.
     * @param data The data that failed validation.
     * @param path The path to the value that failed validation.
     */
    public constructor(type: ValidationErrorType, data: any, schema: Schema, path: string[]) {
        super(ValidationError._buildMessage(type, data, schema, path));
        this._type = type;
        this._path = path;
        this._schema = schema;
        this._data = data;
    }

    public get type() { return this._type; }
    public get path() { return this._path; }
    public get schema() { return this._schema; }
    public get data() { return this._data; }

    private static _buildMessage(type: ValidationErrorType, data: any, schema: Schema, path: string[]): string {
        if (path.length === 0) {
            return `Attempted to validate ${JSON.stringify(data)}`;
        }
        switch (type) {
            case "missing":
                return `Missing required field "${path.join(".")}".`;
            case "incorrectType":
                return `Field "${path.join(".")}" has the wrong type. Expected ${JSON.stringify(schema)}, got "${typeof data}".`;
            default:
                return `Validation failed. Reason: ${type}`;
        }
    }
}