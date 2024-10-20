import { NavbarComponent } from "./NavbarComponent";
import { SettingsMenuOperation } from "@Platform/Types";
import { SETTINGS_MENU_ID } from "@Platform/Consts";

/**
 * This class provide a menu to change the settings
 * of the game and the platform itself.
 */
export class SettingsMenu extends NavbarComponent {
    /**
     * Constructor of the SettingsMenu class.
     */
    constructor() {
        super();
        this.renderComponent();
    }

    /**
     * This function renders the settings menu.
     */
    protected renderComponent(): void {
        this.loadHTML(SETTINGS_MENU_ID, `
            <div id="settings-body">
                <fieldset>
                    <legend>Game Settings</legend>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <input type="number">
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Game Settings</legend>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>Game Settings</legend>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="settings-item">
                        <span>Board Sounds</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </fieldset>
            </div>
            <div id="settings-footer">
                <div class="settings-utilities">
                    <button data-menu-operation="${SettingsMenuOperation.Reset}">Reset to Default</button>
                </div>
            </div>
        `);
        this.loadCSS("settings-menu.css");
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
    public handleOperation(operation: SettingsMenuOperation): void
    {
        switch(operation){
        }
    }
}