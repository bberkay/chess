import { BotAttributes } from "@Chess/Bot";
import { JsonNotation } from "@Chess/Types";
import { Theme } from "@Platform/Components/NavbarComponents/AppearanceMenu";
import { WsCreatedData } from "@ChessPlatform/Types";

/**
 * Enum for the local storage keys.
 * Add new keys here.
 */
export enum LocalStorageKey {
    WasWelcomeModalShown = "WasWelcomeModalShown",
    WasBoardEditorEnabled = "WasBoardEditorEnabled",
    LastBoard = "LastBoard",
    LastSavedFen = "LastSavedFen",
    LastBot = "LastBot",
    LastLobbyConnection = "LastLobbyConnection",
    LastPlayerName = "LastPlayerName",
    CustomAppearance = "CustomAppearance",
    Theme = "Theme",
    Settings = "Settings",
}

/**
 * Type mapping for local storage data types.
 */
type LocalStorageData = {
    [LocalStorageKey.WasWelcomeModalShown]: boolean;
    [LocalStorageKey.WasBoardEditorEnabled]: boolean;
    [LocalStorageKey.LastBoard]: JsonNotation;
    [LocalStorageKey.LastSavedFen]: string | null;
    [LocalStorageKey.LastBot]: BotAttributes | null;
    [LocalStorageKey.LastLobbyConnection]: WsCreatedData | null;
    [LocalStorageKey.LastPlayerName]: string | null;
    [LocalStorageKey.CustomAppearance]: Record<string, string>;
    [LocalStorageKey.Theme]: Theme;
    [LocalStorageKey.Settings]: Record<string, unknown>;
};

/**
 * This static class provides the methods for storing and
 * retrieving data from the local storage.
 */
export class LocalStorage {
    // Name of the layer.
    private static expirationTime: number = 1000 * 60 * 60 * 24 * 7; // 7 days

    /**
     * Stores the data in the local storage.
     */
    public static save<K extends LocalStorageKey>(key: K, value: LocalStorageData[K]): void {
        localStorage.setItem(
            key,
            JSON.stringify({
                value: value,
                expiration: new Date().getTime() + LocalStorage.expirationTime,
            })
        );
    }

    /**
     * Returns the data from the local storage.
     */
    public static load<K extends LocalStorageKey>(key: K): LocalStorageData[K] | null {
        if (!LocalStorage.isExist(key)) return null;
        const data = JSON.parse(localStorage.getItem(key)!);
        if (data === null || data.expiration < new Date().getTime()) {
            LocalStorage.clear();
            return null;
        }

        return data.value as LocalStorageData[K];
    }

    /**
     * Returns true if the local storage contains given key.
     */
    public static isExist(key: LocalStorageKey): boolean {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Clear the local storage.
     */
    public static clear(key: LocalStorageKey | null = null): void {
        if (key !== null) localStorage.removeItem(key);
        else localStorage.clear();
    }
}
