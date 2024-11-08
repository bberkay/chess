import { BotAttributes } from "@Chess/Bot";
import { JsonNotation } from "@Chess/Types";
import { Theme } from "@Platform/Components/NavbarComponents/AppearanceMenu";
import { WsCreatedData } from "@ChessPlatform/Types";
import { Settings } from "@Platform/Components/NavbarComponents/SettingsMenu";

/**
 * Enum for the local storage keys.
 * Add new keys here.
 */
export enum StorageKey {
    WasWelcomeModalShown = "WasWelcomeModalShown",
    WasBoardEditorEnabled = "WasBoardEditorEnabled",
    LastBoard = "LastBoard",
    LastCreatedBoard = "LastCreatedBoard",
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
type StorageData = {
    [StorageKey.WasWelcomeModalShown]: boolean;
    [StorageKey.WasBoardEditorEnabled]: boolean;
    [StorageKey.LastBoard]: JsonNotation;
    [StorageKey.LastCreatedBoard]: string | null;
    [StorageKey.LastBot]: BotAttributes | null;
    [StorageKey.LastLobbyConnection]: WsCreatedData | null;
    [StorageKey.LastPlayerName]: string | null;
    [StorageKey.CustomAppearance]: Record<string, string>;
    [StorageKey.Theme]: Theme;
    [StorageKey.Settings]: Settings;
};

/**
 * Expiration time for the local storage data.
 */
const EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 7; // 7 days

/**
 * This static class provides the methods for storing and
 * retrieving data from the local storage.
 */
export class Storage {
    private static expirationTime: number = EXPIRATION_TIME;

    /**
     * Stores the data in the local storage.
     */
    public static save<K extends StorageKey>(key: K, value: StorageData[K]): void {
        localStorage.setItem(
            key,
            JSON.stringify({
                value: value,
                expiration: new Date().getTime() + Storage.expirationTime,
            })
        );
    }

    /**
     * Returns the data from the local storage.
     */
    public static load<K extends StorageKey>(key: K): StorageData[K] | null {
        if (!Storage.isExist(key)) return null;
        const data = JSON.parse(localStorage.getItem(key)!);
        if (data === null || data.expiration < new Date().getTime()) {
            Storage.clear();
            return null;
        }

        return data.value as StorageData[K];
    }

    /**
     * Returns true if the local storage contains given key.
     */
    public static isExist(key: StorageKey): boolean {
        return localStorage.getItem(key) !== null;
    }

    /**
     * Clear the local storage.
     */
    public static clear(key: StorageKey | null = null): void {
        if (key !== null) localStorage.removeItem(key);
        else localStorage.clear();
    }
}
