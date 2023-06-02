export namespace Schema {

    const primitives = [
        "undefined",
        "boolean",
        "number",
        "bigint",
        "string",
        "symbol",
        "any",
        "Date"
    ];

    // from: to: converter
    const converters: ConverterMap = {
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
            any: (value) => JSON.parse(value),
            Date: (value) => new Date(value)
        },
        any: {
            string: (value) => JSON.stringify(value)
        },
        Date: {
            number: (value) => value.getTime(),
            bigint: (value) => BigInt(value.getTime()),
            string: (value) => value.toISOString()
        }
    };

    export interface Map {
        undefined: undefined
        boolean: boolean
        number: number
        bigint: bigint
        string: string
        symbol: symbol
        any: any
        Date: Date
    }

    export type Primitive = keyof Map;
    export type OrCompound = [Any, "or", Any];
    export type AndCompound = [Any, "and", Any];
    export type Meta = {
        type: Any,
        required: boolean,
        validate?: Validator<any>
        default?: any
    };
    export type Dynamic = { $: Any };
    export type Array = [Any];
    export type Hierarchy = { [Key: string]: Any };
    export type Any = Primitive | OrCompound | AndCompound | Meta | Dynamic | Array | Hierarchy;

    // to: from[]
    export interface ConversionMap {
        boolean: number | bigint | string,
        number: boolean | bigint | string | Date,
        bigint: number | string,
        string: boolean | number | bigint | any | Date,
        any: string,
        Date: number | bigint | string
    }

    export type Converter<From, To extends Primitive> = (fromType: From) => To;

    // from: to: converter
    type ConverterMap = {
        [FromTypeKey in keyof ConversionMap]: {
            [ToTypeKey in keyof Map]?: Converter<Map[FromTypeKey], Map[ToTypeKey]>
        }
    };

    export type Validator<Type> = (value: Type, data: any) => Type;

    export type Merge<ObjectA, ObjectB> = (
        keyof ObjectA extends never ? ObjectB :
        keyof ObjectB extends never ? ObjectA :
        ObjectA & ObjectB
    );

    export type MetaModel<Schema extends Meta> = (
        Schema["required"] extends false ?
        Model<Schema["type"]> | undefined :
        Model<Schema["type"]>
    );

    export type Model<Schema extends Schema.Any> = (
        [Schema] extends [Primitive] ? Map[Schema] :
        [Schema] extends [OrCompound] ? Model<Schema[0]> | Model<Schema[2]> :
        [Schema] extends [AndCompound] ? Model<Schema[0]> & Model<Schema[2]> :
        [Schema] extends [Meta] ? MetaModel<Schema> :
        [Schema] extends [Dynamic] ? { [Key: string]: Model<Schema["$"]> } :
        [Schema] extends [Array] ? Model<Schema[0]>[] :
        [Schema] extends [Hierarchy] ? Merge<
            { [Key in keyof Schema as Existant<Schema[Key]> extends true ? Key : never]: Model<Schema[Key]> },
            { [Key in keyof Schema as Existant<Schema[Key]> extends true ? never : Key]?: Model<Schema[Key]> }
        > :
        never
    );

    export type Source<Schema extends Schema.Any> = (
        [Schema] extends [Primitive] ? Schema extends keyof ConversionMap ? ConversionMap[Schema] | Map[Schema] : Map[Schema] :
        [Schema] extends [OrCompound] ? Source<Schema[0]> | Source<Schema[2]> :
        [Schema] extends [AndCompound] ? Source<Schema[0]> & Source<Schema[2]> :
        [Schema] extends [Meta] ? Source<Schema["type"]> :
        [Schema] extends [Dynamic] ? { [Key: string]: Source<Schema["$"]> } :
        [Schema] extends [Array] ? Source<Schema[0]>[] :
        [Schema] extends [Hierarchy] ? Merge<
            { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? never : Key]: Source<Schema[Key]> },
            { [Key in keyof Schema as Optionality<Schema[Key]> extends true ? Key : never]?: Source<Schema[Key]> }
        > :
        never
    );

    export type Existant<Schema extends Schema.Any> = (
        Schema extends Schema.Meta ? (Schema["required"] extends true ? true : (Schema extends { default: any } ? true : false)) :
        Schema extends Schema.Array ? Existant<Schema[0]> :
        true
    );

    export type Optionality<Schema extends Schema.Any> = (
        Schema extends Schema.Meta ? (Schema["required"] extends true ? (Schema extends { default: any } ? true : false) : true) :
        Schema extends Schema.Array ? Optionality<Schema[0]> :
        false
    );

    export function registerConverter<FromTypeName extends keyof ConversionMap, ToTypeName extends keyof Map>
        (fromTypeName: FromTypeName, toTypeName: ToTypeName, converter: Converter<Map[FromTypeName], Map[ToTypeName]>) {
        converters[fromTypeName][toTypeName] = converter;
    }

    export function registerPrimitive<TypeName extends keyof Map>(typeName: TypeName) {
        primitives.push(typeName);
    }

    export function isSchemaPrimitive(value: any): value is Schema.Primitive {
        return typeof value === "string" && primitives.includes(value);
    }

    export function isSchemaOrCompound(value: any): value is Schema.OrCompound {
        return Array.isArray(value) && value.length === 3 && isSchema(value[0]) && value[1] === "or" && isSchema(value[2]);
    }

    export function isSchemaAndCompound(value: any): value is Schema.OrCompound {
        return Array.isArray(value) && value.length === 3 && isSchema(value[0]) && value[1] === "and" && isSchema(value[2]);
    }

    export function isSchemaMeta(value: any): value is Schema.Meta {
        return typeof value === "object" && value !== null && isSchema(value.type) && typeof value.required === "boolean";
    }

    export function isSchemaDynamic(value: any): value is Schema.Dynamic {
        return typeof value === "object" && value !== null && isSchema(value.$);
    }

    export function isSchemaArray(value: any): value is Schema.Array {
        return Array.isArray(value) && value.length > 0 && value.every(isSchema);
    }

    export function isSchemaHierarchy(value: any): value is Schema.Hierarchy {
        return typeof value === "object" && value !== null && Object.values(value).every(isSchema);
    }

    export function isSchema(value: any): value is Schema.Any {
        return (
            isSchemaPrimitive(value) ||
            isSchemaOrCompound(value) ||
            isSchemaAndCompound(value) ||
            isSchemaDynamic(value) ||
            isSchemaMeta(value) ||
            isSchemaArray(value) ||
            isSchemaHierarchy(value)
        );
    }

    export function getType(value: any): string {
        return typeof value === "object" ? value.constructor.name : typeof value;
    }

    export function build<Schema extends Schema.Any>(schema: Schema): Schema {
        return schema;
    }

    export function validate<Schema extends Any>(schema: Schema, source: Source<Schema>): Model<Schema> {
        const result = _validate(schema, source, [], schema, source, !isSchemaOrCompound(schema) && !isSchemaAndCompound(schema));
        if (result instanceof ValidationError) {
            throw result;
        }
        return result;
    }

    function _validate(schema: any, source: any, path: string[], originalSchema: any, originalSource: any, convert: boolean = true): any {
        if (isSchemaPrimitive(schema)) {
            const sourceType = getType(source);
            if (sourceType === schema) {
                return source;
            } else if (sourceType === "object" && source !== null && source.constructor.name === schema) {
                return source;
            } else if (convert && sourceType in converters && schema in converters[sourceType as keyof ConverterMap]) {
                return (<Converter<any, any>>converters[sourceType as keyof ConverterMap][schema])(source);
            }
            const errorType = source === undefined || source === null ? "missing" : "incorrectType";
            return new ValidationError(errorType, schema, source, path, originalSchema, originalSource);
        } else if (isSchemaOrCompound(schema)) {
            const result = _validate(schema[0], source, path, originalSchema, originalSource, false);
            if (result instanceof ValidationError) {
                return _validate(schema[2], source, path, originalSchema, originalSource, false);
            }
            return result;
        } else if (isSchemaAndCompound(schema)) {
            const result = _validate(schema[2], source, path, originalSchema, originalSource);
            return _validate(schema[0], result, path, originalSchema, originalSource, false);
        } else if (isSchemaMeta(schema)) {
            if (schema.validate !== undefined) {
                source = schema.validate.call(originalSource, source, originalSource);
            }
            const result = _validate(schema.type, source, path, originalSchema, originalSource);
            if (result instanceof ValidationError) {
                if ("default" in schema) {
                    if (typeof schema.default === "function") {
                        return _validate(schema.type, schema.default(), path, originalSchema, originalSource);
                    } else {
                        return _validate(schema.type, schema.default, path, originalSchema, originalSource);
                    }
                } else if (schema.required) {
                    return result;
                }
                return undefined;
            }
            return result;
        } else if (isSchemaDynamic(schema)) {
            const validated: any = {};
            for (const key in source) {
                validated[key] = _validate(schema.$, source[key], path, originalSchema, originalSource) as never;
            }
            return validated;
        } else if (isSchemaArray(schema)) {
            if (Array.isArray(source)) {
                [schema] = schema;
                return source.map((item) => _validate(schema, item, path, originalSchema, originalSource));
            }
            const errorType = source === undefined || source === null ? "missing" : "incorrectType";
            throw new ValidationError(errorType, schema, source, path, originalSchema, originalSource);
        } else if (isSchemaHierarchy(schema)) {
            if (typeof source === "object" && source !== null) {
                const validated: any = {};
                for (const key in schema) {
                    const result = _validate(schema[key], source[key], [...path, key], originalSchema, originalSource);
                    if (result instanceof ValidationError) {
                        return result;
                    }
                    validated[key] = result;
                }
                return validated;
            }
            const errorType = source === undefined || source === null ? "missing" : "incorrectType";
            throw new ValidationError(errorType, schema, source, path, originalSchema, originalSource);
        } else {
            throw new ValidationError("invalidSchema", schema, source, path, originalSchema, originalSource);
        }
    }

    export function assert(condition: boolean, message?: string): asserts condition {
        if (!condition) {
            throw new Schema.Error(message);
        }
    }

    export type ValidationErrorType = "missing" | "incorrectType" | "invalidSchema" | "failedCustomValidator";

    export class Error extends globalThis.Error {

        public constructor(message?: string) {
            super(message);
        }

    }

    export class ValidationError extends Error {

        public readonly type: ValidationErrorType;
        public readonly source: any;
        public readonly schema: Schema.Any;
        public readonly originalSource: any;
        public readonly originalSchema: Schema.Any;
        public readonly path: string[];

        /**
         * @param message The error message.
         * @param type The type of validation error.
         * @param source The data that failed validation.
         * @param path The path to the value that failed validation.
         */
        public constructor(type: ValidationErrorType, schema: Schema.Any, source: any, path: string[], originalSchema: Schema.Any, originalSource: any) {
            super(ValidationError.getMessage(type, source, schema, path));
            this.name = this.constructor.name;
            this.type = type;
            this.source = source;
            this.schema = schema;
            this.originalSource = originalSource;
            this.originalSchema = originalSchema;
            this.path = path;
        }

        public static getExpectedString(schema: Schema.Any): string {
            if (isSchemaPrimitive(schema)) {
                return schema;
            } else if (isSchemaMeta(schema)) {
                return ValidationError.getExpectedString(schema.type);
            } else if (isSchemaArray(schema)) {
                return "array";
            } else if (isSchemaHierarchy(schema)) {
                return "hierarchical object";
            }
            return "unknown";
        }

        public static getMessage(type: ValidationErrorType, source: any, schema: Schema.Any, path: string[]): string {
            const sourceRepresentation = JSON.stringify(source);
            switch (type) {
                case "missing":
                    return path.length === 0 ?
                        `Attempted to validate "${sourceRepresentation}" as ${ValidationError.getExpectedString(schema)}.` :
                        `Missing required field "${path.join(".")}".`;
                case "incorrectType":
                    return (
                        `${getType(source)}${sourceRepresentation !== source ? ` (${sourceRepresentation})` : ""} failed validation as ` +
                        `${ValidationError.getExpectedString(schema)}${path.length === 0 ? "." : ` at path "${path.join(".")}".`}`
                    );
                case "failedCustomValidator":
                    return (
                        `${getType(source)}${sourceRepresentation !== source ? ` (${sourceRepresentation})` : ""} failed custom validation pass as ` +
                        `${ValidationError.getExpectedString(schema)}${path.length === 0 ? "." : ` at path "${path.join(".")}".`}`
                    );
                case "invalidSchema":
                    return "Invalid schema.";
                default:
                    return `Validation failed. Reason: ${type}`;
            }
        }

    }

}