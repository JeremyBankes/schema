export interface PrimitiveMap {
    undefined: undefined,
    boolean: boolean,
    number: number,
    bigint: bigint,
    string: string,
    symbol: symbol,
    object: object,
    Date: Date
}

type Primitives = PrimitiveMap[keyof PrimitiveMap];

// to: from[]
export interface ConversionMap {
    boolean: number | bigint | string,
    number: boolean | bigint | string | Date,
    bigint: number | string,
    string: boolean | number | bigint | object | Date,
    object: string,
    Date: number | bigint | string
}

type Converter<From, To extends Primitives> = (fromType: From) => To;

type ConverterMap = {
    [FromTypeKey in keyof ConversionMap]: {
        [ToTypeKey in keyof PrimitiveMap]?: Converter<PrimitiveMap[FromTypeKey], PrimitiveMap[ToTypeKey]>
    }
};

export namespace Schema {
    export type Primitive = keyof PrimitiveMap;
    export type Meta = {
        type: All,
        required: boolean,
        default?: any
    };
    export type Array = [All];
    export type Hierarchy = { [Key: string]: All };
    export type All = Primitive | Meta | Array | Hierarchy;
}

// If you're wondering while I'm wrapping my types in Tuples, me too.
// https://stackoverflow.com/questions/75188805/how-should-one-avoid-excessively-deep-type-instantiation-when-attemping-to-creat
export type Model<Schema extends Schema.All> = (
    [Schema] extends [Schema.Primitive] ? PrimitiveMap[Schema] :
    [Schema] extends [Schema.Meta] ? Model<Schema["type"]> :
    [Schema] extends [Schema.Array] ? Model<Schema[0]>[] :
    [Schema] extends [Schema.Hierarchy] ? (
        { [Key in keyof Schema as Existant<Schema[Key]> extends true ? Key : never]: Model<Schema[Key]> } &
        { [Key in keyof Schema as Existant<Schema[Key]> extends true ? never : Key]?: Model<Schema[Key]> }
    ) :
    never
);

export type Source<Schema extends Schema.All> = (
    [Schema] extends [Schema.Primitive] ? (
        [Schema] extends [keyof ConversionMap] ? ConversionMap[Schema] | PrimitiveMap[Schema] : PrimitiveMap[Schema]
    ) :
    [Schema] extends [Schema.Meta] ? Source<Schema["type"]> :
    [Schema] extends [Schema.Array] ? Source<Schema[0]>[] :
    [Schema] extends [Schema.Hierarchy] ? (
        { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? never : Key]: Source<Schema[Key]> } &
        { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? Key : never]?: Source<Schema[Key]> }
    ) :
    never
);

type Existant<Schema extends Schema.All> = (
    Schema extends Schema.Meta ? (Schema["required"] extends true ? true : (Schema extends { default: any } ? true : false)) :
    Schema extends Schema.Array ? Existant<Schema[0]> :
    Schema extends Schema.Hierarchy ? { [Key in keyof Schema]: Existant<Schema[Key]> } extends { [Key in keyof Schema]: false } ? false : true :
    true
);

type Optionality<Schema extends Schema.All> = (
    Schema extends Schema.Meta ? (Schema["required"] extends true ? (Schema extends { default: any } ? true : false) : true) :
    Schema extends Schema.Array ? Optionality<Schema[0]> :
    Schema extends Schema.Hierarchy ? { [Key in keyof Schema]: Optionality<Schema[Key]> } extends { [Key in keyof Schema]: false } ? false : true :
    false
);

const PRIMITIVES = [
    "undefined",
    "boolean",
    "number",
    "bigint",
    "string",
    "symbol",
    "object",
    "Date"
];

const CONVERTERS: ConverterMap = {
    boolean: {
        number: (value) => value ? 1 : 0,
        bigint: (value) => value ? 1n : 0n,
        string: (value) => value ? "true" : "false"
    },
    number: {
        boolean: (value) => value === 0 ? false : true,
        bigint: (value) => BigInt(value),
        string: (value) => value.toString(),
        Date: (value) => new Date(value)
    },
    bigint: {
        number: (value) => Number(value),
        string: (value) => value.toString()
    },
    string: {
        boolean: (value) => value === "false" ? false : Boolean(value),
        number: (value) => parseFloat(value),
        bigint: (value) => BigInt(value),
        object: (value) => JSON.parse(value),
        Date: (value) => new Date(value)
    },
    object: {
        string: (value) => JSON.stringify(value)
    },
    Date: {
        number: (value) => value.getTime(),
        bigint: (value) => BigInt(value.getTime()),
        string: (value) => value.toISOString()
    }
};

export function registerConverter<FromTypeName extends keyof ConversionMap, ToTypeName extends keyof PrimitiveMap>
    (fromTypeName: FromTypeName, toTypeName: ToTypeName, converter: Converter<PrimitiveMap[FromTypeName], PrimitiveMap[ToTypeName]>) {
    // @ts-expect-error
    CONVERTERS[fromTypeName][toTypeName] = converter;
}

export function registerPrimitive<TypeName extends keyof PrimitiveMap>(typeName: TypeName) {
    PRIMITIVES.push(typeName);
}

function isSchemaPrimitive(value: any): value is Schema.Primitive {
    if (typeof value !== "string") {
        return false;
    }
    return PRIMITIVES.includes(value);
}

function isSchemaMeta(value: any): value is Schema.Meta {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    return isSchema(value.type) && typeof value.required === "boolean";
}

