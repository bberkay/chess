import { NavbarComponent } from "./NavbarComponent";

/**
 * This class provide a menu to show the connections(current games)
 * information.
 */
export class ConnectionsMenu extends NavbarComponent{
    /**
     * Constructor of the About class.
     */
    constructor() {
        super();
        this.renderComponent();
    }

    /**
     * This function renders the connections menu.
     */
    protected renderComponent(): void
    {
        this.loadHTML("connections-menu", `
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
        this.loadCSS("connections-menu.css");
    }

    /**
     * Hide the connections menu.
     */
    public hide(): void
    {
        document.getElementById("connections-menu")!.style.display = "none";
    }

    /**
     * Show the connections menu.
     */
    public show(): void
    {
        document.getElementById("connections-menu")!.style.display = "block";
    }
}