import { NavbarComponent } from "./NavbarComponent";
import { ABOUT_MENU_ID } from "@Platform/Consts";

/**
 * This class provide a menu to show the about information.
 */
export class AboutMenu extends NavbarComponent{
    public readonly id: string = ABOUT_MENU_ID;
    
    /**
     * Constructor of the AboutMenu class.
     */
    constructor() {
        super();
    }

    /**
     * This function renders the about menu.
     */
    protected renderComponent(): void
    {
        this.loadHTML(ABOUT_MENU_ID, `
            <div id="about-body">
                <h1>Chess Game</h1>
                <p>Chess Game is a web application that allows you to play chess with your friends online.</p>
                <p>It is built using the following technologies:</p>
                <ul>
                    <li>HTML</li>
                    <li>CSS</li>
                    <li>JavaScript</li>
                    <li>Node.js</li>
                    <li>Express</li>
                    <li>Socket.IO</li>
                </ul>
            </div>
        `);
        this.loadCSS("about-menu.css");
    }

    /**
     * Hide the about menu.
     */
    public hide(): void
    {
        const aboutMenu = document.getElementById(ABOUT_MENU_ID)!;
        aboutMenu.innerHTML = "";
        aboutMenu.classList.add("hidden");
    }

    /**
     * Show the about menu.
     */
    public show(): void
    {
        document.getElementById(ABOUT_MENU_ID)!.classList.remove("hidden");
        this.renderComponent();
    }

    /**
     * Handle the operation of the menu.
     */
    public handleOperation(): void
    {
        
    }
}