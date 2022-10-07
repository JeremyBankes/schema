[Schema: API Reference](../README.md) / SchemaValidationError

# Class: SchemaValidationError

## Hierarchy

- `Error`

  ↳ **`SchemaValidationError`**

## Table of contents

### Properties

- [cause](SchemaValidationError.md#cause)
- [name](SchemaValidationError.md#name)
- [message](SchemaValidationError.md#message)
- [stack](SchemaValidationError.md#stack)

### Constructors

- [constructor](SchemaValidationError.md#constructor)

### Accessors

- [type](SchemaValidationError.md#type)
- [path](SchemaValidationError.md#path)
- [data](SchemaValidationError.md#data)

## Properties

### cause

• `Optional` **cause**: `unknown`

#### Inherited from

Error.cause

#### Defined in

node_modules/typescript/lib/lib.es2022.error.d.ts:26

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1040

___

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1041

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1042

## Constructors

### constructor

• **new SchemaValidationError**(`message`, `type`, `data`, `path`)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | The error message. |
| `type` | `string` | - |
| `data` | `any` | The data that failed validation. |
| `path` | ``null`` \| `string` | The path to the value that failed validation. |

#### Overrides

Error.constructor

#### Defined in

[source/Schema.ts:22](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L22)

## Accessors

### type

• `get` **type**(): `string`

#### Returns

`string`

#### Defined in

[source/Schema.ts:29](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L29)

___

### path

• `get` **path**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Defined in

[source/Schema.ts:30](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L30)

___

### data

• `get` **data**(): `object`

#### Returns

`object`

#### Defined in

[source/Schema.ts:31](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L31)
