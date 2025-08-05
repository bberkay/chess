import { StoreKey } from ".";
import { StoreData } from "./types.ts";

/**
 * Expiration time for the local storage data.
 */
const EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * This static class provides the methods for storing and
 * retrieving data from the local storage.
 */
export class Store {
    private static expirationTime: number = EXPIRATION_TIME;

    /**
     * Stores the data in the local storage.
     */
    public static save<K extends StoreKey>(key: K, value: StoreData[K]): void {
        if(!Object.values(StoreKey).includes(key))
            throw new Error("");

        localStorage.setItem(
            key,
            JSON.stringify({
                value: value,
                expiration: new Date().getTime() + Store.expirationTime,
            })
        );
    }

    /**
     * Returns the data from the local storage.
     */
    public static load<K extends StoreKey>(key: K): StoreData[K] | null {
        return !Store.isExist(key)
            ? null
            : JSON.parse(localStorage.getItem(key)!).value as StoreData[K];
    }

    /**
     * Returns true if the local storage contains given key.
     */
    public static isExist(key: StoreKey): boolean {
        const data = localStorage.getItem(key);
        if (!data) return false;

        if (JSON.parse(data).expiration < new Date().getTime()) {
            Store.clear();
            return false;
        }

        return true;
    }

    /**
     * Clear the local storage.
     */
    public static clear(key: StoreKey | null = null): void {
        if (key !== null) localStorage.removeItem(key);
        else localStorage.clear();
    }
}
