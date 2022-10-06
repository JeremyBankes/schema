import { TypeMap } from './Schema.js';

export class TypeConverter<FromType, ToType extends TypeMap[keyof TypeMap]> {

    private _fromType: string;
    private _toType: string;

    public constructor(fromType: string, toType: string) {
        this._fromType = fromType;
        this._toType = toType;
    }

    public get fromType() { return this._fromType; }
    public get toType() { return this._toType; }

    public convert(value: FromType): ToType | null {
        throw new Error('Unimplemented.');
    }

}