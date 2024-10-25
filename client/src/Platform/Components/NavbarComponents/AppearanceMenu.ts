import { NavbarComponent } from "./NavbarComponent";
import { AppearanceMenuOperation } from "../../Types";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";
import { APPEARANCE_MENU_ID } from "@Platform/Consts";
import { Formatter } from "@Platform/Utils/Formatter";

/**
 * Theme enum for the appearance menu.
 * @enum {string}
 */
export enum Theme {
    Dark = "dark",
    Light = "light",
    System = "system",
}

/**
 * This class provide a menu to show the appearance menu.
 */
export class AppearanceMenu extends NavbarComponent {
    public readonly id: string = APPEARANCE_MENU_ID;
    private currentTheme: Theme = Theme.System;
    private rootComputedStyle = getComputedStyle(document.documentElement);

    /**
     * Constructor of the AppearanceMenu class.
     */
    constructor() {
        super();
        this.createStyleElement();
        this.loadLocalStorage();
    }

    /**
     * Load the appearance from the local storage.
     */
    private loadLocalStorage(): void {
        if (LocalStorage.isExist(LocalStorageKey.Theme)) {
            this.changeTheme(LocalStorage.load(LocalStorageKey.Theme));
        } else {
            this.changeTheme(Theme.System);
        }

        if (LocalStorage.isExist(LocalStorageKey.CustomAppearance)) {
            const customAppearance = LocalStorage.load(
                LocalStorageKey.CustomAppearance
            );
            for (const customColor in customAppearance) {
                this.addCustomAppearanceStyle(
                    customColor,
                    customAppearance[customColor]
                );
            }
        }
    }

    /**
     * This function renders the appearance menu.
     */
    protected renderComponent(): void {
        /**
         * This function returns the custom properties of the
         * chessboard.css from the CSS.
         */
        const getChessboardCssProps = (): Set<string> => {
            const customProperties = new Set<string>();
            for (const sheet of document.styleSheets) {
                try {
                    for (const rule of sheet.cssRules) {
                        if ((rule as CSSStyleRule).style) {
                            for (const property of (rule as CSSStyleRule)
                                .style) {
                                if (
                                    property.startsWith("--chessboard-") &&
                                    property.endsWith("-color") &&
                                    !property.startsWith(
                                        "--chessboard-default-"
                                    )
                                ) {
                                    customProperties.add(property);
                                }
                            }
                        }
                    }
                } catch (e) {
                    console.error("Error while reading CSS rules", e);
                }
            }
            return customProperties;
        };

        /**
         * Generate the color picker html elements for the
         * chessboard.css properties.
         */
        const generateColorPickersOfChessboardCssProps = (): string => {
            let colorPickers = "";
            for (const property of getChessboardCssProps()) {
                const colorId = property.replace("--chessboard-", "");
                const colorTitle = Formatter.kebabCaseToTitleCase(
                    colorId.replace("-color", "")
                );
                colorPickers += `
                    <div class="input-group color-picker">
                        <label for="${colorId}" data-tooltip-text="${colorTitle}" data-shortened-parent=".color-picker" data-shortened-length="15">${colorTitle}</label>
                        <div class="input-group--horizontal">
                            <div class="input-group">
                                <input type="color" id="${colorId}" value="#ffffff">
                                <input type="range" id="${colorId}-opacity" min="0" max="1" step="0.1" value="1">
                            </div>
                            <button class="reset-button" id="reset-${colorId}">↻</button>
                        </div>
                    </div>
                `;
            }
            return colorPickers;
        };

        this.loadHTML(
            APPEARANCE_MENU_ID,
            `
            <div id="appearance-body">
                ${generateColorPickersOfChessboardCssProps()}
            </div>
            <div id="appearance-footer">
                <div class="appearance-utilities">
                    <button data-menu-operation="${
                        AppearanceMenuOperation.Reset
                    }">Reset to Default</button>
                    <button data-menu-operation="${
                        AppearanceMenuOperation.ChangeTheme
                    }">${
                this.currentTheme === Theme.System
                    ? Formatter.camelCaseToTitleCase(Theme.Dark) + " Mode"
                    : this.currentTheme === Theme.Dark
                    ? Formatter.camelCaseToTitleCase(Theme.Light) + " Mode"
                    : Formatter.camelCaseToTitleCase(Theme.System) + " Mode"
            }</button>
                </div>
            </div>
        `
        );

        this.loadCSS("appearance-menu.css");
        this.loadColorPalette();
        this.addEventListeners();
    }

