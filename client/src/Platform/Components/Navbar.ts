import { NavbarOperation } from "@Platform/Types";
import { Component } from "./Component";
import { NavbarComponent } from "./NavbarComponents/NavbarComponent";
import { Store, StoreKey } from "@Services/Store";
import {
    ABOUT_MENU_ID,
    APPEARANCE_MENU_ID,
    LOG_CONSOLE_ID,
    NAVBAR_ID,
    SETTINGS_MENU_ID,
} from "@Platform/Consts";
import { LogConsole } from "./NavbarComponents/LogConsole";
import { AboutMenu } from "./NavbarComponents/AboutMenu";
import { SettingsMenu } from "./NavbarComponents/SettingsMenu";
import { AppearanceMenu } from "./NavbarComponents/AppearanceMenu";

/**
 * This class provide a navbar to navigate between components.
 */
export class Navbar extends Component {
    public readonly id: string = NAVBAR_ID;
    private _navbarComponents: NavbarComponent[] = [];
    private _currentlyShownComponent: NavbarComponent | null = null;

    /**
     * Constructor of the Navbar class.
     * @param navbarComponents The components to navigate between.
     */
    constructor(...navbarComponents: NavbarComponent[]) {
        super();
        this.renderComponent();
        for (const component of navbarComponents) {
            if (!(component instanceof NavbarComponent))
                throw new Error(
                    "The given component is not a NavbarComponent."
                );

            this._navbarComponents.push(component);
        }

        this.addNavbarComponentClass();
        this.hideComponents();
        this.loadLocalStorage();
    }

    /**
     * Add the navbar component class to the components.
     */
    private addNavbarComponentClass(): void {
        const aboutMenu = document.getElementById(ABOUT_MENU_ID);
        if (aboutMenu) aboutMenu.classList.add("navbar-component");

        const appearanceMenu = document.getElementById(APPEARANCE_MENU_ID);
        if (appearanceMenu) appearanceMenu.classList.add("navbar-component");

        const logConsole = document.getElementById(LOG_CONSOLE_ID);
        if (logConsole) logConsole.classList.add("navbar-component");

        const settingsMenu = document.getElementById(SETTINGS_MENU_ID);
        if (settingsMenu) settingsMenu.classList.add("navbar-component");
    }

    /**
     * Load the local storage.
     */
    private loadLocalStorage(): void {
        // Welcome message
        if (Store.isExist(StoreKey.WasWelcomeModalShown))
            this.showComponent(this.getComponentByType(LogConsole));
        else {
            this.showComponent(this.getComponentByType(AboutMenu));
            Store.save(StoreKey.WasWelcomeModalShown, true);
        }
    }

    /**
     * This function renders the navbar.
     */
    protected renderComponent(): void {
        this.loadHTML(
            NAVBAR_ID,
            `
            <div class="navbar-buttons">
                <button data-menu-operation="${NavbarOperation.ShowLogConsole}">Stream</button>
                <button data-menu-operation="${NavbarOperation.ShowAppearance}">Appearance</button>
                <button data-menu-operation="${NavbarOperation.ShowSettings}">Settings</button>
                <button data-menu-operation="${NavbarOperation.ShowAbout}">About</button>
            </div>
        `
        );
        this.loadCSS("navbar.css");
    }

    /**
     * Get the component instance by its class type.
     */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    private getComponentByType(classType: Function): NavbarComponent | null {
        return (
            this._navbarComponents.find(
                (c: NavbarComponent) => c instanceof classType
            ) || null
        );
    }

    /**
     * Show the given component.
     */
    public showComponent(navbarComponent: NavbarComponent | null): void {
        if (!navbarComponent)
            throw new Error("The given component cannot be null.");

        if (this._currentlyShownComponent === navbarComponent) return;

        if (!(navbarComponent instanceof NavbarComponent))
            throw new Error("The given component is not a NavbarComponent.");

        if (!this._navbarComponents.includes(navbarComponent))
            throw new Error(
                "The given component is not in the components list."
            );

        this.hideComponents();
        navbarComponent.show();

        this._currentlyShownComponent = navbarComponent;
    }

    /**
     * Hide the components.
     */
    public hideComponents(): void {
        this._navbarComponents.forEach((c: NavbarComponent) => {
            c.hide();
        });

        this._currentlyShownComponent = null;
    }

    /**
     * Handle the given `NavbarOperation`.
     */
    public handleOperation(operation: NavbarOperation): void {
        switch (operation) {
            case NavbarOperation.ShowLogConsole:
                this.showComponent(this.getComponentByType(LogConsole));
                break;
            case NavbarOperation.ShowAppearance:
                this.showComponent(this.getComponentByType(AppearanceMenu));
                break;
            case NavbarOperation.ShowAbout:
                this.showComponent(this.getComponentByType(AboutMenu));
                break;
            case NavbarOperation.ShowSettings:
                this.showComponent(this.getComponentByType(SettingsMenu));
                break;
        }
    }
}
