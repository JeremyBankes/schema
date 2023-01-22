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

export interface Primitives {
    "undefined": undefined,
    "boolean": boolean,
    "number": number,
    "bigint": bigint,
    "string": string,
    "symbol": symbol,
    "object": object,
    "Date": Date
}

namespace Schema {
    export type Primitive = keyof Primitives;
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
    [Schema] extends [Schema.Primitive] ? Primitives[Schema] :
    [Schema] extends [Schema.Meta] ? Model<Schema["type"]> :
    [Schema] extends [Schema.Array] ? Model<Schema[0]>[] :
    [Schema] extends [Schema.Hierarchy] ? (
        { [Key in keyof Schema as Existant<Schema[Key]> extends true ? Key : never]: Model<Schema[Key]> } &
        { [Key in keyof Schema as Existant<Schema[Key]> extends true ? never : Key]?: Model<Schema[Key]> }
    ) :
    never
);

export type Source<Schema extends Schema.All> = (
    [Schema] extends [Schema.Primitive] ? Primitives[Schema] :
    [Schema] extends [Schema.Meta] ? Source<Schema["type"]> :
    [Schema] extends [Schema.Array] ? Source<Schema[0]>[] :
    [Schema] extends [Schema.Hierarchy] ? (
        { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? Key : never]?: Source<Schema[Key]> } &
        { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? never : Key]: Source<Schema[Key]> }
    ) :
    never
);

type Existant<Schema extends Schema.All> = (
    Schema extends Schema.Meta ? (Schema["required"] extends true ? true : (Schema extends { default: any } ? true : false)) :
    Schema extends Schema.Array ? Existant<Schema[0]> :
    Schema extends Schema.Hierarchy ? { [Key in keyof Schema]: Existant<Schema[Key]> } extends { [Key in keyof Schema]: false } ? false : true :
    false
);

type Optionality<Schema extends Schema.All> = (
    Schema extends Schema.Meta ? (Schema["required"] extends true ? (Schema extends { default: any } ? true : false) : true) :
    Schema extends Schema.Array ? Optionality<Schema[0]> :
    Schema extends Schema.Hierarchy ? { [Key in keyof Schema]: Optionality<Schema[Key]> } extends { [Key in keyof Schema]: false } ? false : true :
    false
);

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

export function validate<Schema extends Schema.All>(source: Source<Schema>, schema: Schema, path: string[] = []): Model<Schema> {
    if (isSchemaPrimitive(schema)) {
        if (typeof source !== schema) {
            if (!(source instanceof Object) || source.constructor.name !== schema) {
                throw new ValidationError("incorrectType", source, schema, path);
            }
        }
        return source as unknown as Model<Schema>;
    } else if (isSchemaMeta(schema)) {
        try {
            return validate<Schema>(source, schema.type as Schema, path) as unknown as Model<Schema>;
        } catch (error) {
            if (error instanceof ValidationError) {
                if ("default" in schema) {
                    if (typeof schema.default === "function") {
                        return validate<Schema>(schema.default(), schema.type as Schema, path) as Model<Schema>;
                    } else {
                        return validate<Schema>(schema.default, schema.type as Schema, path) as Model<Schema>;
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
            validated[i] = validate<Schema>(source[i], schema[0] as Schema, [...path, i.toString()]);
        }
        return validated as Model<Schema>;
    } else if (isSchemaHierarchy(schema)) {
        if (typeof source !== "object" || source === null) {
            throw new ValidationError("incorrectType", source, schema, path);
        }
        const validated: any = {};
        for (const key in schema) {
            try {
                if (!(key in source) && isOptional(schema[key]) && isSchemaHierarchy(schema[key])) {
                    (source as any)[key] = {} as any;
                }
                validated[key] = validate<Schema>((source as any)[key], schema[key] as Schema, [...path, key]);
            } catch (error) {
                if (!(error instanceof ValidationError) || !isOptional(schema[key])) {
                    throw error;
                }
            }
        }
        return validated as Model<Schema>;
    } else {
        throw new Error("Invalid schema.");
    }
}

export type ValidationErrorType = "missing" | "incorrectType";

export class ValidationError extends Error {

    private _type: ValidationErrorType;
    private _data: object;
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
        this._type = type;
        this._path = path;
        this._schema = schema;
        this._data = source;
    }

    public get type() { return this._type; }
    public get path() { return this._path; }
    public get schema() { return this._schema; }
    public get data() { return this._data; }

    private static _buildMessage(type: ValidationErrorType, data: any, schema: Schema.All, path: string[]): string {
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