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
