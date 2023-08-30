/**
 * This static class provides a way to store data in a layered way in local storage.
 */
export class CacheManager
{
    // Singleton instance.
    private static instance: CacheManager;

    // Name of the layer.
    private layer: string = "Game";

    /**
     * Constructor of the CacheManager class.
     */
    private constructor()
    {}

    /**
     * Returns the singleton instance of the CacheManager class.
     */
    public static getInstance(): CacheManager
    {
        if(!CacheManager.instance)
            CacheManager.instance = new CacheManager();

        return CacheManager.instance;
    }

    /**
     * Stores the data in the local storage.
     */
    public save(value: any): void
    {
        localStorage.setItem(this.layer, JSON.stringify(value));
    }

    /**
     * Returns the data from the local storage.
     */
    public load(): any | undefined
    {
        return JSON.parse(localStorage.getItem(this.layer)!);
    }

    /**
     * Checks if the layer is empty.
     */
    public isEmpty(): boolean
    {
        return this.load() === null;
    }

    /**
     * Clear layer
     */
    public clear(): void
    {
        localStorage.setItem(this.layer, JSON.stringify({}));
    }
}