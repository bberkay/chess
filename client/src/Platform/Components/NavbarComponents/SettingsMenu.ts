import { NavbarComponent } from "./NavbarComponent";
import { SettingsMenuOperation } from "@Platform/Types";
import { SETTINGS_MENU_ID } from "@Platform/Consts";
import { Storage, StorageKey } from "@Services/Storage";
import { Chess } from "@Chess/Chess";
import {
    AnimationSpeed,
    Config as ChessBoardConfig,
    DEFAULT_CONFIG as DEFAULT_SETTINGS_CHESSBOARD,
} from "@Chess/Board/ChessBoard";
import {
    LogConsole,
    Config as LogConsoleConfig,
    DEFAULT_CONFIG as DEFAULT_SETTINGS_LOG_CONSOLE,
} from "./LogConsole";
import {
    NotationMenu,
    NotationStyle,
    Config as NotationMenuConfig,
    DEFAULT_CONFIG as DEFAULT_SETTINGS_NOTATION_MENU,
} from "../NotationMenu";
import { Formatter } from "@Platform/Utils/Formatter";
import { Component } from "../Component";

/**
 * Defines available configuration operations for modifying settings 
 * on the chessboard, log console, or notation menu.
 */
type SettingsConfigOperation = SettingsMenuOperation.ChangeBoardSetting | SettingsMenuOperation.ChangeLogConsoleSetting | SettingsMenuOperation.ChangeNotationMenuSetting;

/**
 * Represents configuration types for different components (chessboard, log console, notation menu).
 */
type Config = ChessBoardConfig | LogConsoleConfig | NotationMenuConfig;

/**
 * Maps each configuration operation to its specific `Config`, 
 * covering all settings in the chess platform.
 */
export type Settings = Record<SettingsConfigOperation, Config>;

/**
 * Keys for accessing specific properties within any configuration in `Settings`.
 */
type SettingKey = keyof Settings[SettingsConfigOperation];

/**
 * Represents all possible values within any configuration in `Settings`.
 */
type SettingValue = Settings[SettingsConfigOperation][keyof Settings[SettingsConfigOperation]];

/**
 * Delay in milliseconds before reloading the page after clearing the cache.
 */
const CACHE_RELOAD_DELAY_MS = 500;

/**
 * This class provide a menu to change the settings
 * of the game and the platform itself.
 */
export class SettingsMenu extends NavbarComponent {
    public readonly id: string = SETTINGS_MENU_ID;
    private readonly chess: Chess;
    
    private _components: Component[] = [];

    /**
     * Constructor of the SettingsMenu class.
     */
    constructor(chess: Chess, ...components: Component[]) {
        super();
        this.chess = chess;

        for (const component of components) {
            if (!(component instanceof Component))
                throw new Error("The given object is not an instance of Component.");
            this._components.push(component);
        }
        
        this.loadLocalStorage();
    }

    /**
     * This function checks the cache and loads the settings
     * from the local storage if they exist. If not, it saves
     * the default settings to the local storage.
     */
    private loadLocalStorage(): void {
        const settings = Storage.load(StorageKey.Settings);
        if (!settings) {
            Storage.save(
                StorageKey.Settings,
                this.getDefaultSettings()
            );
        } else {
            for (const config in settings) {
                for(const [settingKey, settingValue] of Object.entries(settings[config as SettingsConfigOperation])) {
                    this.saveSetting(
                        config as SettingsConfigOperation, 
                        settingKey as SettingKey,
                        settingValue as SettingValue
                    )
                }
            }
        }
    }        

    /**
     * Get every default settings of the platform as an object.
     */
    private getDefaultSettings(): Settings {
        return {
            [SettingsMenuOperation.ChangeBoardSetting]: DEFAULT_SETTINGS_CHESSBOARD,
            [SettingsMenuOperation.ChangeLogConsoleSetting]: DEFAULT_SETTINGS_LOG_CONSOLE,
            [SettingsMenuOperation.ChangeNotationMenuSetting]: DEFAULT_SETTINGS_NOTATION_MENU,
        };
    }

