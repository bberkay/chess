import { NavbarComponent } from "./NavbarComponent";
import { SettingsMenuOperation } from "@Platform/Types";
import { SETTINGS_MENU_ID } from "@Platform/Consts";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";
import { Chess } from "@Chess/Chess";
import {
    MovementType,
    PieceAnimationSpeed,
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
    AlgebraicNotationStyle,
    Config as NotationMenuConfig,
    DEFAULT_CONFIG as DEFAULT_SETTINGS_NOTATION_MENU,
} from "../NotationMenu";
import { Formatter } from "@Platform/Utils/Formatter";

/**
 * A union type that contains all the config types
 * to change the settings of every configurable
 * component of the chess platform.
 */
export type Settings = ChessBoardConfig & LogConsoleConfig & NotationMenuConfig;

/**
 * This class provide a menu to change the settings
 * of the game and the platform itself.
 */
export class SettingsMenu extends NavbarComponent {
    public readonly id: string = SETTINGS_MENU_ID;
    private _classes: object[] = [];

    /**
     * Constructor of the SettingsMenu class.
     */
    constructor(...classes: object[]) {
        super();

        for (const classInstance of classes) {
            if (!(classInstance instanceof Object))
                throw new Error("The given object is not an Object.");
            this._classes.push(classInstance);
        }

        this.loadLocalStorage();
    }

    /**
     * This function checks the cache and loads the settings
     * from the local storage if they exist. If not, it saves
     * the default settings to the local storage.
     */
    private loadLocalStorage(): void {
        if (!LocalStorage.isExist(LocalStorageKey.Settings)) {
            LocalStorage.save(
                LocalStorageKey.Settings,
                this.getDefaultSettings()
            );
        }
    }        

    /**
     * Get every default settings of the platform as an object.
     */
    private getDefaultSettings(): Settings {
        return {
            ...DEFAULT_SETTINGS_CHESSBOARD,
            ...DEFAULT_SETTINGS_LOG_CONSOLE,
            ...DEFAULT_SETTINGS_NOTATION_MENU,
        };
    }

