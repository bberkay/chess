import { CacheLayer } from "../Types";

/**
 * This static class provides a way to store data in a layered way in local storage.
 */
export class CacheManager {
    /**
     * Stores the data in the local storage.
     */
    static save(layer: CacheLayer, value: any): void
    {
        localStorage.setItem(layer, JSON.stringify(value));
    }

    /**
     * Returns the data from the local storage.
     */
    static load(layer: CacheLayer): any | undefined
    {
        return JSON.parse(localStorage.getItem(layer)!);
    }

    /**
     * Checks if the layer is empty.
     */
    static isEmpty(layer: CacheLayer): boolean
    {
        return CacheManager.load(layer) === null;
    }

    /**
     * Clear layer
     */
    static clear(layer: CacheLayer): void
    {
        localStorage.setItem(layer, JSON.stringify({}));
    }
}