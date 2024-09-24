import { NavbarComponent } from "./NavbarComponent";
import { AppearanceMenuOperation } from "../../Types";

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
                        <div class="input-group">
                            <label for="white-square-color">White</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="white-square-color" value="#ffffff">
                                <button id="reset-white-square-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="black-square-color">Black</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="black-square-color" value="#ffffff">
                                <button id="reset-black-square-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="border-color">Border</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="border-color" value="#ffffff">
                                <button id="reset-border-color">↻</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Piece Effects</legend>
                    <div class="form-group">
                        <div class="input-group">
                            <label for="selected-color">Selected</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="selected-color" value="#ffffff">
                                <button id="reset-selected-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="playable-color">Playable</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="playable-color" value="#ffffff">
                                <button id="reset-playable-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="checked-color">Checked</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="checked-color" value="#ffffff">
                                <button id="reset-checked-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group">
                            <label for="from-color">From</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="from-color" value="#ffffff">
                                <button id="reset-from-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="to-color">To</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="to-color" value="#ffffff">
                                <button id="reset-to-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="hovering-color">Hovering</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="hovering-color" value="#ffffff">
                                <button id="reset-hovering-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group">
                            <label for="preselected-color">Preselected</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="preselected-color" value="#ffffff">
                                <button id="reset-preselected-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="preplayable-color">Preplayable</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="preplayable-color" value="#ffffff">
                                <button id="reset-preplayable-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="preplayed-color">Preplayed</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="preplayed-color" value="#ffffff">
                                <button id="reset-preplayed-color">↻</button>
                            </div>
                        </div>
                    </div>
                    <div class="separator"></div>
                    <div class="form-group">
                        <div class="input-group">
                            <label for="prehovering-color">Prehovering</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="prehovering-color" value="#ffffff">
                                <button id="reset-prehovering-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="disabled-color">Disabled</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="disabled-color" value="#ffffff">
                                <button id="reset-disabled-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Promotion Option</legend>
                    <div class="form-group">
                        <div class="input-group">
                            <label for="promotion-option-color">Background</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="promotion-option-color" value="#ffffff">
                                <button id="reset-promotion-option-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="promotion-option-outline-color">Outline</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="promotion-option-outline-color" value="#ffffff">
                                <button id="reset-promotion-option-outline-color">↻</button>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="promotion-option-box-shadow-color">Box Shadow</label>
                            <div class="input-group--horizontal">
                                <input type="color" id="promotion-option-box-shadow-color" value="#ffffff">
                                <button id="reset-promotion-option-box-shadow-color">↻</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <div class="appearance-utilities">
                    <button data-menu-operation="${AppearanceMenuOperation.Reset}">Reset to Default</button>
                    <button data-menu-operation="${AppearanceMenuOperation.ChangeTheme}">Dark Mode</button>
                </div>
            </div>
        `);
        this.loadCSS("appearance-menu.css");
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
    private changeTheme(): void
    {
        const changeThemeButton = document.querySelector(`
            [data-menu-operation="${AppearanceMenuOperation.ChangeTheme}"]
        `) as HTMLButtonElement;
        if(this.currentTheme === Theme.Dark){
            this.currentTheme = Theme.Light;
            document.body.classList.remove(Theme.Dark);
            changeThemeButton.innerText = "Light Mode";
        }else{
            this.currentTheme = Theme.Dark;
            document.body.classList.add(Theme.Dark);
            changeThemeButton.innerText = "Dark Mode";
        }
    }

    /**
     * Show the default color palette.
     */
    private showDefaultColorPalette(): void
    {
        const rootComputedStyle = getComputedStyle(document.documentElement);
        for(const input of document.querySelectorAll("#appearance-menu input[type='color']") as NodeListOf<HTMLInputElement>){
            input.value = rootComputedStyle.getPropertyValue(`--chessboard-default-${input.id}`);
        }
    }

    /**
     * Show the last chosen color palette.
     */
    public showLastColorPalette(): void
    {
        this.showDefaultColorPalette();
    }

    /**
     * Handle the appearance menu events.
     */
    public handleOperation(operation: AppearanceMenuOperation): void
    {
        switch(operation){
            case AppearanceMenuOperation.Reset:
                this.showDefaultColorPalette();
                break;
            case AppearanceMenuOperation.ChangeTheme:
                this.changeTheme();
                break;
        }
    }
}