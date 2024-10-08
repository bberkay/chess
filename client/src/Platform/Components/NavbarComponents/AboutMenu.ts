import { NavbarComponent } from "./NavbarComponent";

/**
 * This class provide a menu to show the about information.
 */
export class AboutMenu extends NavbarComponent{
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
        this.loadHTML("about-menu", `
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
        document.getElementById("about-menu")!.innerHTML = "";
    }

    /**
     * Show the about menu.
     */
    public show(): void
    {
        this.renderComponent();
    }
}