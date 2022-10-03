[Schema: API Reference](../README.md) / SchemaValidationError

# Class: SchemaValidationError

An error that is thrown if supplied data does not pass validation.

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

• **new SchemaValidationError**(`message`, `path`, `data`)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `message` | `string` | The error message. |
| `path` | ``null`` \| `string` | The path to the value that failed validation. |
| `data` | `any` | The data that failed validation. |

#### Overrides

Error.constructor

#### Defined in

[source/Schema.ts:122](https://github.com/JeremyBankes/schema/blob/5d7f048/source/Schema.ts#L122)

## Accessors

### path

• `get` **path**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Defined in

[source/Schema.ts:128](https://github.com/JeremyBankes/schema/blob/5d7f048/source/Schema.ts#L128)

___

### data

• `get` **data**(): `string`

#### Returns

`string`

#### Defined in

[source/Schema.ts:132](https://github.com/JeremyBankes/schema/blob/5d7f048/source/Schema.ts#L132)