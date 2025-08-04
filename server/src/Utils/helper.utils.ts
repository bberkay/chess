/**
 * Get factorial of the given number.
 */
export function fact(n: number): number {
    let res = 1;
    for (let i = 1; i <= n; i++) {
        res *= i;
    }
    return res;
}

/**
 * Generates a random numeric ID string of the specified length.
 * Ensures the generated ID is not in the `notThis` list, retrying if needed.
 */
export function createRandomId(
    length: number,
    notThis: string | string[] | null = null,
): string {
    const MAX_RETRY = fact(length);
    const characters = "0123456789";
    notThis = typeof notThis === "string" ? [notThis] : notThis;

    const create = () => {
        let result: string = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        return result;
    }

    for (let i = 1; i <= MAX_RETRY; i++) {
        const randId = create();
        if (!notThis || !notThis.includes(randId)) {
            return randId;
        }
    }

    throw new Error(
        `Failed to generate a unique ID of length ${length} after ${MAX_RETRY} attempts.`
    );
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
export function updateKeys<T extends object, U extends object>(
    dict1: T,
    dict2: U
): T {
    if (Object.keys(dict1).length === 0) {
        dict1 = { ...dict1, ...dict2 };
        return dict1;
    }

    if (Object.keys(dict2).length === 0) return dict1;

    for (const key in dict2) {
        if (Object.hasOwn(dict1, key))
            (dict1 as Record<keyof U, unknown>)[key] = dict2[key as keyof U];
    }

    return dict1;
}

/**
 * Freeze the given object deeply so that it cannot be modified.
 * @param {T} obj - The object to freeze.
 * @returns {T} The frozen object.
 */
export function deepFreeze<T extends object>(obj: T): T {
    if (Array.isArray(obj)) {
        obj.forEach((item) => deepFreeze(item));
    } else {
        Object.keys(obj).forEach((key) => {
            if (
                typeof obj[key as keyof T] === "object" &&
                obj[key as keyof T] !== null
            ) {
                deepFreeze(obj[key as keyof T] as object);
            }
        });
    }

    return Object.freeze(obj);
}
