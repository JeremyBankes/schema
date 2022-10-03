
export { Schema, TypeMap } from './Schema.js';

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

const ambiguousPersonData: any = {};
const person: Model<typeof PersonSchema> = await Schema.validate(ambiguousPersonData, PersonSchema);

console.log(`Hello, ${person.name}!`);
console.log(`Your motto is: ${person.personalMotto}`);
if (person.contact?.email !== undefined) {
    console.log(`Your email: ${person.contact.email}`);
} else {
    console.log("You haven't supplied an email!");
}