    /**
     * This function returns the default hex code of the color.
     */
    private _getDefaultHexCode(colorId: string): string {
        return this.rootComputedStyle.getPropertyValue(
            `--chessboard-default-${colorId}`
        );
    }

    /**
     * This function returns the color and opacity from the hex code.
     */
    private _getColorAndOpacityFromHexCode(color: string): {
        color: string;
        opacity: string;
    } {
        const colorWithoutOpacity: string =
            color.length > 7 ? color.slice(0, 7) : color;
        const opacityHex = color.length > 7 ? color.slice(-2) : "FF";
        const opacityFloat = parseInt(opacityHex, 16) / 255;
        return { color: colorWithoutOpacity, opacity: opacityFloat.toString() };
    }

    /**
     * This function generates the hex code with opacity.
     * @example _generateHexCodeWithOpacity("#ffffff", "0.5") => "#ffffff80"
     * @example _generateHexCodeWithOpacity("#ffffff", "1") => "#ffffffFF"
     * @example _generateHexCodeWithOpacity("#ffffff", "0") => "#ffffff00"
     * @example _generateHexCodeWithOpacity("#ffffff", "0.75") => "#ffffffBF"
     */
    private _generateHexCodeWithOpacity(
        color: string,
        opacity: string | number
    ): string {
        if (typeof opacity !== "number") opacity = parseFloat(opacity);

        const opacityHex = Math.round(opacity * 255)
            .toString(16)
            .padStart(2, "0");
        return `${color}${opacityHex}`;
    }

    /**
     * This function creates the style element for custom appearance styles.
     */
    private createStyleElement(): void {
        if (document.getElementById("appearance-menu-style")) return;

        const styleElement = document.createElement("style");
        styleElement.id = "appearance-menu-style";
        document.head.appendChild(styleElement);
        styleElement.innerHTML = `:root{}`;
    }

    /**
     * Get the style element for custom appearance styles.
     */
    private getStyleElement(): HTMLStyleElement {
        if (document.getElementById("appearance-menu-style"))
            return document.getElementById(
                "appearance-menu-style"
            ) as HTMLStyleElement;
        else
            throw new Error(
                "Style element for custom appearance does not exist."
            );
    }

    /**
     * This function adds event listeners to the appearance menu.
     */
    private addEventListeners(): void {
        document
            .querySelectorAll(`#${APPEARANCE_MENU_ID} .color-picker`)
            .forEach((colorPicker) => {
                const colorInput = colorPicker.querySelector(
                    "input[type='color']"
                ) as HTMLInputElement;
                const opacityInput = colorPicker.querySelector(
                    "input[type='range']"
                ) as HTMLInputElement;
                const resetButton = colorPicker.querySelector(
                    ".reset-button"
                ) as HTMLButtonElement;

                colorInput.addEventListener("input", () => {
                    this.addCustomAppearanceStyle(
                        colorInput.id,
                        colorInput.value
                    );
                });

                opacityInput.addEventListener("change", () => {
                    colorInput.style.opacity = opacityInput.value;

                    this.addCustomAppearanceStyle(
                        colorInput.id,
                        this._generateHexCodeWithOpacity(
                            colorInput.value,
                            opacityInput.value
                        )
                    );
                });

                resetButton.addEventListener("click", () => {
                    const defaultColor = this._getDefaultHexCode(colorInput.id);
                    this.addCustomAppearanceStyle(colorInput.id, defaultColor);

                    const { color, opacity } =
                        this._getColorAndOpacityFromHexCode(defaultColor);
                    colorInput.value = color;
                    opacityInput.value = opacity;
                    colorInput.style.opacity = opacity;
                });
            });
    }

