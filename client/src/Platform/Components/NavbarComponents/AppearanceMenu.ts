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
    private rootComputedStyle = getComputedStyle(document.documentElement);
    private isChessboardCssLoaded = false;

    /**
     * Constructor of the AppearanceMenu class.
     */
    constructor() {
        super();
        this.createStyleElement();
    }

    /**
     * This function renders the appearance menu.
     */
    protected renderComponent(): void
    {
        const getTitleOfCssProp = (str: string) => {
            str = str.replace("-color", "");
            str = str.replace(/-/g, " ");
            return str
                .split(" ")
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")
        };

        this.loadHTML("appearance-menu", `
            <div id="appearance-body">
                ${
                    Array.from(this.rootComputedStyle).filter((property) => 
                        property.startsWith("--chessboard-") &&
                        property.endsWith("-color") &&
                        !property.startsWith("--chessboard-default-")
                    ).reverse().map((property) => {
                        const colorId = property.replace("--chessboard-", "");
                        return `
                            <div class="input-group color-picker">
                                <label for="${colorId}">${getTitleOfCssProp(colorId)}</label>
                                <div class="input-group--horizontal">
                                    <div class="input-group">
                                        <input type="color" id="${colorId}" value="#ffffff">
                                        <input type="range" id="${colorId}-opacity" min="0" max="1" step="0.1" value="1">
                                    </div>
                                    <button class="reset-button" id="reset-${colorId}">↻</button>
                                </div>
                            </div>
                        `;
                    }).join("")
                }
            </div>
            <div id="appearance-footer">
                <div class="appearance-utilities">
                    <button data-menu-operation="${AppearanceMenuOperation.Reset}">Reset to Default</button>
                    <button data-menu-operation="${AppearanceMenuOperation.ChangeTheme}">Light Mode</button>
                </div>
            </div>
        `);

        this.loadCSS("appearance-menu.css");
    }

    /**
     * Check the chessboard css is loaded. If it is loaded, 
     * render the component and add event listeners.
     */
    private checkChessboardCss(): void
    {
        if(this.isChessboardCssLoaded) return;

        this.rootComputedStyle = getComputedStyle(document.documentElement);
        if(Array.from(this.rootComputedStyle).find((property) => property.startsWith("--chessboard-"))){
            this.renderComponent();
            this.addEventListeners();
            this.isChessboardCssLoaded = true;
        }
    }

    /**
     * This function creates the style element for custom appearance styles.
     */
    private createStyleElement(): void
    {
        if(document.getElementById("appearance-menu-style"))
            throw new Error("Style element for custom appearance already exists.");

        const styleElement = document.createElement("style");
        styleElement.id = "appearance-menu-style";
        document.head.appendChild(styleElement);
        styleElement.innerHTML = `:root{}`;
    }

    /**
     * Get the style element for custom appearance styles.
     */
    private getStyleElement(): HTMLStyleElement
    {
        if(document.getElementById("appearance-menu-style"))
            return document.getElementById("appearance-menu-style") as HTMLStyleElement;
        else
            throw new Error("Style element for custom appearance does not exist.");
    }

    /**
     * This function returns the default hex code of the color.
     */
    private getDefaultHexCode(colorId: string): string {
        return this.rootComputedStyle.getPropertyValue(`--chessboard-default-${colorId}`);
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
     * Add custom appearance style to the style element.
     */
    private addCustomAppearanceStyle(varName: string, value: string): void
    {
        const styleElement = this.getStyleElement();

        const isExist = styleElement.innerHTML.includes(`--chessboard-${varName}`);
        styleElement.innerHTML = styleElement.innerHTML.replace(
            isExist ? new RegExp(`--chessboard-${varName}: .+?;`) : `}`, 
            `--chessboard-${varName}: ${value};` + (isExist ? "" : "}")
        );

        LocalStorage.save(
            LocalStorageKey.CustomAppearance, 
            {
                ...LocalStorage.load(LocalStorageKey.CustomAppearance), 
                [varName]: value
            }
        );
    }

    /**
     * This function adds event listeners to the appearance menu.
     */
    private addEventListeners(): void
    {
        document.querySelectorAll("#appearance-menu .color-picker").forEach((colorPicker) => {
            const colorInput = colorPicker.querySelector("input[type='color']") as HTMLInputElement;
            const opacityInput = colorPicker.querySelector("input[type='range']") as HTMLInputElement;
            const resetButton = colorPicker.querySelector(".reset-button") as HTMLButtonElement;

            colorInput.addEventListener("input", () => {
                this.addCustomAppearanceStyle(colorInput.id, colorInput.value);
            });

            opacityInput.addEventListener("change", () => {
                colorInput.style.opacity = opacityInput.value;

                this.addCustomAppearanceStyle(
                    colorInput.id, 
                    this.getHexCodeFromColorAndOpacity(colorInput.value, opacityInput.value)
                );
            });

            resetButton.addEventListener("click", () => {
                const defaultColor = this.getDefaultHexCode(colorInput.id);
                this.addCustomAppearanceStyle(colorInput.id, defaultColor);

                const { color, opacity } = this.getColorAndOpacityFromHexCode(defaultColor);
                colorInput.value = color;
                opacityInput.value = opacity;
                colorInput.style.opacity = opacity;
            });
        });
    }

    /**
     * This function shows the last saved if exist, otherwise default color palette.
     */
    public initColorPalette(): void
    {        
        this.checkChessboardCss();

        let customAppearance;
        if(LocalStorage.isExist(LocalStorageKey.CustomAppearance))
            customAppearance = LocalStorage.load(LocalStorageKey.CustomAppearance);

        for(const colorPicker of document.querySelectorAll("#appearance-menu .color-picker") as NodeListOf<HTMLInputElement>){
            const colorInput = colorPicker.querySelector("input[type='color']") as HTMLInputElement;
            const opacityInput = colorPicker.querySelector("input[type='range']") as HTMLInputElement;

            let colorHex;
            if(customAppearance && Object.hasOwn(customAppearance, colorInput.id))
                colorHex = customAppearance[colorInput.id];
            else
                colorHex = this.getDefaultHexCode(colorInput.id);

            const { color, opacity } = this.getColorAndOpacityFromHexCode(colorHex);
            colorInput.value = color;
            opacityInput.value = opacity;
            colorInput.style.opacity = opacity;

            this.addCustomAppearanceStyle(colorInput.id, colorHex);
        }
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