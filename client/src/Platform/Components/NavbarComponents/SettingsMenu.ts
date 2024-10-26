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
        this.loadHTML(
            SETTINGS_MENU_ID,
            `
            <div id="settings-body">
                <fieldset>
                    <legend>Board</legend>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.EnableSoundEffects
                        )}</span>
                        <label class="switch">
                            <input data-menu-operation="${
                                SettingsMenuOperation.EnableSoundEffects
                            }" type="checkbox" ${
                currentSettings.enableSoundEffects ? `checked="true"` : ``
            }>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.EnablePreSelection
                        )}</span>
                        <label class="switch">
                            <input data-menu-operation="${
                                SettingsMenuOperation.EnablePreSelection
                            }" type="checkbox" ${
                currentSettings.enablePreSelection ? `checked="true"` : ``
            }>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.ShowHighlights
                        )}</span>
                        <label class="switch">
                            <input data-menu-operation="${
                                SettingsMenuOperation.ShowHighlights
                            }" type="checkbox" ${
                currentSettings.showHighlights ? `checked="true"` : ``
            }>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.EnableWinnerAnimation
                        )}</span>
                        <label class="switch">
                            <input data-menu-operation="${
                                SettingsMenuOperation.EnableWinnerAnimation
                            }" type="checkbox" ${
                currentSettings.enableWinnerAnimation ? `checked="true"` : ``
            }>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.MovementType
                        )}</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">${Formatter.pascalCaseToTitleCase(
                                currentSettings.movementType as string
                            )}</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                ${Object.values(MovementType)
                                    .map((c: string) => {
                                        return `<button data-menu-operation="${
                                            SettingsMenuOperation.MovementType
                                        }" class="dropdown-item ${
                                            c.trim() ==
                                            currentSettings.movementType.trim()
                                                ? "selected"
                                                : ""
                                        }">${Formatter.pascalCaseToTitleCase(
                                            c
                                        )}</button>`;
                                    })
                                    .join("")}
                            </div>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.PieceAnimationSpeed
                        )}</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">${Formatter.pascalCaseToTitleCase(
                                currentSettings.pieceAnimationSpeed
                            )}</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                ${Object.values(PieceAnimationSpeed)
                                    .map((c: string) => {
                                        return `<button data-menu-operation="${
                                            SettingsMenuOperation.PieceAnimationSpeed
                                        }" class="dropdown-item ${
                                            c.trim() ==
                                            currentSettings.pieceAnimationSpeed.trim()
                                                ? "selected"
                                                : ""
                                        }">${Formatter.pascalCaseToTitleCase(
                                            c
                                        )}</button>`;
                                    })
                                    .join("")}
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Notation Menu</legend>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.AlgebraicNotationStyle
                        )}</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">${Formatter.pascalCaseToTitleCase(
                                currentSettings.algebraicNotationStyle
                            )}</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                ${Object.values(AlgebraicNotationStyle)
                                    .map((c: string) => {
                                        return `<button data-menu-operation="${
                                            SettingsMenuOperation.AlgebraicNotationStyle
                                        }" class="dropdown-item ${
                                            c.trim() ==
                                            currentSettings.algebraicNotationStyle.trim()
                                                ? "selected"
                                                : ""
                                        }">${Formatter.pascalCaseToTitleCase(
                                            c
                                        )}</button>`;
                                    })
                                    .join("")}
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Log Console</legend>
                    <div class="settings-item">
                        <span>${Formatter.pascalCaseToTitleCase(
                            SettingsMenuOperation.ShowSquareIds
                        )}</span>
                        <label class="switch">
                            <input data-menu-operation="${
                                SettingsMenuOperation.ShowSquareIds
                            }" type="checkbox" ${
                currentSettings.showSquareIds ? `checked="true"` : ``
            }>
                            <span class="slider round"></span>
                        </label>
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
     * Load the settings from the local storage.
     */
    private loadLocalStorage(): void {
        if (!LocalStorage.isExist(LocalStorageKey.Settings))
            LocalStorage.save(
                LocalStorageKey.Settings,
                this.getDefaultSettings()
            );

        const currentSettings = LocalStorage.load(LocalStorageKey.Settings);
        for (const setting in currentSettings) {
            this.handleOperation(
                setting as SettingsMenuOperation,
                currentSettings[setting as keyof Settings]
            );
        }
    }

    /**
     * Show the saved settings on the settings menu if they
     * exist in local storage. If not, show the default settings.
     */
    private loadSettings(): void {
        if (!LocalStorage.isExist(LocalStorageKey.Settings)) {
            LocalStorage.save(
                LocalStorageKey.Settings,
                this.getDefaultSettings()
            );
        }

        const settings = LocalStorage.load(LocalStorageKey.Settings);
        for (const setting in settings) {
            const settingItem = document.querySelector(
                `#${SETTINGS_MENU_ID} [data-menu-operation="${Formatter.camelCaseToPascalCase(
                    setting
                )}"]`
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
    private saveSetting<K extends keyof Settings>(setting: K, newValue: Settings[K]): void {
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
     * @example handleOperation(SettingsMenuOperation.EnableSoundEffects, document.querySelector("#settings-menu [data-menu-operation='EnableSoundEffects']"));
     * This example will find the menu item and according to its
     * type(checkbox or text), it will change the value of the setting.
     *
     * @example handleOperation(SettingsMenuOperation.EnableSoundEffects, true);
     * This example will change the value of the setting to true.
     *
     * @example handleOperation(SettingsMenuOperation.MovementType, MovementType.DragAndDrop);
     * This example will change the value of the setting to DragAndDrop.
     */
    public handleOperation(
        operation: SettingsMenuOperation,
        menuItem: unknown
    ): void {
        let newValue;
        if (menuItem instanceof HTMLElement) {
            newValue =
                menuItem.getAttribute("type") === "checkbox"
                    ? menuItem.getAttribute("checked") === null
                    : menuItem.textContent
                    ? Formatter.titleCaseToCamelCase(
                          menuItem.textContent
                      ).trim()
                    : "";
        } else {
            newValue = menuItem;
        }

        switch (Formatter.camelCaseToPascalCase(operation)) {
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
            case SettingsMenuOperation.EnableSoundEffects:
            case SettingsMenuOperation.EnablePreSelection:
            case SettingsMenuOperation.ShowHighlights:
            case SettingsMenuOperation.EnableWinnerAnimation:
            case SettingsMenuOperation.PieceAnimationSpeed:
            case SettingsMenuOperation.MovementType:
                operation = Formatter.pascalCaseToCamelCase(
                    operation
                ) as SettingsMenuOperation;
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({
                    [operation]: newValue,
                });
                this.saveSetting(operation as keyof Settings, newValue as Settings[typeof operation]);
                break;
            case SettingsMenuOperation.ShowSquareIds:
                operation = Formatter.pascalCaseToCamelCase(
                    operation
                ) as SettingsMenuOperation;
                (
                    this.getClassInstanceByType(LogConsole) as LogConsole
                ).setConfig({ [operation]: newValue });
                this.saveSetting(operation, newValue);
                break;
            case SettingsMenuOperation.AlgebraicNotationStyle:
                operation = Formatter.pascalCaseToCamelCase(
                    operation
                ) as SettingsMenuOperation;
                (
                    this.getClassInstanceByType(NotationMenu) as NotationMenu
                ).setConfig({ [operation]: newValue });
                this.saveSetting(operation, newValue);
                break;
        }
    }
}
