import { DEFAULT_TITLE } from "@ChessPlatform/Consts";

/**
 * PageTitle enum is used to manage the title of the 
 * page.
 */
export enum PageTitle{
    LobbyReady = "Invite a Friend",
    JoinGame = "Join Game",
    WaitingGameToStart = "Waiting for Game to Start",
    GameStarted = "Game Started",
    OpponentTurn = "Waiting for Opponent",
    YourTurn = "Your Turn",
    GameOver = "Game Over",
    LobbyCreating = "Creating Lobby...",
    JoiningLobby = "Joining Game..."
}

/**
 * Page class is used to manage the title of the 
 * page and the endpoint.
 */
export class Page{
    /**
     * getTitle method is used to get the title of the page.
     */
    static getTitle(): string | PageTitle {
        return document.title.split(" | ")[0];
    }

    /**
     * setTitle method is used to set the title of the page.
     */
    static setTitle(title: string | PageTitle){
        document.title = title + " | " + DEFAULT_TITLE;
    }

    /**
     * clearTitle method is used to set the title of the page to the default title.
     */
    static clearTitle(){
        document.title = DEFAULT_TITLE;
    }

    /**
     * getEndpoint method is used to get the endpoint of the page.
     */
    static getEndpoint(): string | null {
        return window.location.pathname.split("/").pop() || null;
    }

    /**
     * setEndpoint method is used to set the endpoint of the page.
     */
    static setEndpoint(endpoint: string): void {
        const url = new URL(window.location.href);
        url.pathname = endpoint;
        window.history.pushState({}, "", url.toString());
    }

    /**
     * addEndpoint method is used to add an endpoint to the page.
     */
    static addEndpoint(endpoint: string): void {
        const url = new URL(window.location.href);
        url.pathname += endpoint;
        window.history.pushState({}, "", url.toString());
    }

    /**
     * removeEndpoint method is used to remove the endpoint from the page.
     */
    static removeEndpoint(): void {
        const url = new URL(window.location.href);
        url.pathname = "/";
        window.history.pushState({}, "", url.toString());
    }
}