    /**
     * Add custom appearance style to the style element.
     */
    private addCustomAppearanceStyle(varName: string, value: string): void {
        const styleElement = this.getStyleElement();

        const isExist = styleElement.innerHTML.includes(
            `--chessboard-${varName}`
        );
        styleElement.innerHTML = styleElement.innerHTML.replace(
            isExist ? new RegExp(`--chessboard-${varName}: .+?;`) : `}`,
            `--chessboard-${varName}: ${value};` + (isExist ? "" : "}")
        );

        LocalStorage.save(LocalStorageKey.CustomAppearance, {
            ...LocalStorage.load(LocalStorageKey.CustomAppearance),
            [varName]: value,
        });
    }

    /**
     * This function shows the color palette on the appearance menu.
     */
    private loadColorPalette(): void {
        let customAppearance;
        if (LocalStorage.isExist(LocalStorageKey.CustomAppearance))
            customAppearance = LocalStorage.load(
                LocalStorageKey.CustomAppearance
            );

        for (const colorPicker of document.querySelectorAll(
            `#${APPEARANCE_MENU_ID} .color-picker`
        ) as NodeListOf<HTMLInputElement>) {
            const colorInput = colorPicker.querySelector(
                "input[type='color']"
            ) as HTMLInputElement;
            const opacityInput = colorPicker.querySelector(
                "input[type='range']"
            ) as HTMLInputElement;

            let colorHex: string;
            if (
                customAppearance &&
                Object.hasOwn(customAppearance, colorInput.id)
            )
                colorHex = customAppearance[colorInput.id];
            else colorHex = this._getDefaultHexCode(colorInput.id);

            const { color, opacity } =
                this._getColorAndOpacityFromHexCode(colorHex);
            colorInput.value = color;
            opacityInput.value = opacity;
            colorInput.style.opacity = opacity;

            this.addCustomAppearanceStyle(colorInput.id, colorHex);
        }
    }

    /**
     * Change the theme of the app.
     */
    private changeTheme(theme: Theme | null = null): void {
        const changeThemeButton = document.querySelector(`
            [data-menu-operation="${AppearanceMenuOperation.ChangeTheme}"]
        `) as HTMLButtonElement;

        if (theme === Theme.Light || this.currentTheme === Theme.Dark) {
            this.currentTheme = Theme.Light;
            document.body.setAttribute("data-color-scheme", Theme.Light);
            if (changeThemeButton)
                changeThemeButton.innerText =
                    Formatter.camelCaseToTitleCase(Theme.System) + " Mode";
        } else if (
            theme === Theme.System ||
            this.currentTheme === Theme.Light
        ) {
            this.currentTheme = Theme.System;
            document.body.removeAttribute("data-color-scheme");
            if (changeThemeButton)
                changeThemeButton.innerText =
                    Formatter.camelCaseToTitleCase(Theme.Dark) + " Mode";
        } else if (theme === Theme.Dark || this.currentTheme === Theme.System) {
            this.currentTheme = Theme.Dark;
            document.body.setAttribute("data-color-scheme", Theme.Dark);
            if (changeThemeButton)
                changeThemeButton.innerText =
                    Formatter.camelCaseToTitleCase(Theme.Light) + " Mode";
        }

        LocalStorage.save(LocalStorageKey.Theme, this.currentTheme);
    }

    /**
     * Hide the appearance menu.
     */
    public hide(): void {
        const appearanceMenu = document.getElementById(APPEARANCE_MENU_ID)!;
        appearanceMenu!.innerHTML = "";
        appearanceMenu!.classList.add("hidden");
    }

    /**
     * Show the appearance menu.
     */
    public show(): void {
        document.getElementById(APPEARANCE_MENU_ID)!.classList.remove("hidden");
        this.renderComponent();
    }

    /**
     * Handle the appearance menu events.
     */
    public handleOperation(operation: AppearanceMenuOperation): void {
        switch (operation) {
            case AppearanceMenuOperation.ChangeTheme:
                this.changeTheme();
                break;
            case AppearanceMenuOperation.Reset:
                LocalStorage.clear(LocalStorageKey.CustomAppearance);
                this.loadColorPalette();
                break;
        }
    }
}
