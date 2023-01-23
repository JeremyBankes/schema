import { build, Model, Source, validate } from "./Schema.js";

const CowSchema = build({
    name: "string",
    numberOfSpots: { type: "number", required: true, default: 0 }
});

type Cow = Model<typeof CowSchema>;
type CowSource = Source<typeof CowSchema>;

const cow = validate({
    name: "Betty"
}, CowSchema);

console.log(cow.numberOfSpots);