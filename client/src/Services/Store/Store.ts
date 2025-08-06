import { StoreError, StoreKey } from ".";
import { StoreData } from "./types.ts";
/**
 * Expiration time constant for stored data in milliseconds (7 days).
 */
const EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * Static class that provides methods for managing
 * data storage and retrieval in the browser's localStorage.
 * Data entries are automatically expired after a set duration.
 */
export class Store {
    private static expirationTime: number = EXPIRATION_TIME;

    /**
     * Saves a value in localStorage with the associated key,
     * along with an expiration timestamp.
     * Throws an error if the key is not defined in StoreKey enum.
     *
     * @param key - The storage key under which to save the data.
     * @param value - The value to be saved; type depends on the key.
     * @throws StoreError if the key is invalid.
     */
    public static save<K extends StoreKey>(key: K, value: StoreData[K]): void {
        if (!Object.values(StoreKey).includes(key))
            throw StoreError.factory.InvalidStoreKey(key);

        localStorage.setItem(
            key,
            JSON.stringify({
                value: value,
                expiration: new Date().getTime() + Store.expirationTime,
            })
        );
    }

    /**
     * Loads and returns the value stored under the given key.
     * Returns null if the key does not exist or the data has expired.
     *
     * @param key - The storage key to load data from.
     * @returns The stored value or null if not found or expired.
     */
    public static load<K extends StoreKey>(key: K): StoreData[K] | null {
        return !Store.isExist(key)
            ? null
            : JSON.parse(localStorage.getItem(key)!).value as StoreData[K];
    }

    /**
     * Checks if data exists and is still valid (not expired) for the given key.
     * Automatically clears the storage if the data has expired.
     *
     * @param key - The storage key to check.
     * @returns True if valid data exists, false otherwise.
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
     * Clears data from localStorage.
     * If a key is specified, only removes that key's data,
     * otherwise clears the entire localStorage.
     *
     * @param key - Optional specific key to clear.
     */
    public static clear(key: StoreKey | null = null): void {
        if (key !== null) localStorage.removeItem(key);
        else localStorage.clear();
    }
}
