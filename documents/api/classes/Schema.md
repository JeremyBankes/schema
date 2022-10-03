[Schema: API Reference](../README.md) / Schema

# Class: Schema

A static class for interacting with structured data.

## Table of contents

### Methods

- [create](Schema.md#create)
- [validate](Schema.md#validate)

## Methods

### create

▸ `Static` **create**<`Schema`\>(`schema`): `Schema`

Allows you to define the structure of data. Required for validating an object with [validate](Schema.md#validate).

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends `SchemaDefinition` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `Schema` | The structure of data. |

#### Returns

`Schema`

An meta object representing the structure of data.

#### Defined in

Schema.ts:148

___

### validate

▸ `Static` **validate**<`Schema`\>(`data`, `schema`): `Promise`<`Model`<`Schema`\>\>

Ensures that 'data' matches the structure and typing of 'schema'.

**`Throws`**

A SchemaValidationError if 'data' could not be validated as matching 'schema'.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends `SchemaDefinition` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | ``null`` \| `ModelDefinition`<`Schema`\> | The data to be validated. |
| `schema` | `Schema` | The structure of 'data'. |

#### Returns

`Promise`<`Model`<`Schema`\>\>

Validated 'data'.

#### Defined in

Schema.ts:159
