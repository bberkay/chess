import { NavbarComponent } from "./NavbarComponent";
import { AppearanceMenuOperation } from "../../Types";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";

enum Theme{
    Dark = "dark-mode",
    Light = "light-mode"
}

/**
 * This class provide a menu to show the appearance menu.
 */
export class AppearanceMenu extends NavbarComponent{
    private currentTheme: string = Theme.Dark;

    /**
     * Constructor of the AppearanceMenu class.
     */
    constructor() {
        super();
        this.renderComponent();
        this.addEventListeners();
    }

    /**
     * This function renders the appearance menu.
     */
    protected renderComponent(): void
    {
        this.loadHTML("appearance-menu", `
            <div id="appearance-body">
                <fieldset>
                    <legend>Board</legend>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="white-square-color">White</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="white-square-color" value="#ffffff">
                                    <input type="range" id="white-square-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-white-square-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="black-square-color">Black</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="black-square-color" value="#ffffff">
                                    <input type="range" id="black-square-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-black-square-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="border-color">Border</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="border-color" value="#ffffff">
                                    <input type="range" id="border-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-border-color">↻</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Piece Effects</legend>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="selected-color">Selected</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="selected-color" value="#ffffff">
                                    <input type="range" id="selected-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-selected-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="playable-color">Playable</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="playable-color" value="#ffffff">
                                    <input type="range" id="playable-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-playable-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="checked-color">Checked</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="checked-color" value="#ffffff">
                                    <input type="range" id="checked-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-checked-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="from-color">From</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="from-color" value="#ffffff">
                                    <input type="range" id="from-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-from-color">↻</button>
                            </div>
                        </div>
                         <div class="input-group color-picker">
                            <label for="to-color">To</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="to-color" value="#ffffff">
                                    <input type="range" id="to-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                               <button class="reset-button" id="reset-to-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="hovering-color">Hovering</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="hovering-color" value="#ffffff">
                                    <input type="range" id="hovering-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-hovering-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="preselected-color">Preselected</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="preselected-color" value="#ffffff">
                                    <input type="range" id="preselected-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-preselected-color">↻</button>
                            </div>
                        </div>
                         <div class="input-group color-picker">
                            <label for="preplayable-color">Preplayable</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="preplayable-color" value="#ffffff">
                                    <input type="range" id="preplayable-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-preplayable-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="preplayed-color">Preplayed</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="preplayed-color" value="#ffffff">
                                    <input type="range" id="preplayed-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-preplayed-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="prehovering-color">Prehovering</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="prehovering-color" value="#ffffff">
                                    <input type="range" id="prehovering-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-prehovering-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="disabled-color">Disabled</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="disabled-color" value="#ffffff">
                                    <input type="range" id="disabled-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-disabled-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Promotion Option</legend>
                    <div class="form-group">
                        <div class="input-group color-picker">
                            <label for="promotion-option-color">Background</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="promotion-option-color" value="#ffffff">
                                    <input type="range" id="promotion-option-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-promotion-option-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="promotion-option-outline-color">Outline</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                    <input type="color" id="promotion-option-outline-color" value="#ffffff">
                                    <input type="range" id="promotion-option-outline-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-promotion-option-outline-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group color-picker">
                            <label for="promotion-option-box-shadow-color">Box Shadow</label>
                            <div class="input-group--horizontal">
                                <div class="input-group">
                                     <input type="color" id="promotion-option-box-shadow-color" value="#ffffff">
                                    <input type="range" id="promotion-option-box-shadow-color-opacity" min="0" max="1" step="0.1" value="1">
                                </div>
                                <button class="reset-button" id="reset-promotion-option-box-shadow-color">↻</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <div class="appearance-utilities">
                    <button data-menu-operation="${AppearanceMenuOperation.Reset}">Reset to Default</button>
                    <button data-menu-operation="${AppearanceMenuOperation.ChangeTheme}">Light Mode</button>
                </div>
            </div>
        `);
        this.loadCSS("appearance-menu.css");
    }

    /**
     * This function returns the color and opacity from the hex code.
     */
    private getColorAndOpacityFromHexCode(color: string): {color: string, opacity: string}
    {
        const colorWithoutOpacity: string = color.length > 7 ? color.slice(0, 7) : color;
        const opacityHex = color.length > 7 ? color.slice(-2) : "FF";
        const opacityFloat = parseInt(opacityHex, 16) / 255;
        return {color: colorWithoutOpacity, opacity: opacityFloat.toString()};
    }

    /**
     * This function returns the hex code generated from the color and opacity.
     */
    private getHexCodeFromColorAndOpacity(color: string, opacity: string): string
    {
        const opacityHex = Math.round(parseFloat(opacity) * 255).toString(16).padStart(2, "0");
        return `${color}${opacityHex}`;
    }

