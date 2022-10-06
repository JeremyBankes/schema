import { Text } from '@jeremy-bankes/toolbox';
import { TypeConverter } from './TypeConverter.js';

export class StringToNumberConverter extends TypeConverter<string, number> {

    public constructor() {
        super('string', 'number');
    }

    public convert(value: string): number | null {
        const number = parseInt(value);
        return isNaN(number) ? null : number;
    }

}

export class StringToDateConverter extends TypeConverter<string, Date> {

    public constructor() {
        super('string', 'Date');
    }

    public convert(value: string): Date | null {
        const formFormat = /[0-9]{4}-[0-9]{2}-[0-9]{2}/.test(value);
        return Text.toDate(value, formFormat);
    }

}

export class StringToBooleanConverter extends TypeConverter<string, boolean> {

    public constructor() {
        super('string', 'boolean');
    }

    public convert(value: string): boolean | null {
        if (value === '') return false;
        if (value === 'off') return false;
        if (value === 'false') return false;
        return true;
    }

}

export class StringToObjectConverter extends TypeConverter<string, any> {

    public constructor() {
        super('string', 'any');
    }

    public convert(value: string) {
        return JSON.stringify(value);
    }

}