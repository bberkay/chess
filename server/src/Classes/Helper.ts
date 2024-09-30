/**
 * Create a random id that consist of numbers with the 
 * given length
 */
export function createRandomId(length: number): string {
    let result = '';
    const characters = '0123456789';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

/**
 * Check if the given value's length is equal to the given length.
 */
export function isValidLength(value: string, length: number): boolean {
    return value.length === length;
}

/**
 * Check if the given value is in the given range.
 */
export function isInRange(value: number, min: number, max: number): boolean {
    return !isNaN(value) && value >= min && value <= max;
}

/**
 * Update the keys of the first dictionary with the keys of the second dictionary.
 * @example updateKeys({a: 1, b: 2}, {a: 3, c: 4}) => {a: 3, b: 2}
 * @example updateKeys({}, {a: 3, c: 4}) => {a: 3, c: 4}
 * @example updateKeys({a: 1, b: 2}, {}) => {a: 1, b: 2}
 * @example updateKeys({}, {}) => {}
 * @example updateKeys({name: "", surname: ""}, {name: "Alex", age: 20}) => {name: "Alex", surname: ""}
 */
export function updateKeys(dict1: {[key: string]: any}, dict2: {[key: string]: any}): {[key: string]: any} {
    if(Object.keys(dict1).length === 0){
        dict1 = dict2;
        return dict1;
    }

    if(Object.keys(dict2).length === 0)
        return dict1;

    for(const key in dict2){
        if(dict1.hasOwnProperty(key))
            dict1[key] = dict2[key];
    }

    return dict1;
}
