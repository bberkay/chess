/**
 * This static class provides a way to store data in a layered way in local storage.
 */
export class Cacher
{
    // Name of the layer.
    private static storageName: string = "game";

    /**
     * Stores the data in the local storage.
     */
    public static save(value: any): void
    {
        localStorage.setItem(Cacher.storageName, JSON.stringify(value));
    }

    /**
     * Returns the data from the local storage.
     */
    public static load(): any | undefined
    {
        return JSON.parse(localStorage.getItem(Cacher.storageName)!);
    }

    /**
     * Checks if the layer is empty.
     */
    public static isEmpty(): boolean
    {
        return Cacher.load() === null || Object.keys(Cacher.load()).length === 0;
    }

    /**
     * Clear layer
     */
    public static clear(): void
    {
        localStorage.setItem(Cacher.storageName, JSON.stringify({}));
    }
}