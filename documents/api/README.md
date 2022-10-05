Schema: API Reference

# Schema: API Reference

## Table of contents

### Interfaces

- [TypeMap](interfaces/TypeMap.md)

### Type Aliases

- [SchemaDefinition](README.md#schemadefinition)
- [ModelDefinition](README.md#modeldefinition)
- [Model](README.md#model)

### Classes

- [SchemaValidationError](classes/SchemaValidationError.md)
- [Schema](classes/Schema.md)

## Type Aliases

### SchemaDefinition

Ƭ **SchemaDefinition**: `Object`

Represents a definition of a schema.

#### Index signature

▪ [SchemaDefinitionKey: `string`]: `SchemaItem` \| [`SchemaDefinition`](README.md#schemadefinition)

#### Defined in

[source/Schema.ts:17](https://github.com/JeremyBankes/schema/blob/6d6cf59/source/Schema.ts#L17)

___

### ModelDefinition

Ƭ **ModelDefinition**<`Definition`\>: { [Key in keyof Definition as IsValueRequired<Definition[Key]\> extends true ? Key : never]: ModelItemType<Definition[Key], true\> } & { [Key in keyof Definition as IsValueRequired<Definition[Key]\> extends false ? Key : never]?: ModelItemType<Definition[Key], true\> }

Typing for inline data that matches a Definition.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Definition` | extends [`SchemaDefinition`](README.md#schemadefinition) |

#### Defined in

[source/Schema.ts:100](https://github.com/JeremyBankes/schema/blob/6d6cf59/source/Schema.ts#L100)

___

### Model

Ƭ **Model**<`Definition`\>: { [Key in keyof Definition as IsValuePresent<Definition[Key]\> extends true ? Key : never]: ModelItemType<Definition[Key], false\> } & { [Key in keyof Definition as IsValuePresent<Definition[Key]\> extends false ? Key : never]?: ModelItemType<Definition[Key], false\> }

Typing for data that has been validated as matching a Definition.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `Definition` | extends [`SchemaDefinition`](README.md#schemadefinition) |

#### Defined in

[source/Schema.ts:108](https://github.com/JeremyBankes/schema/blob/6d6cf59/source/Schema.ts#L108)
