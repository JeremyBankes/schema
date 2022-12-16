Schema: API Reference

# Schema: API Reference

## Table of contents

### Interfaces

- [TypeMap](interfaces/TypeMap.md)

### Type Aliases

- [TypeConversionCallback](README.md#typeconversioncallback)
- [Schema](README.md#schema)
- [Model](README.md#model)

### Functions

- [build](README.md#build)
- [validate](README.md#validate)
- [registerTypeConversion](README.md#registertypeconversion)
- [attemptConversion](README.md#attemptconversion)
- [registerTypeName](README.md#registertypename)
- [getTypeName](README.md#gettypename)

### Classes

- [ValidationError](classes/ValidationError.md)

## Type Aliases

### TypeConversionCallback

Ƭ **TypeConversionCallback**<`FromType`, `ToType`\>: (`value`: `FromType`) => `ToType`

#### Type parameters

| Name |
| :------ |
| `FromType` |
| `ToType` |

#### Type declaration

▸ (`value`): `ToType`

A callback that converts a given value to a different type.

##### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `FromType` |

##### Returns

`ToType`

#### Defined in

[source/Schema.ts:64](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L64)

___

### Schema

Ƭ **Schema**: `Object`

A hierarchy of SchemaValues that represent the structure of an object.

**`See`**

SchemaValue

#### Index signature

▪ [Key: `string`]: `SchemaValue`

#### Defined in

[source/Schema.ts:80](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L80)

___

### Model

Ƭ **Model**<`Value`\>: `Value` extends `TypeName` ? [`TypeMap`](interfaces/TypeMap.md)[`Value`] : `Value` extends `ItemSchema` ? `IsModelValueOptional`<`Value`\> extends ``true`` ? [`Model`](README.md#model)<`Value`[``"type"``]\> \| `undefined` : [`Model`](README.md#model)<`Value`[``"type"``]\> : `Value` extends [`SchemaValue`] ? [`Model`](README.md#model)<`Value`[``0``]\>[] : `Value` extends [`Schema`](README.md#schema) ? { [Key in keyof Value as IsModelValueOptional<Value[Key]\> extends true ? never : Key]: Model<Value[Key]\> } & { [Key in keyof Value as IsModelValueOptional<Value[Key]\> extends true ? Key : never]?: Model<Value[Key]\> } : ``"Error: Value not a handled SchemaValue"``

Represents the typing for an object that has been validated to match a SchemaValue

**`See`**

SchemaValue

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Value` | extends `SchemaValue` |

#### Defined in

[source/Schema.ts:96](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L96)

## Functions

### build

▸ **build**<`Definition`\>(`schema`): `Definition`

Used to define a metadata object that represents the structure and typing of an object.

**`See`**

Schema

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Definition` | extends [`Schema`](README.md#schema) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `Definition` | The metadata describing an object. |

#### Returns

`Definition`

A schema that can be used to validate an object with [validate](README.md#validate).

#### Defined in

[source/Schema.ts:150](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L150)

___

### validate

▸ **validate**<`Value`\>(`object`, `schema`, `path?`): [`Model`](README.md#model)<`Value`\>

Validates that a given 'object' matches a given 'schema'.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Value` | extends `SchemaValue` |

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `object` | `any` | `undefined` | An object to test the structure and type of against 'schema'. |
| `schema` | `Value` | `undefined` | The schema used to validate 'object'. |
| `path` | `string`[] | `[]` | Used within the implementation and can be ignored for external use. |

#### Returns

[`Model`](README.md#model)<`Value`\>

A validated and evaluated copy of 'object'.

#### Defined in

[source/Schema.ts:161](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L161)

___

### registerTypeConversion

▸ **registerTypeConversion**<`FromType`, `ToType`\>(`fromTypeName`, `toTypeName`, `conversionCallback`): `void`

Registers a type converter used for runtime type conversions during validation passes.

#### Type parameters

| Name |
| :------ |
| `FromType` |
| `ToType` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fromTypeName` | `string` | The name of the type to convert from. |
| `toTypeName` | keyof [`TypeMap`](interfaces/TypeMap.md) | The name of the type to convert to. |
| `conversionCallback` | [`TypeConversionCallback`](README.md#typeconversioncallback)<`FromType`, `ToType`\> | A callback that can convert the type represented by 'fromTypeName' to the type represented by 'toTypeName'. |

#### Returns

`void`

#### Defined in

[source/Schema.ts:246](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L246)

___

### attemptConversion

▸ **attemptConversion**<`FromType`, `ToTypeName`\>(`value`, `toTypeName`): [`TypeMap`](interfaces/TypeMap.md)[`ToTypeName`] \| `FromType`

Uses the registered type converters to attemp a conversion of 'value' to the type represented by 'toTypeName'.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `FromType` | `FromType` |
| `ToTypeName` | extends keyof [`TypeMap`](interfaces/TypeMap.md) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `FromType` | The value to attempt a type conversion on. |
| `toTypeName` | `ToTypeName` | The name of the desired output type. |

#### Returns

[`TypeMap`](interfaces/TypeMap.md)[`ToTypeName`] \| `FromType`

'value' converted to the type represented by 'toTypeName' or undefined if there is no valid type converter.

#### Defined in

[source/Schema.ts:263](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L263)

___

### registerTypeName

▸ **registerTypeName**(`typeName`): `void`

Registers a valid type name for runtime validation. For all custom types, you must both register and decleration merge with TypeMap.

**`See`**

TypeMap

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `typeName` | `string` | The name of a type. |

#### Returns

`void`

#### Defined in

[source/Schema.ts:283](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L283)

___

### getTypeName

▸ **getTypeName**(`value`): `string`

Determines the name of name of the type of 'value'.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `value` | `any` | The value to determine the type name of. |

#### Returns

`string`

The name of value's type.

#### Defined in

[source/Schema.ts:356](https://github.com/jeremybankes/schema/blob/debf27d/source/Schema.ts#L356)
