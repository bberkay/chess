import { NavbarOperation } from "@Platform/Types";
import { Component } from "./Component";
import { NavbarComponent } from "./NavbarComponents/NavbarComponent";

/**
 * This class provide a navbar to navigate between components.
 */
export class Navbar extends Component{
    private readonly navbarComponents: NavbarComponent[];

    /**
     * Constructor of the Navbar class.
     * @param navbarComponents The components to navigate between.
     */
    constructor(navbarComponents: NavbarComponent[]) {
        super();
        this.renderComponent();
        this.navbarComponents = navbarComponents;
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
        
        if(!this.navbarComponents.includes(navbarComponent))
            throw new Error("The given component is not in the components list.");

        this.navbarComponents.forEach((c: NavbarComponent) => {
            c.hide();
        });

        navbarComponent.show();
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
        switch(operation)
        {
            default:
                throw new Error("The given operation is not supported.");
        }
    }
}