    /**
     * This function adds event listeners to the appearance menu.
     */
    private addEventListeners(): void
    {
        const rootComputedStyle = getComputedStyle(document.documentElement);
        document.querySelectorAll("#appearance-menu .color-picker").forEach((colorPicker) => {
            const colorInput = colorPicker.querySelector("input[type='color']") as HTMLInputElement;
            const opacityInput = colorPicker.querySelector("input[type='range']") as HTMLInputElement;
            const resetButton = colorPicker.querySelector(".reset-button") as HTMLButtonElement;

            colorInput.addEventListener("input", () => {
                document.documentElement.style.setProperty(`--chessboard-${colorInput.id}`, colorInput.value);

                LocalStorage.save(
                    LocalStorageKey.CustomAppearance, 
                    {
                        ...LocalStorage.load(LocalStorageKey.CustomAppearance), 
                        [`--chessboard-${colorInput.id}`]: colorInput.value
                    }
                );
            });

            opacityInput.addEventListener("change", () => {
                colorInput.style.opacity = opacityInput.value;

                const colorHexCode = this.getHexCodeFromColorAndOpacity(colorInput.value, opacityInput.value);
                document.documentElement.style.setProperty(`--chessboard-${colorInput.id}`, colorHexCode);

                LocalStorage.save(
                    LocalStorageKey.CustomAppearance, 
                    {
                        ...LocalStorage.load(LocalStorageKey.CustomAppearance), 
                        [`--chessboard-${colorInput.id}`]: colorHexCode
                    }
                );
            });

            resetButton.addEventListener("click", () => {
                const defaultColor = rootComputedStyle.getPropertyValue(`--chessboard-default-${colorInput.id}`);
                document.documentElement.style.setProperty(`--chessboard-${colorInput.id}`, defaultColor);

                const { color, opacity } = this.getColorAndOpacityFromHexCode(defaultColor);
                colorInput.value = color;
                opacityInput.value = opacity;
                colorInput.style.opacity = opacity;

                LocalStorage.save(
                    LocalStorageKey.CustomAppearance, 
                    {
                        ...LocalStorage.load(LocalStorageKey.CustomAppearance), 
                        [`--chessboard-${colorInput.id}`]: defaultColor
                    }
                );
            });
        });
    }

    /**
     * Hide the appearance menu.
     */
    public hide(): void
    {
        document.getElementById("appearance-menu")!.style.display = "none";
    }

    /**
     * Show the appearance menu.
     */
    public show(): void
    {
        document.getElementById("appearance-menu")!.style.display = "block";
    }

    /**
     * Change the theme of the app.
     */
    public changeTheme(theme: Theme = Theme.Dark): void
    {
        const changeThemeButton = document.querySelector(`
            [data-menu-operation="${AppearanceMenuOperation.ChangeTheme}"]
        `) as HTMLButtonElement;

        if(theme === Theme.Light){
            this.currentTheme = Theme.Light;
            document.body.classList.remove(Theme.Dark);
            changeThemeButton.innerText = "Dark Mode";
        }else if(theme === Theme.Dark){
            this.currentTheme = Theme.Dark;
            document.body.classList.add(Theme.Dark);
            changeThemeButton.innerText = "Light Mode";
        }

        LocalStorage.save(LocalStorageKey.Theme, this.currentTheme);
    }

    /**
     * This function shows the last saved if exist, otherwise default color palette.
     */
    public initColorPalette(): void
    {
        let customAppearance;
        if(LocalStorage.isExist(LocalStorageKey.CustomAppearance))
            customAppearance = LocalStorage.load(LocalStorageKey.CustomAppearance);

        const rootComputedStyle = getComputedStyle(document.documentElement);;
        for(const colorPicker of document.querySelectorAll("#appearance-menu .color-picker") as NodeListOf<HTMLInputElement>){
            const colorInput = colorPicker.querySelector("input[type='color']") as HTMLInputElement;
            const opacityInput = colorPicker.querySelector("input[type='range']") as HTMLInputElement;

            let colorHex;
            if(customAppearance && customAppearance[`--chessboard-${colorInput.id}`])
                colorHex = customAppearance[`--chessboard-${colorInput.id}`];
            else
                colorHex = rootComputedStyle.getPropertyValue(`--chessboard-default-${colorInput.id}`);

            const { color, opacity } = this.getColorAndOpacityFromHexCode(colorHex);
            colorInput.value = color;
            opacityInput.value = opacity;
            colorInput.style.opacity = opacity;

            document.documentElement.style.setProperty(`--chessboard-${colorInput.id}`, colorHex);
        }
    }

    /**
     * Handle the appearance menu events.
     */
    public handleOperation(operation: AppearanceMenuOperation): void
    {
        switch(operation){
            case AppearanceMenuOperation.ChangeTheme:
                this.changeTheme(this.currentTheme === Theme.Dark ? Theme.Light : Theme.Dark);
                break;
            case AppearanceMenuOperation.Reset:
                LocalStorage.clear(LocalStorageKey.CustomAppearance);
                this.initColorPalette();
                break;
        }
    }
}