import { BotAttributes } from "@Chess/Bot";
import { JsonNotation } from "@Chess/Types";
import { Theme } from "@Platform/Components/NavbarComponents/AppearanceMenu";
import { Settings } from "@Platform/Components/NavbarComponents/SettingsMenu";
import { PostReqScheme, PostRoutes } from "../ApiService";

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
export type StoreData = {
    [StoreKey.WasWelcomeModalShown]: boolean;
    [StoreKey.WasBoardEditorEnabled]: boolean;
    [StoreKey.LastBoard]: JsonNotation;
    [StoreKey.LastCreatedBoard]: string | null;
    [StoreKey.LastBot]: BotAttributes | null;
    [StoreKey.LastLobbyConnection]: PostReqScheme[PostRoutes.CreateLobby]["response"]["data"] | null;
    [StoreKey.LastPlayerName]: string | null;
    [StoreKey.CustomAppearance]: Record<string, string>;
    [StoreKey.Theme]: Theme;
    [StoreKey.Settings]: Settings;
};