    /**
     * This function renders the settings menu.
     */
    protected renderComponent(): void {
        const currentSettings = Storage.load(StorageKey.Settings)!;

        /**
         * Generate a toggle setting with the given values.
         * @param operation data-menu-operation attribute value
         * to catching the operation to be handled.
         * @param settingKey The name of the setting also used as
         * the key for handling the data-menu-operation.
         * @param settingValue The current value of the setting.
         * It will be also checked if the setting is enabled or not.
         */
        const generateToggleSetting = (
            operation: SettingsConfigOperation,
            settingKey: SettingKey,
            settingValue: boolean
        ): string => {
            return `
            <span>${Formatter.camelCaseToTitleCase(settingKey)}</span>
            <label class="switch">
                    <input type="checkbox" data-menu-operation="${operation}" data-setting-key="${settingKey}" ${
                settingValue ? `checked="true"` : ``
            }>
                    <span class="slider round"></span>
                </label>
            `;
        };

        /**
         * Generate a dropdown setting with the given values.
         * @param operation data-menu-operation attribute value
         * to catching the operation to be handled.
         * @param settingKey The name of the setting also used as
         * the key for handling the data-menu-operation.
         * @param settingValue The current value of the setting.
         * It will be shown as the title of the dropdown button.
         * @param values The values for the dropdown items.
         */
        const generateDropdownSetting = (
            operation: SettingsMenuOperation,
            settingKey: SettingKey,
            settingValue: string,
            values: string[]
        ): string => {
            return `
            <span>${Formatter.pascalCaseToTitleCase(settingKey)}</span>
            <div class="dropdown">
                <button class="dropdown-button"><span class="dropdown-title">${Formatter.camelCaseToTitleCase(
                    settingValue
                )}</span> <span class="down-icon">▾</span></button>
                <div class="dropdown-content">
                    ${values
                        .map((c: string) => {
                            return `<button data-menu-operation="${operation}" data-setting-key="${settingKey}" class="dropdown-item ${
                                c.trim() == settingValue.trim()
                                    ? "selected"
                                    : ""
                            }">${Formatter.camelCaseToTitleCase(c)}</button>`;
                        })
                        .join("")}
                </div>
            </div>
            `;
        };

        /**
         * This function retrieves the available options for a specific setting key within a given operation.
         * 
         * @template T - Represents the type of `SettingsConfigOperation`.
         * @template K - Represents the valid keys for a specific `T` configuration.
         * @param {T} operation - The configuration group operation.
         * @param {K} settingKey - The specific key for the setting.
         * @returns {string[]} An array of available options for the setting key, or an empty array if invalid.
        */
        const getCompleteEnumValues = <T extends SettingsConfigOperation, K extends keyof Settings[T]>(operation: T, settingKey: K): string[] => {
            const currentSettingsKeyProxy = new Proxy(
                currentSettings[operation] as Record<SettingKey, unknown>,
                {
                    get(target, prop: SettingKey): SettingKey | undefined {
                        if (prop in target) {
                            return prop;
                        }
                    },
                }
            ) as Record<SettingKey, SettingKey>;
            
            if (!currentSettingsKeyProxy) return [];
            if (!Object.hasOwn(currentSettingsKeyProxy, settingKey)) return [];
            
            switch (settingKey) {
                case (currentSettingsKeyProxy as ChessBoardConfig).animationSpeed:
                    return Object.values(AnimationSpeed);
                case (currentSettingsKeyProxy as NotationMenuConfig).notationStyle:
                    return Object.values(NotationStyle);
                default:
                    return [];
            }
        }

        this.loadHTML(
            SETTINGS_MENU_ID,
            `
            <div id="settings-body">
                ${Object.entries(currentSettings).map(([settingConfigOperation, settingKeyValuePair]) => {
                    return `
                    <fieldset>
                        <legend>${Formatter.camelCaseToTitleCase(settingConfigOperation.replace("Change", "").replace("Setting", ""))}</legend>
                        ${Object.entries(settingKeyValuePair).map(([settingKey, settingValue]) => {
                            return `
                            <div class="settings-item">
                                ${typeof settingValue === "boolean"
                                    ? generateToggleSetting(
                                        settingConfigOperation as SettingsConfigOperation, 
                                        settingKey as SettingKey,
                                        settingValue
                                    ) : generateDropdownSetting(
                                        settingConfigOperation as SettingsConfigOperation,
                                        settingKey as SettingKey,
                                        settingValue as string,
                                        getCompleteEnumValues(
                                            settingConfigOperation as SettingsConfigOperation, 
                                            settingKey as SettingKey
                                        )
                                    )
                                }
                            </div>
                            `
                        }).join("")}
                    </fieldset>`
                }).join("")}
                </fieldset>
            </div>
            <div id="settings-footer">
                <div class="settings-utilities">
                    <button data-menu-operation="${
                        SettingsMenuOperation.ResetSettings
                    }">Reset to Default</button>
                    <button data-menu-operation="${
                        SettingsMenuOperation.ClearCache
                    }">Clear Cache</button>
                </div>
            </div>
        `
        );
        this.loadCSS("settings-menu.css");
    }

    /**
     * Get the component instance by its class type. Like `LogConsole` 
     * or `NotationMenu`.
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private getComponentInstanceByType(classType: Function): object | null {
        return (
            this._components.find((c: object) => c instanceof classType) || null
        );
    }

    /**
     * Save given setting to the local storage.
     */
    private saveSetting<T extends SettingsConfigOperation, K extends keyof Settings[T]>(
        configOperation: T,
        settingKey: K,
        settingValue: Settings[T][K]
    ): void {
        const settings = Storage.isExist(StorageKey.Settings)
            ? Storage.load(StorageKey.Settings)!
            : this.getDefaultSettings()!;

        if (Object.keys(settings).indexOf(configOperation) === -1)
            throw new Error(
                "The given operation is not a valid setting config operation."
            );

        if(!Object.hasOwn(settings[configOperation], settingKey))
            throw new Error(
                "The given setting does not exist in the given config."
            );

        // Handling across the classes
        switch (configOperation) {
            case SettingsMenuOperation.ChangeBoardSetting:
                this.chess.board.setConfig({
                    [settingKey]: settingValue,
                });
                break;
            case SettingsMenuOperation.ChangeLogConsoleSetting:
                (
                    this.getComponentInstanceByType(LogConsole) as LogConsole
                ).setConfig({
                    [settingKey]: settingValue,
                });
                break;
            case SettingsMenuOperation.ChangeNotationMenuSetting:
                (
                    this.getComponentInstanceByType(NotationMenu) as NotationMenu
                ).setConfig({
                    [settingKey]: settingValue,
                });
                break;
        }

        settings[configOperation][settingKey] = settingValue;
        Storage.save(StorageKey.Settings, settings);
    }

    /**
     * Hide the settings menu.
     */
    public hide(): void {
        const settingsMenu = document.getElementById(SETTINGS_MENU_ID)!;
        settingsMenu.innerHTML = "";
        settingsMenu.classList.add("hidden");
    }

    /**
     * Show the settings menu.
     */
    public show(): void {
        document.getElementById(SETTINGS_MENU_ID)!.classList.remove("hidden");
        this.renderComponent();
    }

    /**
     * Handle the operations of the settings menu.
     * @param operation The operation to be handled.
     * @param menuItem The menu item that the operation will be applied.
     *
     * @example handleOperation(
     *  SettingsMenuOperation.ChangeBoardSetting,
     *  document.querySelector("#settings-menu [data-menu-operation='ChangeBoardSetting']")
     * );
     * This example finds the setting key from the given `menuItem.getAttribute("data-setting-key")`
     * and takes its value from the `menuItem.getAttribute("checked")` if it is a checkbox or
     * from the `menuItem.textContent` if it is a dropdown. Then, it saves the setting to the
     * local storage and applies the setting to its class instance like `Chess` or `LogConsole`
     * by calling the `setConfig` method of the class instance.
     */
    public handleOperation(
        operation: SettingsMenuOperation,
        menuItem: HTMLElement
    ): void {
        // Operation handles here if it is not a config operation.
        switch (operation) {
            case SettingsMenuOperation.ClearCache:
                Storage.clear();
                setTimeout(() => { window.location.reload() }, CACHE_RELOAD_DELAY_MS);
                return;
            case SettingsMenuOperation.ResetSettings:
                Storage.save(
                    StorageKey.Settings,
                    this.getDefaultSettings()
                );
                this.renderComponent();
                this.loadLocalStorage();
                return;
        }

        // Operation handles here if it is a config operation.
        if (!(menuItem instanceof HTMLElement)) 
            throw new Error(
                "The setting key or value is not found. Please check the given menu item and its data-setting-key and data-setting-value attributes."
            );

        const settingKey = menuItem.getAttribute(
            "data-setting-key"
        ) as keyof Settings;
        
        let settingValue = null;
        if (menuItem.getAttribute("type") === "checkbox") {
            settingValue = !menuItem.hasAttribute("checked");
        } else if (menuItem.tagName === "BUTTON" && menuItem.textContent) {
            settingValue = Formatter.titleCaseToCamelCase(menuItem.textContent).trim()
        }
        
        if (!settingKey || settingValue == null)
            throw new Error(
                "The setting key or value is not found. Please check the given menu item and its data-setting-key and data-setting-value attributes."
            );

        this.saveSetting(
            operation, 
            settingKey as SettingKey,
            settingValue as SettingValue
        );
    }   
}
