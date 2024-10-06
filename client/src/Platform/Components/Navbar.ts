import { NavbarOperation } from "@Platform/Types";
import { Component } from "./Component";
import { NavbarComponent } from "./NavbarComponents/NavbarComponent";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";

/**
 * This enum represents the different types of components 
 * that can be shown in the navbar.
 */
enum NavbarComponentType {
    LogConsole,
    Connections,
    AppearanceMenu,
    AboutMenu
}

/**
 * This class provide a navbar to navigate between components.
 */
export class Navbar extends Component{
    private readonly navbarComponents: NavbarComponent[];
    private currentlyShownComponent: NavbarComponent | null = null;

    /**
     * Constructor of the Navbar class.
     * @param navbarComponents The components to navigate between.
     */
    constructor(navbarComponents: NavbarComponent[]) {
        super();
        this.renderComponent();
        this.navbarComponents = navbarComponents;
        this.hideComponents();
        this.loadLocalStorage();
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
                <button data-menu-operation="${NavbarOperation.ShowConnections}">Connections</button>
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
        
        if(this.currentlyShownComponent === navbarComponent)
            return;

        if(!this.navbarComponents.includes(navbarComponent))
            throw new Error("The given component is not in the components list.");

        this.navbarComponents.forEach((c: NavbarComponent) => {
            c.hide();
        });

        navbarComponent.show();
        this.currentlyShownComponent = navbarComponent;
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
     * Handle navbar operation.
     */
    public handleOperation(operation: NavbarOperation): void
    {
    }
}