function isSchemaArray(value: any): value is Schema.Array {
    if (typeof value !== "object" || !Array.isArray(value) || value.length !== 1) {
        return false;
    }
    return isSchema(value[0]);
}

function isSchemaHierarchy(value: any): value is Schema.Hierarchy {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    for (const key in value) {
        if (!isSchema(value[key])) {
            return false;
        }
    }
    return true;
}

function isSchema(value: any): boolean {
    return isSchemaPrimitive(value) || isSchemaMeta(value) || isSchemaArray(value) || isSchemaHierarchy(value);
}

function isOptional<Schema extends Schema.All>(schema: Schema): boolean {
    if (isSchemaPrimitive(schema)) {
        return false;
    } if (isSchemaMeta(schema)) {
        return !schema.required || "default" in schema;
    } else if (isSchemaArray(schema)) {
        return isOptional(schema[0]);
    } else if (isSchemaHierarchy(schema)) {
        for (const key in schema) {
            if (!isOptional(schema[key])) {
                return false;
            }
        }
        return true;
    } else {
        throw new Error("Invalid schema.");
    }
}

export function build<Layout extends Schema.All>(schema: Layout): Layout {
    return schema;
}

export function validate<Schema extends Schema.All>(source: Source<Schema>, schema: Schema): Model<Schema> {
    return _validate(source, schema, []) as Model<Schema>;
}

function _validate(source: any, schema: Schema.All, path: string[]): any {
    if (isSchemaPrimitive(schema)) {
        const sourceType = typeof source;
        if (sourceType !== schema) {
            if (!(source instanceof Object) || source.constructor.name !== schema) {
                if (sourceType in CONVERTERS) {
                    let fromSourceTypeConverters;
                    if (source instanceof Object) {
                        fromSourceTypeConverters = CONVERTERS[source.constructor.name as keyof ConverterMap];
                    }
                    if (fromSourceTypeConverters === undefined) {
                        fromSourceTypeConverters = CONVERTERS[sourceType as keyof ConverterMap];
                    }
                    if (fromSourceTypeConverters !== undefined) {
                        const converter = fromSourceTypeConverters[schema] as Converter<any, any>;
                        if (converter !== undefined) {
                            return converter(source);
                        }
                    }
                }
                throw new ValidationError(source === undefined ? "missing" : "incorrectType", source, schema, path);
            }
        }
        return source;
    } else if (isSchemaMeta(schema)) {
        try {
            return _validate(source, schema.type, path);
        } catch (error) {
            if (error instanceof ValidationError) {
                if ("default" in schema) {
                    if (typeof schema.default === "function") {
                        return _validate(schema.default(), schema.type, path);
                    } else {
                        return _validate(schema.default, schema.type, path);
                    }
                } else if (schema.required) {
                    throw error;
                }
            }
            throw error;
        }
    } else if (isSchemaArray(schema)) {
        if (!Array.isArray(source)) {
            throw new ValidationError("incorrectType", source, schema, path);
        }
        const validated: any = [];
        for (let i = 0; i < source.length; i++) {
            validated[i] = _validate(source[i], schema[0], [...path, i.toString()]);
        }
        return validated;
    } else if (isSchemaHierarchy(schema)) {
        if (typeof source !== "object" || source === null) {
            throw new ValidationError("incorrectType", source, schema, path);
        }
        const validated: any = {};
        for (const key in schema) {
            try {
                if (!(key in source) && isOptional(schema[key]) && isSchemaHierarchy(schema[key])) {
                    source[key] = {};
                }
                validated[key] = _validate(source[key], schema[key], [...path, key]);
            } catch (error) {
                if (!(error instanceof ValidationError) || !isOptional(schema[key])) {
                    throw error;
                }
            }
        }
        return validated;
    } else {
        throw new Error("Invalid schema.");
    }
}

export type ValidationErrorType = "missing" | "incorrectType";

export class ValidationError extends Error {

    private _type: ValidationErrorType;
    private _source: any;
    private _schema: Schema.All;
    private _path: string[];

    /**
     * @param message The error message.
     * @param type The type of validation error.
     * @param source The data that failed validation.
     * @param path The path to the value that failed validation.
     */
    public constructor(type: ValidationErrorType, source: any, schema: Schema.All, path: string[]) {
        super(ValidationError._buildMessage(type, source, schema, path));
        this.name = this.constructor.name;
        this._type = type;
        this._source = source;
        this._schema = schema;
        this._path = path;
    }

    public get type() { return this._type; }
    public get path() { return this._path; }
    public get schema() { return this._schema; }
    public get data() { return this._source; }

    private static _getExpected(schema: Schema.All): string {
        if (isSchemaPrimitive(schema)) {
            return schema;
        } else if (isSchemaMeta(schema)) {
            return ValidationError._getExpected(schema.type);
        } else if (isSchemaArray(schema)) {
            return "array";
        } else if (isSchemaHierarchy(schema)) {
            return "object";
        }
        return "unknown";
    }

    private static _buildMessage(type: ValidationErrorType, data: any, schema: Schema.All, path: string[]): string {
        if (path.length === 0) {
            return `Attempted to validate ${JSON.stringify(data)}`;
        }
        switch (type) {
            case "missing":
                return `Missing required field "${path.join(".")}".`;
            case "incorrectType":
                return `Field "${path.join(".")}" has the wrong type. Expected ${ValidationError._getExpected(schema)}, got ${JSON.stringify(data)}.`;
            default:
                return `Validation failed. Reason: ${type}`;
        }
    }

}