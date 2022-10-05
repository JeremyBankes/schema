[Schema: API Reference](../README.md) / Schema

# Class: Schema

A static class for interacting with structured data.

## Table of contents

### Methods

- [create](Schema.md#create)
- [validate](Schema.md#validate)
- [validateArray](Schema.md#validatearray)

## Methods

### create

▸ `Static` **create**<`Schema`\>(`schema`): `Schema`

Allows you to define the structure of data. Required for validating an object with [validate](Schema.md#validate).

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends [`SchemaDefinition`](../README.md#schemadefinition) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `schema` | `Schema` | The structure of data. |

#### Returns

`Schema`

An meta object representing the structure of data.

#### Defined in

[source/Schema.ts:152](https://github.com/JeremyBankes/schema/blob/8dd1245/source/Schema.ts#L152)

___

### validate

▸ `Static` **validate**<`Schema`\>(`data`, `schema`): `Promise`<[`Model`](../README.md#model)<`Schema`\>\>

Ensures that 'data' matches the structure and typing of 'schema'.

**`Throws`**

A [SchemaValidationError](SchemaValidationError.md) if 'data' could not be validated as matching 'schema'.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends [`SchemaDefinition`](../README.md#schemadefinition) |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | ``null`` \| [`ModelDefinition`](../README.md#modeldefinition)<`Schema`\> | The data to be validated. |
| `schema` | `Schema` | The structure of 'data'. |

#### Returns

`Promise`<[`Model`](../README.md#model)<`Schema`\>\>

Validated 'data'.

#### Defined in

[source/Schema.ts:163](https://github.com/JeremyBankes/schema/blob/8dd1245/source/Schema.ts#L163)

___

### validateArray

▸ `Static` **validateArray**<`Schema`\>(`data`, `schema`): `Promise`<[`Model`](../README.md#model)<`Schema`\>[]\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Schema` | extends [`SchemaDefinition`](../README.md#schemadefinition) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`ModelDefinition`](../README.md#modeldefinition)<`Schema`\>[] |
| `schema` | `Schema` |

#### Returns

`Promise`<[`Model`](../README.md#model)<`Schema`\>[]\>

#### Defined in

[source/Schema.ts:270](https://github.com/JeremyBankes/schema/blob/8dd1245/source/Schema.ts#L270)
