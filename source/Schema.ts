import { TypeConverter } from './TypeConverter.js';
import * as Converters from './converters.js';

const converters: TypeConverter<any, any>[] = [
    new Converters.StringToNumberConverter(),
    new Converters.StringToDateConverter(),
    new Converters.StringToBooleanConverter(),
    new Converters.StringToObjectConverter()
];

export class SchemaValidationError extends Error {

    private _type: string;
    private _data: object;
    private _path: string | null;

    /**
     * @param message The error message.
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

export type TypeMap = {
    'string': string;
    'number': number;
    'boolean': boolean;
    'Date': Date;
    'any': any;
}

type TypeName = keyof TypeMap;

type SchemaItemType = TypeName | Schema | [SchemaItemType];

export type SchemaItem = {
    type: SchemaItemType,
    required: boolean,
    default?: any
};

export type Schema = {
    [Key: string]: SchemaItem | Schema
};

type ModelValue<Key extends keyof Layout, Layout extends Schema, IsDefinition extends boolean, Value = Layout[Key]> = (
    Value extends SchemaItem ? (
        ModelItemType<Value['type'], IsDefinition>
    ) :
    Value extends Schema ? (
        ModelItemType<Value, IsDefinition>
    ) : (
        never
    )
);

export type Model<Layout extends Schema, IsDefinition extends boolean = false> = (
    { [Key in keyof Layout as IsKeyRequired<Key, Layout, IsDefinition> extends true ? Key : never]: ModelValue<Key, Layout, IsDefinition> } &
    { [Key in keyof Layout as IsKeyRequired<Key, Layout, IsDefinition> extends true ? never : Key]?: ModelValue<Key, Layout, IsDefinition> }
);

type ModelItemType<Type extends SchemaItemType, IsDefinition extends boolean> = (
    Type extends TypeName ? (
        TypeMap[Type]
    ) :
    Type extends Schema ? (
        Model<Type, IsDefinition>
    ) :
    Type extends [SchemaItemType] ? (
        ModelItemType<Type[0], IsDefinition>[]
    ) : (
        never
    )
);

type IsKeyRequired<Key extends keyof Layout, Layout extends Schema, IsDefinition extends boolean, Value = Layout[Key]> = (
    Value extends SchemaItem ? (
        Value['required'] extends true ? (
            IsDefinition extends true ? (
                Value extends { default: any } ? false : true
            ) : (
                true
            )
        ) : (
            IsDefinition extends true ? (
                false
            ) : (
                Value extends { default: any } ? true : false
            )
        )
    ) :
    Value extends Schema ? (
        {
            [Key in keyof Value]: IsKeyRequired<Key, Value, IsDefinition> extends true ? true : never
        }[keyof Value] extends never ? false : true
    ) : (
        false
    )
);

function getTypeName(object: any): string {
    if (object instanceof Object) {
        if (Array.isArray(object)) {
            if (object.length === 0) {
                return 'any[]';
            } else {
                return getTypeName(object[0]) + '[]';
            }
        } else if (object.constructor.name) {
            return object.constructor.name;
        } else {
            return 'any';
        }
    }
    return object === null ? 'null' : typeof object;
}

function evaluateDefault(defaultValue: any): any {
    if (typeof defaultValue === 'function') {
        return defaultValue();
    } else {
        return defaultValue;
    }
}

function getModelItem<Layout extends Schema>(data: Model<Layout> | null, type: SchemaItemType): any {
    if (typeof type === 'string') {
        const receivedType = getTypeName(data);
        if (receivedType === type) {
            return data;
        } else {
            for (const converter of converters) {
                if (converter.fromType === receivedType && converter.toType === type) {
                    return converter.convert(data);
                }
            }
            return null;
        }
    } else if (Array.isArray(type)) {
        if (Array.isArray(data)) {
            return data.map(item => getModelItem(item, type[0]));
        } else {
            return null;
        }
    } else {
        try {
            return validate(data, type);
        } catch (error) {
            if (error instanceof SchemaValidationError) {
                return null;
            } else {
                throw error;
            }
        }
    }
}

function isSchemaItem(object: any): object is SchemaItem {
    return 'type' in object && 'required' in object;
}

export function create<Layout extends Schema>(schema: Layout): Layout {
    return schema;
}

export function build<Layout extends Schema>(data: Model<Layout, true>, schema: Layout): Model<Layout> {
    return validate(data, schema);
}

export function validate<Layout extends Schema>(data: any, schema: Layout): Model<Layout> {
    if (data === null) {
        throw new SchemaValidationError(`Missing data "${data}".`, 'missing', data, null);
    }
    for (const key in schema) {
        const schemaValue: SchemaItem | Schema = schema[key];
        const dataValue: any = key in data ? (data as any)[key] : null;
        if (isSchemaItem(schemaValue)) {
            const item = getModelItem(dataValue, schemaValue.type);
            if (item !== null) {
                data[key] = item;
            } else if (schemaValue.default !== undefined) {
                data[key] = evaluateDefault(schemaValue.default);
            } else if (schemaValue.required) {
                throw new SchemaValidationError(`Missing required key "${key}" in "${JSON.stringify(data)}".`, 'missing', data, key);
            }
        } else {
            validate(dataValue, schemaValue);
        }
    }
    return data as unknown as Model<Layout>;
}