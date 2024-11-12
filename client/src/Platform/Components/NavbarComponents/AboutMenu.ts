import { REPOSITORY_URL } from "@ChessPlatform/Consts";
import { NavbarComponent } from "./NavbarComponent";
import { ABOUT_MENU_ID } from "@Platform/Consts";

/**
 * This class provide a menu to show the about information.
 */
export class AboutMenu extends NavbarComponent {
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
    protected renderComponent(): void {
        /*this.loadHTML(
            ABOUT_MENU_ID,
            `
            <div class="about-body">
                <h1>Chess Platform</h1>
                <p class="intro">Chess Platform is a web application (and portfolio project) that allows you to play chess against yourself, a friend, or the Stockfish engine with adjustable difficulty levels. While the project does not use advanced chess programming techniques (such as 0x88 or bitboards), it fully implements all chess rules. The client side is developed entirely in <b>TypeScript</b> and tested with <b>Vitest</b>, while the server side is built using <b>Bun.js</b>.</p>
                <p class="repo">More information about the project can be found on the <a href="${REPOSITORY_URL}" target="_blank">GitHub repository</a>.</p>
            </div>
        `
        );
        this.loadCSS("about-menu.css");*/
    }

    /**
     * Hide the about menu.
     */
    public hide(): void {
        const aboutMenu = document.getElementById(ABOUT_MENU_ID)!;
        aboutMenu.innerHTML = "";
        aboutMenu.classList.add("hidden");
    }

    /**
     * Show the about menu.
     */
    public show(): void {
        document.getElementById(ABOUT_MENU_ID)!.classList.remove("hidden");
        this.renderComponent();
    }

    /**
     * Handle the operation of the menu.
     */
    public handleOperation(): void {}
}
