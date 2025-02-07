import { BotAttributes } from "@Chess/Bot";
import { JsonNotation } from "@Chess/Types";
import { Theme } from "@Platform/Components/NavbarComponents/AppearanceMenu";
import { WsCreatedData } from "@ChessPlatform/Types";
import { Settings } from "@Platform/Components/NavbarComponents/SettingsMenu";

/**
 * Enum for the local storage keys.
 * Add new keys here.
 */
export enum StoreKey {
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
type StoreData = {
    [StoreKey.WasWelcomeModalShown]: boolean;
    [StoreKey.WasBoardEditorEnabled]: boolean;
    [StoreKey.LastBoard]: JsonNotation;
    [StoreKey.LastCreatedBoard]: string | null;
    [StoreKey.LastBot]: BotAttributes | null;
    [StoreKey.LastLobbyConnection]: WsCreatedData | null;
    [StoreKey.LastPlayerName]: string | null;
    [StoreKey.CustomAppearance]: Record<string, string>;
    [StoreKey.Theme]: Theme;
    [StoreKey.Settings]: Settings;
};

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
