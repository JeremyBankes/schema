[Schema: API Reference](../README.md) / ValidationError

# Class: ValidationError

Represents and error that occures while validating an object.

**`See`**

validate

## Hierarchy

- `Error`

  ↳ **`ValidationError`**

## Table of contents

### Properties

- [cause](ValidationError.md#cause)
- [name](ValidationError.md#name)
- [message](ValidationError.md#message)
- [stack](ValidationError.md#stack)

### Constructors

- [constructor](ValidationError.md#constructor)

### Accessors

- [type](ValidationError.md#type)
- [path](ValidationError.md#path)
- [data](ValidationError.md#data)

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

• **new ValidationError**(`message`, `type`, `data`, `path`)

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

[source/Schema.ts:388](https://github.com/JeremyBankes/schema/blob/2ee9e2c/source/Schema.ts#L388)

## Accessors

### type

• `get` **type**(): `string`

#### Returns

`string`

#### Defined in

[source/Schema.ts:395](https://github.com/JeremyBankes/schema/blob/2ee9e2c/source/Schema.ts#L395)

___

### path

• `get` **path**(): ``null`` \| `string`

#### Returns

``null`` \| `string`

#### Defined in

[source/Schema.ts:396](https://github.com/JeremyBankes/schema/blob/2ee9e2c/source/Schema.ts#L396)

___

### data

• `get` **data**(): `object`

#### Returns

`object`

#### Defined in

[source/Schema.ts:397](https://github.com/JeremyBankes/schema/blob/2ee9e2c/source/Schema.ts#L397)