    /**
     * This function renders the settings menu.
     */
    protected renderComponent(): void {
        const currentSettings = LocalStorage.load(LocalStorageKey.Settings)!;
        type SettingKey = keyof typeof currentSettings;
        const currentSettingsKeyProxy = new Proxy(
            currentSettings as Record<SettingKey, unknown>,
            {
                get(target, prop: SettingKey): SettingKey {
                    if (prop in target) {
                        return prop;
                    }
                    throw new Error(
                        "The given setting is not a valid setting."
                    );
                },
            }
        ) as Record<SettingKey, SettingKey>;

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
            operation: SettingsMenuOperation,
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
            <span>${Formatter.camelCaseToPascalCase(settingKey)}</span>
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

        this.loadHTML(
            SETTINGS_MENU_ID,
            `
            <div id="settings-body">
                <fieldset>
                    <legend>Board</legend>
                    <div class="settings-item">
                        ${generateToggleSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.enableSoundEffects,
                            currentSettings.enableSoundEffects
                        )}
                    </div>
                    <div class="settings-item">
                        ${generateToggleSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.enablePreSelection,
                            currentSettings.enablePreSelection
                        )}
                    </div>
                    <div class="settings-item">
                        ${generateToggleSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.showHighlights,
                            currentSettings.showHighlights
                        )}
                    </div>
                    <div class="settings-item">
                        ${generateToggleSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.enableWinnerAnimation,
                            currentSettings.enableWinnerAnimation
                        )}
                    </div>
                    <div class="settings-item">
                        ${generateDropdownSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.movementType,
                            currentSettings.movementType,
                            Object.values(MovementType)
                        )}
                    </div>
                    <div class="settings-item">
                        ${generateDropdownSetting(
                            SettingsMenuOperation.ChangeBoardSetting,
                            currentSettingsKeyProxy.pieceAnimationSpeed,
                            currentSettings.pieceAnimationSpeed,
                            Object.values(PieceAnimationSpeed)
                        )}
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Notation Menu</legend>
                    <div class="settings-item">
                        ${generateDropdownSetting(
                            SettingsMenuOperation.ChangeNotationMenuSetting,
                            currentSettingsKeyProxy.algebraicNotationStyle,
                            currentSettings.algebraicNotationStyle,
                            Object.values(AlgebraicNotationStyle)
                        )}
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Log Console</legend>
                    <div class="settings-item">
                        ${generateToggleSetting(
                            SettingsMenuOperation.ChangeLogConsoleSetting,
                            currentSettingsKeyProxy.showSquareIds,
                            currentSettings.showSquareIds
                        )}
                    </div>
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
        this.loadSettings();
    }

    /**
     * Show the saved settings on the settings menu if they
     * exist in local storage. If not, show the default settings.
     */
    private loadSettings(): void {
        const settings = LocalStorage.load(LocalStorageKey.Settings);
        for (const setting in settings) {
            const settingItem = document.querySelector(
                `#${SETTINGS_MENU_ID} [data-setting-key="${setting}"]`
            );
            if (settingItem) {
                if (settingItem.getAttribute("type") === "checkbox") {
                    if (settings[setting as keyof Settings]) {
                        settingItem.setAttribute("checked", "");
                    } else {
                        settingItem.removeAttribute("checked");
                    }
                } else if (settingItem.tagName === "BUTTON") {
                    if (
                        settingItem.textContent &&
                        settings[setting as keyof Settings] ===
                            Formatter.titleCaseToCamelCase(
                                settingItem.textContent
                            )
                    ) {
                        settingItem.classList.add("selected");
                    }
                }
            }
        }
    }

    /**
     * Get the class instance by its class type.
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private getClassInstanceByType(classType: Function): object | null {
        return (
            this._classes.find((c: object) => c instanceof classType) || null
        );
    }

    /**
     * Save given setting to the local storage.
     */
    private saveSetting<K extends keyof Settings>(
        setting: K,
        newValue: Settings[K]
    ): void {
        const settings = LocalStorage.isExist(LocalStorageKey.Settings)
            ? LocalStorage.load(LocalStorageKey.Settings)!
            : this.getDefaultSettings()!;

        if (Object.keys(settings).indexOf(setting) === -1)
            throw new Error(
                "The given operation is not a valid setting operation."
            );

        settings[setting] = newValue;
        LocalStorage.save(LocalStorageKey.Settings, settings);
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
        if (!(menuItem instanceof HTMLElement))
            throw new Error("The given menu item is not an HTMLElement.");

        const settingKey = menuItem.getAttribute(
            "data-setting-key"
        ) as keyof Settings;
        const settingValue =
            menuItem.getAttribute("type") === "checkbox"
                ? menuItem.getAttribute("checked") === null
                : menuItem.textContent
                ? Formatter.titleCaseToCamelCase(menuItem.textContent).trim()
                : "";

        if (!settingKey || !settingValue)
            throw new Error(
                "The setting key or value is not found. Please check the given menu item and its data-setting-key and data-setting-value attributes."
            );

        switch (operation) {
            case SettingsMenuOperation.ClearCache:
                LocalStorage.clear();
                break;
            case SettingsMenuOperation.ResetSettings:
                LocalStorage.save(
                    LocalStorageKey.Settings,
                    this.getDefaultSettings()
                );
                this.loadSettings();
                break;
            case SettingsMenuOperation.ChangeBoardSetting:
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({
                    [settingKey]: settingValue,
                });
                break;
            case SettingsMenuOperation.ChangeLogConsoleSetting:
                (
                    this.getClassInstanceByType(LogConsole) as LogConsole
                ).setConfig({
                    [settingKey]: settingValue,
                });
                break;
            case SettingsMenuOperation.ChangeNotationMenuSetting:
                (
                    this.getClassInstanceByType(NotationMenu) as NotationMenu
                ).setConfig({
                    [settingKey]: settingValue,
                });
                break;
        }

        this.saveSetting(
            settingKey as keyof Settings,
            settingValue as Settings[typeof settingKey]
        );
    }
}
