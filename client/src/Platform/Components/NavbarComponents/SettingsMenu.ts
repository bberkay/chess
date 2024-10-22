import { NavbarComponent } from "./NavbarComponent";
import { SettingsMenuOperation } from "@Platform/Types";
import { SETTINGS_MENU_ID, DEFAULT_SETTINGS } from "@Platform/Consts";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";
import { Chess } from "@Chess/Chess";
import { LogConsole } from "./LogConsole";
import { NotationMenu } from "../NotationMenu";

/**
 * This class provide a menu to change the settings
 * of the game and the platform itself.
 */
export class SettingsMenu extends NavbarComponent {
    private _classes: Object[] = [];

    /**
     * Constructor of the SettingsMenu class.
     */
    constructor(...classes: Object[]) {
        super();
        for(const classInstance of classes){
            if(!(classInstance instanceof Object))
                throw new Error("The given object is not an Object.");
            this._classes.push(classInstance);
        }
    }

    /**
     * This function renders the settings menu.
     */
    protected renderComponent(): void {
        this.loadHTML(SETTINGS_MENU_ID, `
            <div id="settings-body">
                <fieldset>
                    <legend>Board</legend>
                    <div class="settings-item">
                        <span>Enable Sound Effects</span>
                        <label class="switch">
                            <input data-menu-operation="${SettingsMenuOperation.EnableSoundEffects}" type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Enable Pre Selection</span>
                        <label class="switch">
                            <input data-menu-operation="${SettingsMenuOperation.EnablePreSelection}" type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Show Highlights</span>
                        <label class="switch">
                            <input data-menu-operation="${SettingsMenuOperation.ShowHighlights}" type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Enable Winner Animation</span>
                        <label class="switch">
                            <input data-menu-operation="${SettingsMenuOperation.EnableWinnerAnimation}" type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Movement Type</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">Dropdown</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                <button class="dropdown-item selected">Link 1</button>
                                <button class="dropdown-item">Link 2</button>
                                <button class="dropdown-item">Link 3</button>
                            </div>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span>Piece Animation Speed</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">Dropdown</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                <button class="dropdown-item selected">Link 1</button>
                                <button class="dropdown-item">Link 2</button>
                                <button class="dropdown-item">Link 3</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Notation Menu</legend>
                    <div class="settings-item">
                        <span>Algebraic Notation Style</span>
                        <div class="dropdown">
                            <button class="dropdown-button"><span class="dropdown-title">Dropdown</span> <span class="down-icon">▾</span></button>
                            <div class="dropdown-content">
                                <button class="dropdown-item selected">Link 1</button>
                                <button class="dropdown-item">Link 2</button>
                                <button class="dropdown-item">Link 3</button>
                            </div>
                        </div>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Log Console</legend>
                    <div class="settings-item">
                        <span>Show Square IDs</span>
                        <label class="switch">
                            <input data-menu-operation="${SettingsMenuOperation.ShowSquareIds}" type="checkbox">
                            <span class="slider round"></span>
                        </label>
                    </div>
                </fieldset>
            </div>
            <div id="settings-footer">
                <div class="settings-utilities">
                    <button data-menu-operation="${SettingsMenuOperation.ResetSettings}">Reset to Default</button>
                    <button data-menu-operation="${SettingsMenuOperation.ClearCache}">Clear Cache</button>
                </div>
            </div>
        `);
        this.loadCSS("settings-menu.css");
        this.loadSettings();
    }

    /**
     * 
     */
    private loadLocalStorage(): void
    {

    }

    /**
     * Show the saved settings on the settings menu if they 
     * exist in local storage. If not, show the default settings.
     */
    private loadSettings(): void
    {        
        if(!LocalStorage.isExist(LocalStorageKey.Settings)){
            LocalStorage.save(LocalStorageKey.Settings, DEFAULT_SETTINGS);
        }
        
        const settings = LocalStorage.load(LocalStorageKey.Settings);
        for(const setting in settings){
            const settingItem = document.querySelector(`#${SETTINGS_MENU_ID} [data-menu-operation="${setting}"]`);
            if(settingItem){
                if(settingItem.getAttribute("type") === "checkbox") {
                    if(settings[setting]){
                        settingItem.setAttribute("checked", "");
                    } else {
                        settingItem.removeAttribute("checked");
                    }

                    this.handleOperation(setting as SettingsMenuOperation, settingItem as HTMLElement);
                }
            }
        }
        
    }

    /**
     * Get the class instance by its class type.
     */
    private getClassInstanceByType(classType: Function): Object | null
    {
        return this._classes.find((c: Object) => c instanceof classType) || null;
    }

    /**
     * 
     */
    private setSomething(operation: SettingsMenuOperation, newValue: any): void
    {
        const settings = LocalStorage.load(LocalStorageKey.Settings);
        settings[operation] = newValue;
        LocalStorage.save(LocalStorageKey.Settings, settings);
    }

    /**
     * Hide the settings menu.
     */
    public hide(): void
    {
        const settingsMenu = document.getElementById(SETTINGS_MENU_ID)!;
        settingsMenu.innerHTML = "";
        settingsMenu.classList.add("hidden");
    }

    /**
     * Show the settings menu.
     */
    public show(): void
    {
        document.getElementById(SETTINGS_MENU_ID)!.classList.remove("hidden");
        this.renderComponent();
    }

    /**
     * Handle the operations of the settings menu.
     */
    public handleOperation(operation: SettingsMenuOperation, menuItem: HTMLElement): void
    {
        const newValue = menuItem.getAttribute("type") === "checkbox" 
            ? menuItem.getAttribute("checked") === null 
            : menuItem.textContent;

        switch(operation){
            case SettingsMenuOperation.ClearCache:
                LocalStorage.clear();
                break;
            case SettingsMenuOperation.ResetSettings:
                LocalStorage.save(LocalStorageKey.Settings, DEFAULT_SETTINGS);
                this.loadSettings();
                break;
            case SettingsMenuOperation.EnableSoundEffects:
                this.setSomething(operation, newValue);
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({ enableSoundEffects: newValue as boolean });
                break;
            case SettingsMenuOperation.EnablePreSelection:
                this.setSomething(operation, newValue);
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({ enablePreSelection: newValue as boolean });
                break;
            case SettingsMenuOperation.ShowHighlights:
                this.setSomething(operation, newValue);
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({ showHighlights: newValue as boolean });
                break;
            case SettingsMenuOperation.EnableWinnerAnimation:
                this.setSomething(operation, newValue);
                (this.getClassInstanceByType(Chess) as Chess)?.board.setConfig({ enableWinnerAnimation: newValue as boolean });
                break;
            case SettingsMenuOperation.ShowSquareIds:
                this.setSomething(operation, newValue);
                (this.getClassInstanceByType(LogConsole) as LogConsole)?.setConfig({ showSquareIds: newValue as boolean });
                break;
        }
    }
}