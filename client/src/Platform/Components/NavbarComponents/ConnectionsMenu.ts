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
        //this.showNoConnectionsMessage();
        this.add();

    }

    /**
     * This function renders the connections menu.
     */
    protected renderComponent(): void
    {
        this.loadHTML("connections-menu", `
            <div id="connections-body">
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

    /**
     * Return the HTML code to show the connections.
     */
    private showNoConnectionsMessage(): void
    {
        document.getElementById("connections-body")!.innerHTML = `
            <div class="no-connections">
                <h1>No Connections</h1>
                <span>There are no active games.</span>
            </div>
        `;
    }

    /**
     * 
     */
    public add(): void
    {
        document.getElementById("connections-body")!.innerHTML += `
            <div class="connection">
                <div class="board-preview">
                </div>
                <div class="connection-info">
                    <div class="player" id="black-player">
                        <div class="player-match-info">
                            <div class="indicator">
                                <div class="player-duration">
                                    <span class="minute-second">05:10</span><span class="milliseconds">.01</span>
                                </div>
                                <div class="player-color"></div>
                            </div>
                            <div class="player-info">
                                <span class="player-name">Black Player</span>
                                <span class="player-score">+4</span>
                            </div>
                        </div>
                        <div class="player-last-status">
                            <div class="player-status-icon"></div>
                        </div>
                    </div>
                    <div class="move-history">
                        <span>e3</span>
                        <span>e5</span>
                        <span>Nf3</span>
                        <span>Nc6</span>
                        <span>Bb5</span>
                        <span>a6</span>
                        <span>Ba4</span>
                        <span>Ba8</span>
                        <span>...</span>
                    </div>
                    <div class="player" id="white-player">
                        <div class="player-match-info">
                            <div class="indicator">
                                <div class="player-duration">
                                    <span class="minute-second">05:10</span><span class="milliseconds">.01</span>
                                </div>
                                <div class="player-color"></div>
                            </div>
                            <div class="player-info">
                                <span class="player-name">Black Player</span>
                                <span class="player-score">+4</span>
                            </div>
                        </div>
                        <div class="player-last-status">
                            <div class="player-status-icon"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}