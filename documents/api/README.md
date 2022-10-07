Schema: API Reference

# Schema: API Reference

## Table of contents

### Classes

- [SchemaValidationError](classes/SchemaValidationError.md)

### Type Aliases

- [TypeMap](README.md#typemap)
- [Schema](README.md#schema)
- [Model](README.md#model)

### Functions

- [create](README.md#create)
- [build](README.md#build)
- [validate](README.md#validate)

## Type Aliases

### TypeMap

Ƭ **TypeMap**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `string` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| `Date` | `Date` |
| `any` | `any` |

#### Defined in

[source/Schema.ts:35](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L35)

___

### Schema

Ƭ **Schema**: `Object`

#### Index signature

▪ [Key: `string`]: `SchemaItem` \| [`Schema`](README.md#schema)

#### Defined in

[source/Schema.ts:53](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L53)

___

### Model

Ƭ **Model**<`Layout`, `IsDefinition`\>: { [Key in keyof Layout as IsKeyRequired<Key, Layout, IsDefinition\> extends true ? Key : never]: ModelValue<Key, Layout, IsDefinition\> } & { [Key in keyof Layout as IsKeyRequired<Key, Layout, IsDefinition\> extends true ? never : Key]?: ModelValue<Key, Layout, IsDefinition\> }

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Layout` | extends [`Schema`](README.md#schema) |
| `IsDefinition` | extends `boolean` = ``false`` |

#### Defined in

[source/Schema.ts:68](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L68)

## Functions

### create

▸ **create**<`Layout`\>(`schema`): `Layout`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Layout` | extends [`Schema`](README.md#schema) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `schema` | `Layout` |

#### Returns

`Layout`

#### Defined in

[source/Schema.ts:173](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L173)

___

### build

▸ **build**<`Layout`\>(`data`, `schema`): [`Model`](README.md#model)<`Layout`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Layout` | extends [`Schema`](README.md#schema) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`Model`](README.md#model)<`Layout`, ``true``\> |
| `schema` | `Layout` |

#### Returns

[`Model`](README.md#model)<`Layout`\>

#### Defined in

[source/Schema.ts:177](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L177)

___

### validate

▸ **validate**<`Layout`\>(`data`, `schema`): [`Model`](README.md#model)<`Layout`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Layout` | extends [`Schema`](README.md#schema) |

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `any` |
| `schema` | `Layout` |

#### Returns

[`Model`](README.md#model)<`Layout`\>

#### Defined in

[source/Schema.ts:181](https://github.com/JeremyBankes/schema/blob/3fe46d4/source/Schema.ts#L181)
