import { build, validate } from "./Schema.js";

export {
    build, Model, registerTypeConversion, Schema, TypeConverter,
    TypeMap, validate, ValidationError
} from "./Schema.js";

const ItemSchema = build({
    type: { type: "string", required: true },
    name: { type: "string", required: true },
    weight: { type: "number", required: true }
});

const PersonSchema = build({
    name: {
        first: { type: "string", required: false },
        middle: { type: "string", required: false },
        last: { type: "string", required: false }
    },
    male: { type: "boolean", required: false },
    age: { type: "number", required: true },
    about: { type: "string", required: true, default: "Missing About :(" },
    backpack: { type: [ItemSchema], required: true }
});

const personData: any = {
    name: {
        first: "Jeremy",
        middle: "Alexander",
        last: "Bankes"
    },
    male: 43,
    age: '21',
    about: 'Titanium bikes and free-range cows.',
    backpack: [
        { type: "Food", name: "Apple", weight: 3 },
        { type: "Food", name: "Protein Shake", weight: 10 }
    ]
};

const person = validate(personData, PersonSchema);

console.log(person);