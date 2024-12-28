import { ChessEvent } from "@ChessPlatform/Chess/Types";
import { DEFAULT_TITLE } from "@ChessPlatform/Consts";
import { SocketEvent } from "@ChessPlatform/Types";

/**
 * PageTitle enum is used to manage the title of the
 * page.
 */
export enum PageTitle{
    LobbyReady = "Invite a Friend",
    JoinLobby = "Join to Game",
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
    private static isEventListenersInitialized: boolean = false;

    /**
     * Sets up event listeners for managing the page title and endpoint
     * based on various socket and game events.
     */
    static initEventListeners(){
        if(Page.isEventListenersInitialized)
            throw new Error("Event listeners are already initialized.");

        document.addEventListener(SocketEvent.onCreatingLobby, (() => {
            Page.removeEndpoint();
            Page.setTitle(PageTitle.LobbyCreating);
        }) as EventListener);

        document.addEventListener(SocketEvent.onLobbyCreated, ((event: CustomEvent) => {
            Page.setEndpoint(event.detail.lobbyId);
            Page.setTitle(PageTitle.LobbyReady);
        }) as EventListener);

        document.addEventListener(SocketEvent.onJoiningLobby, ((event: CustomEvent) => {
            Page.setEndpoint(event.detail.lobbyId);
            Page.setTitle(PageTitle.JoiningLobby);
        }) as EventListener);

        document.addEventListener(SocketEvent.onLobbyJoined, (() => {
            Page.setTitle(PageTitle.WaitingGameToStart);
        }) as EventListener);

        document.addEventListener(SocketEvent.onLobbyCancelled, (() => {
            Page.setDefaultTitle();
            Page.removeEndpoint();
        }) as EventListener);

        document.addEventListener(SocketEvent.onConnectionTerminated, (() => {
            Page.setDefaultTitle();
            Page.removeEndpoint();
        }) as EventListener);

        document.addEventListener(ChessEvent.onGameCreated, (() => {
            Page.setTitle(PageTitle.GameStarted);
        }) as EventListener);

        document.addEventListener(ChessEvent.onPieceMovedByPlayer, (() => {
            // getTitle() == OpponentTurn condition is used for the case
            // when the player plays on "Play By Yourself" mode.
            Page.setTitle(Page.getTitle() === PageTitle.OpponentTurn
                ? PageTitle.YourTurn
                : PageTitle.OpponentTurn);
        }) as EventListener);

        document.addEventListener(ChessEvent.onPieceMovedByOpponent, (() => {
            Page.setTitle(PageTitle.YourTurn);
        }) as EventListener);

        document.addEventListener(ChessEvent.onGameOver, (() => {
            Page.setTitle(PageTitle.GameOver);
        }) as EventListener);

        Page.isEventListenersInitialized = true;
    }

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
     * setDefaultTitle method is used to set the title of the page to the default title.
     */
    static setDefaultTitle(){
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
        if (!endpoint)
            return;

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
