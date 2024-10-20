import { NavbarOperation } from "@Platform/Types";
import { Component } from "./Component";
import { NavbarComponent } from "./NavbarComponents/NavbarComponent";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";
import { ABOUT_MENU_ID, APPEARANCE_MENU_ID, LOG_CONSOLE_ID } from "@Platform/Consts";

/**
 * This enum represents the different types of components 
 * that can be shown in the navbar.
 */
enum NavbarComponentType {
    LogConsole = "LogConsole",
    AppearanceMenu = "AppearanceMenu",
    AboutMenu = "AboutMenu"
}

/**
 * This class provide a navbar to navigate between components.
 */
export class Navbar extends Component{
    private readonly navbarComponents: NavbarComponent[];
    private _currentlyShownComponent: NavbarComponent | null = null;

    /**
     * Constructor of the Navbar class.
     * @param navbarComponents The components to navigate between.
     */
    constructor(navbarComponents: NavbarComponent[]) {
        super();
        this.renderComponent();
        this.navbarComponents = navbarComponents;
        this.addNavbarComponentClass();
        this.hideComponents();
        this.loadLocalStorage();
    }

    /**
     * Add the navbar component class to the components.
     */
    private addNavbarComponentClass(): void { 
        const aboutMenu = document.getElementById(ABOUT_MENU_ID);
        if(aboutMenu) aboutMenu.classList.add("navbar-component");

        const appearanceMenu = document.getElementById(APPEARANCE_MENU_ID);
        if(appearanceMenu) appearanceMenu.classList.add("navbar-component");

        const logConsole = document.getElementById(LOG_CONSOLE_ID);
        if(logConsole) logConsole.classList.add("navbar-component");
    }

    /**
     * Load the local storage.
     */
    private loadLocalStorage(): void
    {
        // Welcome message
        if(LocalStorage.isExist(LocalStorageKey.WelcomeShown))
            this.showComponent(this.getComponentByType(NavbarComponentType.LogConsole)!);
        else{
            this.showComponent(this.getComponentByType(NavbarComponentType.AboutMenu)!);
            LocalStorage.save(LocalStorageKey.WelcomeShown, true);
        }
    }

    /**
     * Get the component by type.
     */
    private getComponentByType(type: NavbarComponentType): NavbarComponent | null
    {
        return this.navbarComponents.find(
            instance => instance.constructor.name === NavbarComponentType[type]
        ) || null;
    }

    /**
     * This function renders the navbar.
     */
    protected renderComponent(): void
    {
        this.loadHTML("navbar", `
            <div class="navbar-buttons">
                <button data-menu-operation="${NavbarOperation.ShowLogConsole}">Stream</button>
                <button data-menu-operation="${NavbarOperation.ShowAppearance}">Appearance</button>
                <button data-menu-operation="${NavbarOperation.ShowAbout}">About</button>
            </div>
        `);
        this.loadCSS("navbar.css");
    }

    /**
     * Show the given component.
     */
    public showComponent(navbarComponent: NavbarComponent): void
    {
        if(!(navbarComponent instanceof NavbarComponent))
            throw new Error("The given component is not a NavbarComponent.");
        
        if(this._currentlyShownComponent === navbarComponent)
            return;

        if(!this.navbarComponents.includes(navbarComponent))
            throw new Error("The given component is not in the components list.");

        this.navbarComponents.forEach((c: NavbarComponent) => {
            c.hide();
        });

        navbarComponent.show();
        this._currentlyShownComponent = navbarComponent;
    }

    /**
     * Hide the components.
     */
    public hideComponents(): void
    {
        this.navbarComponents.forEach((c: NavbarComponent) => {
            c.hide();
        });
    }

    /**
     * Handle the given `NavbarOperation`.
     */
    public handleOperation(operation: NavbarOperation): void
    {
    }
}
