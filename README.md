# Schema
A schema module for both runtime _and_ compile-time data structure validation and type-checking.

This package is particularly useful when you're expecting data to be in a certain format, but are not entirely certain about it until runtime. I.E. requesting information from a web API, reading JSON from a file, or even working with a JavaScript libraries that returns objects without typings.

It allows you to define a Schema once and immediately receive the benefit of type-checking as you develop as well as providing runtime validation for the data you're working with.

## Overview

### Our Example
In this example, we will create a schema for a "Person" object, and validate some data against this schema.

### Creating a Schema
A schema defines the structure and types of an object. Below we define a schema for a "Person".

```typescript
const PersonSchema = Schema.create({
    name: {
        type: "string",
        required: true
    },
    contact: {
        email: {
            type: "string",
            required: false
        },
        phone: {
            type: "string",
            required: false
        }
    },
    birthDate: {
        type: "Date",
        required: true
    },
    personalMotto: {
        type: "string",
        required: false,
        default: "I don't have a motto!"
    }
});
```
`PersonSchema` is now an object that represents how a person should be structured. Let's try introducing some real data now.

### Validating Data with Your Schema
Let's say we have some data that we think should be a Person, but until runtime, we're not actually certain. This is what `ambiguousPersonData` is below.
```typescript
const ambiguousPersonData: any = { ... };
const person = await Schema.validate(ambiguousPersonData, PersonSchema);
```
We've been returned a `person` object by our validation pass that will have the type `Model<typeof PersonSchema>`. If validation fails, a `SchemaValidationError` will be raised. If not, we can now assume that `person` matches our desired `PersonSchema`, allowing our IDE to assist us with type-checking.

### Things to Note
- **Arrays**: The usage of arrays in `SchemaDefinition`s can be denoted with the use of square brackets (`[]`) around any type you would usually use.

```typescript
const MovieSchema = Schema.create({
    name: {
        type: "string",
        required: true
    },
    actors: {
        type: ["string"], // <- Note the square brackets.
        default: []
    }
});

const movie = await Schema.validate({
    name: 'Gladiator',
    actors: ['Russell Crowe', 'Joaquin Phoenix', 'Connie Nielsen']
}, MovieSchema);
```

- **Nested Optionality**: Because all properties in `person.contact` are optional (`required: false` in our `PersonSchema`), `person.contact` itself is optional (Can be `undefined`).

- **Accessing Required & Default Fields**: `personalMotto` is also optional, so can be left out in our data to validated (`ambiguousPersonData` in our example). However because it has a `default` value, the property will always be present after validation (never `undefined`). This will be reflected by your IDE's type-checking.

- **Default Value Evaluation**: The `default` property in `SchemaDefinition`s can be set to a desired default value, a function that returns a default value, or a Promise of a default value (therefore an async function as well).



### Putting it All Together

```typescript
import { Model, Schema } from "./Schema.js";

const PersonSchema = Schema.create({
    name: {
        type: "string",
        required: true
    },
    contact: {
        email: {
            type: "string",
            required: false
        },
        phone: {
            type: "string",
            required: false
        }
    },
    birthDate: {
        type: "Date",
        required: true
    },
    personalMotto: {
        type: "string",
        required: false,
        default: "I don't have a motto!"
    }
});

const ambiguousPersonData: any = { ... };
const person = await Schema.validate(ambiguousPersonData, PersonSchema);

console.log(`Hello, ${person.name}!`);
console.log(`Your motto is: ${person.personalMotto}`);
if (person.contact?.email !== undefined) {
    console.log(`Your email: ${person.contact.email}`);
} else {
    console.log("You haven't supplied an email!");
}
```

---
[View API Reference](documents/api/README.md) for more details.