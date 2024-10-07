/**
 * Enum for the local storage keys.
 * Add new keys here.
 */
export enum LocalStorageKey{
    WelcomeShown = "welcomeShown",
    LastBoard = "lastBoard",
    LastAddedBot = "lastAddedBot",
    LastPlayerName = "lastPlayerName",
    LastLobbyConnection = "LastLobbyConnection",
    BoardEditorEnabled = "boardEditorEnabled",
    CustomAppearance = "customAppearance",
    Theme = "theme",
}

/**
 * This static class provides the methods for storing and 
 * retrieving data from the local storage.
 */
export class LocalStorage
{
    // Name of the layer.
    private static expirationTime: number = 1000 * 60 * 60 * 24 * 7; // 7 days

    /**
     * Stores the data in the local storage.
     */
    public static save(key: LocalStorageKey, value: any): void
    {
        localStorage.setItem(key, JSON.stringify({
            value: value,
            expiration: new Date().getTime() + LocalStorage.expirationTime
        }));
    }

    /**
     * Returns the data from the local storage.
     */
    public static load(key: LocalStorageKey): any
    {
        if(!LocalStorage.isExist(key)) return null;
        const data = JSON.parse(localStorage.getItem(key)!);
        if(data === null || data.expiration < new Date().getTime())
        {
            LocalStorage.clear();
            return null;
        }

        return data.value;
    }

    /**
     * Returns true if the local storage contains given key.
     */
    public static isExist(key: LocalStorageKey): boolean
    {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Clear the local storage.
     */
    public static clear(key: LocalStorageKey | null = null): void
    {
        if(key !== null)
            localStorage.removeItem(key);
        else
            localStorage.clear();
    }
}