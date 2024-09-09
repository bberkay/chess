/**
 * @module Platform
 * @description This class is the main class of the chess platform menu. It provides the components of the menu and connections between the chess and menu.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from "@Chess/Chess";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage.ts";
import { BoardEditor } from "./Components/BoardEditor.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { LogConsole } from "./Components/LogConsole";
import { NavigatorModal } from "./Components/NavigatorModal";
import { BoardEditorOperation, LogConsoleOperation, MenuOperation, NavigatorModalOperation, NotationMenuOperation } from "./Types";
import { WsMessage, WsCommand } from "../Types";
import { Logger } from "@Services/Logger";
import { Color, GameStatus, JsonNotation, PieceType, StartPosition } from "@Chess/Types/index.ts";

const DEFULT_PLAYER_NAME = "Anonymous";

/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform{

    private readonly chess: Chess;
    private readonly boardEditor: BoardEditor;
    private readonly notationMenu: NotationMenu;
    private readonly logConsole: LogConsole;
    private readonly navigatorModal: NavigatorModal;
    public readonly logger: Logger = new Logger("src/Platform/Platform.ts");
    private socket: WebSocket | null = null;
    private menuOperationItems: Array<Element> = [];

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.boardEditor = new BoardEditor(this.chess);
        this.notationMenu = new NotationMenu(this.chess);
        this.logConsole = new LogConsole();
        this.navigatorModal = new NavigatorModal();
        this.init();

        //For testing purposes
        document.addEventListener("keydown", (event) => {
            if(event.ctrlKey && event.key === " ")
                LocalStorage.clear();
        });
    }

    /**
     * Initialize the platform by checking the cache and 
     * handling the menu operations.
     */
    private init(): void
    {
        document.addEventListener("DOMContentLoaded", () => {
            if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled))
                this._enableBoardEditor();

            if(!LocalStorage.isExist(LocalStorageKey.WelcomeShown))
            {
                this.navigatorModal.showWelcome();
                LocalStorage.save(LocalStorageKey.WelcomeShown, true);
            }
  
            if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)){
                this.reconnectLobby();
            }
            else{
                if(!this.checkAndLoadGameFromCache()) 
                    this.boardEditor.createBoard();                 
                if(this.checkAndGetLobbyIdFromUrl()) 
                    this.navigatorModal.showJoinLobby();
            }

            this.listenBoardChanges();
            this.bindMenuOperations();
            this.updateComponents();
        });
        
        this.logger.save("Cache is checked, last game/lobby is loaded if exists. Menu operations are binded.");
    }

    /**
     * Check the lobby id from the url and return it if exists.
     */
    private checkAndGetLobbyIdFromUrl(): string | null
    {
        const lobbyId = window.location.pathname.split("/").pop(); 
        return lobbyId || null;
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Services/LocalStorage.ts
     */
    public checkAndLoadGameFromCache(): boolean
    {
        // If there is a game in the cache, load it.
        if(LocalStorage.isExist(LocalStorageKey.LastBoard)){
            this.logger.save("Game loading from cache...");
            this.boardEditor.createBoard(LocalStorage.load(LocalStorageKey.LastBoard));
            this.logger.save("Game loaded from cache");
            return true;
        }

        this.logger.save("No games found in cache");
        return false;
    }

    /**
     * Create a new lobby with the given player name
     */
    private createLobby(playerName: string): void
    {  
        this.createAndHandleWebSocket(new URLSearchParams({
            playerName: (playerName || DEFULT_PLAYER_NAME),
        }).toString());
    }

    /**
     * Connect to the lobby with the given lobby id.
     */
    private joinLobby(playerName: string): void
    {
        const lobbyId = this.checkAndGetLobbyIdFromUrl();
        if(!lobbyId) throw new Error("Lobby id is not found in the url.");

        this.createAndHandleWebSocket(new URLSearchParams({
            playerName: (playerName || DEFULT_PLAYER_NAME),
            lobbyId: lobbyId
        }).toString());
    }

    /**
     * Reconnect the last lobby that the user connected.
     */
    private reconnectLobby(): void
    {
        if(!LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)) return;

        const lastLobbyConnection = LocalStorage.load(LocalStorageKey.LastLobbyConnection);
        this.createAndHandleWebSocket(new URLSearchParams({
            lobbyId: lastLobbyConnection.lobbyId,
            userToken: lastLobbyConnection.userToken
        }).toString());
    }

    /**
     * Handle the websocket socket connection and listen the
     * messages from the server.
     */
    private createAndHandleWebSocket(webSocketEndpoint: string): void
    {
        /**
         * Parse the websocket response returned from the server.
         * @example [Connected, {lobbyId: "1234"}]
         * @example [Started, {lobbyId: "1234", board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"}]
         */
        function parseWsResponse(event: MessageEvent): [WsCommand, any] {
            const [ wsCommand, wsData ] = event.data.split(/ (.+)/);
            return [wsCommand, JSON.parse(wsData)];
        }    

        if(webSocketEndpoint.length > Number(import.meta.env.VITE_WS_ENDPOINT_MAX_LENGTH))
            throw new Error("The WebSocket URL is too long.");

        if(this.socket){
            this.socket.close();
            this.socket = null;
        }

        this.socket = new WebSocket(import.meta.env.VITE_WS_ADDRESS + (webSocketEndpoint ? "?" + webSocketEndpoint : ""));
        this.socket.onopen = (event) => {

        };

        this.socket.onmessage = (event) => {
            const [wsCommand, wsData] = parseWsResponse(event);
            switch(wsCommand){
                case WsCommand.Connected:
                    if(!this.checkAndGetLobbyIdFromUrl()){
                        const url = new URL(window.location.href);
                        url.pathname = wsData.lobbyId;
                        window.history.pushState({}, "", url.toString());
                    }

                    LocalStorage.save(
                        LocalStorageKey.LobbyConnections, 
                        (LocalStorage.load(LocalStorageKey.LobbyConnections) || []).concat(wsData)
                    );
                    LocalStorage.save(LocalStorageKey.LastLobbyConnection, wsData);
                    this.navigatorModal.showLobbyInfo(window.location.origin + "/" + wsData.lobbyId);

                    this.logger.save(`Connected to the lobby[${wsData.lobbyId}] as ${wsData.playerName}[${wsData.color}].`);
                    break;
                case WsCommand.Started:
                    if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled)) 
                        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);

                    this._createBoard(wsData);
                    break;
            }

            this.bindMenuOperations();
        };

        this.socket.onclose = (event) => {
            // if(onPurpose)
            //    LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        };
    }

    /**
     * Listen actions/clicks of user on menu squares for
     * updating the notation menu, log console etc.
     */
    private listenBoardChanges(): void
    {
        // Update first time
        this.boardEditor.updateFen();

        const observer = new MutationObserver(() => {
            this.updateComponents();
        });

        observer.observe(
            document.getElementById("chessboard")!, 
            { 
                childList: true, 
                subtree: true,
                attributes: true,
                characterData: true
            }
        );

        this.logger.save("Board changes are listening...");
    }

    /**
     * Find the menu operations and bind them to the menu 
     * items. When the user clicks on the menu item, the
     * operation will be executed.
     */
    protected bindMenuOperations(): void
    {
        (document.querySelectorAll("[data-menu-operation]") as NodeListOf<HTMLElement>).forEach((menuItem: HTMLElement) => {
            if(this.menuOperationItems.length == 0 || !this.menuOperationItems.includes(menuItem)){
                menuItem.addEventListener("click", () => { this.handleMenuOperation(menuItem) });
                this.menuOperationItems.push(menuItem);
            }
        });
    }

    /**
     * This function makes an operation on menu.
     */
    protected handleMenuOperation(menuItem: HTMLElement): void
    {
        const menuOperation = menuItem.getAttribute("data-menu-operation") as MenuOperation;
        if(LogConsoleOperation.hasOwnProperty(menuOperation))
            this.handleLogConsoleOperation(
                menuOperation as LogConsoleOperation, 
                menuItem
            );
        else if(NavigatorModalOperation.hasOwnProperty(menuOperation))
            this.handleNavigatorModalOperation(
                menuOperation as NavigatorModalOperation, 
                menuItem
            );
        else if(NotationMenuOperation.hasOwnProperty(menuOperation))
            this.handleNotationMenuOperation(
                menuOperation as NotationMenuOperation, 
                menuItem
            );
        else if(BoardEditorOperation.hasOwnProperty(menuOperation))
            this.handleBoardEditorOperation(
                menuOperation as BoardEditorOperation, 
                menuItem
            );

        this.bindMenuOperations();
    }
    
    /**
     * Handle the log console operations.
     */
    private handleLogConsoleOperation(menuOperation: LogConsoleOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
            case LogConsoleOperation.Clear:
                this.logConsole.clear();
                break;
        }
    }

    /**
     * Handle the navigator modal operations.
     */
    private handleNavigatorModalOperation(menuOperation: NavigatorModalOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
            case NavigatorModalOperation.ShowWelcome:
                this.navigatorModal.showWelcome();
                break;
            case NavigatorModalOperation.Hide:
                this.navigatorModal.hide();
                break;
            case NavigatorModalOperation.Undo:
                this.navigatorModal.undo();
                break;
            case NavigatorModalOperation.AskConfirmation:
                this.navigatorModal.showConfirmation();
                break;
            case NavigatorModalOperation.ShowGameCreator:
                this.navigatorModal.showGameCreator();
                break;
            case NavigatorModalOperation.ShowStartPlayingBoard:
                this.navigatorModal.showStartPlayingBoard();
                break;
            case NavigatorModalOperation.PlayAgainstBot:
                this.navigatorModal.showPlayAgainstBot();
                break;
            case NavigatorModalOperation.ShowCreateLobby:
                this.navigatorModal.showCreateLobby();
                break
            case NavigatorModalOperation.ShowJoinLobby:
                this.navigatorModal.showJoinLobby();
                break;
            case NavigatorModalOperation.PlayWithYourself:
                this._playWithYourself();
                break;
            case NavigatorModalOperation.CreateLobby:
                this._createLobby();
                break;
            case NavigatorModalOperation.JoinLobby:
                this._joinLobby();
                break;
            case NavigatorModalOperation.EnableBoardEditor:
                this._enableBoardEditor();
                break;
            case NavigatorModalOperation.CancelGame:
                this._cancelGame();
                break;
        }
    }

    /**
     * Handle the notation menu operations.
     */
    private handleNotationMenuOperation(menuOperation: NotationMenuOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
            /*case NotationMenuOperation.SendDrawOffer:
                this.chess.sendDrawOffer();
                break;
            case NotationMenuOperation.SendUndoOffer:
                this.chess.sendUndoOffer();
                break;
            case NotationMenuOperation.Resign:
                this.chess.resign();
                break;
            case NotationMenuOperation.PreviousMove:
                this.chess.previousMove();
                break;
            case NotationMenuOperation.NextMove:
                this.chess.nextMove();
                break;
            case NotationMenuOperation.FirstMove:
                this.chess.firstMove();
                break;
            case NotationMenuOperation.LastMove:
                this.chess.lastMove();
                break;*/
            case NotationMenuOperation.ToggleNotationMenuUtilityMenu:
                this.notationMenu.toggleUtilityMenu();
                break;
        }
    }

    /**
     * Handle the board editor operations.
     */
    private handleBoardEditorOperation(menuOperation: BoardEditorOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
            case BoardEditorOperation.ToggleBoardEditorUtilityMenu:
                this.boardEditor.toggleUtilityMenu();
                break;
            case BoardEditorOperation.ChangeBoardCreatorMode:
                this.boardEditor.changeBoardCreatorMode();
                break;
            case BoardEditorOperation.FlipBoard:
                this._flipBoard();
                break;
            case BoardEditorOperation.ResetBoard:
                this._resetBoard();
                break;
            case BoardEditorOperation.CreateBoard:
                this._createBoard();
                break;
            case BoardEditorOperation.ClearBoard:
                this.boardEditor.clearBoard();
                break;
            case BoardEditorOperation.CreatePiece:
                this.boardEditor.createPiece(menuItem);
                break;
            case BoardEditorOperation.RemovePiece:
                this.boardEditor.removePiece(menuItem);
                break;
            case BoardEditorOperation.EnableMovePieceCursorMode:
                this.boardEditor.enableMovePieceCursorMode();
                break;
            case BoardEditorOperation.EnableRemovePieceCursorMode:
                this.boardEditor.enableRemovePieceCursorMode();
                break;
        }
    }

    /**
     * Update the components of the menu, for example
     * update the notation menu and print the logs of the game on log
     * console after the move is made.
     */
    private updateComponents(): void {
        this.logConsole.stream();
        this.boardEditor.updateFen();

        if(!this.boardEditor.isEditorModeEnable()){
            this.notationMenu.update()

            const gameStatus = this.chess.engine.getGameStatus();
            if([GameStatus.BlackVictory, GameStatus.WhiteVictory,GameStatus.Draw].includes(gameStatus))
                this.navigatorModal.showGameOver(gameStatus);
            else if (gameStatus === GameStatus.NotReady)
                this.navigatorModal.showBoardNotReady();

            this.bindMenuOperations();
        }
    }

    /**
     * Clear the components of the menu like log console, 
     * notation menu etc.
     */
    private clearComponents(){
        this.logConsole.clear();
        if(!this.boardEditor.isEditorModeEnable()) this.notationMenu.clear();
    }

    /**
     * Create a new lobby with the given player name.
     */
    private _createLobby(): void
    {
        this.createLobby((document.getElementById("player-name") as HTMLInputElement).value);
    }

    /**
     * Join the lobby with the given player name and url lobby id.
     */
    private _joinLobby(): void
    {
        this.joinLobby((document.getElementById("player-name") as HTMLInputElement).value);
    }

    /**
     * Cancel the game and close the socket connection
     */
    private _cancelGame(): void
    {
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        this.navigatorModal.hide();
        this.socket?.close();
        this.notationMenu.setUtilityMenuToNewGame();
        this.chess.board.lock();
    }

    /**
     * Enable the board editor and clear the components of the menu.
     */
    private _enableBoardEditor(): void
    {
        this.navigatorModal.hide();
        if(this.boardEditor.isEditorModeEnable()) return;
        this.clearComponents();
        this.boardEditor.enableEditorMode();
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        LocalStorage.save(LocalStorageKey.BoardEditorEnabled, true);
        this.logger.save("Board editor is enabled.");
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _createBoard(notation: string | StartPosition | JsonNotation | null = null): void 
    {
        this.navigatorModal.hide();
        this.clearComponents();
        this.boardEditor.createBoard(notation);
        this.logger.save(`Board is created and components are updated.`);
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _playWithYourself(fenNotation: string | null = null): void 
    {
        this.navigatorModal.hide();
        this.boardEditor.disableEditorMode();
        this.logConsole.clear();
        this.boardEditor.createBoard(fenNotation);
        this.notationMenu.recreate();
        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
        this.logger.save(`Editor mode is disabled and notation menu is recreated.`);
    }

    /**
     * Flip the board and notation menu.
     */
    private _flipBoard(): void
    {
        this.boardEditor.flipBoard();
        if(!this.boardEditor.isEditorModeEnable())
            this.notationMenu.flip();
    }

    /**
     * Reset the board and update the components of the menu.
     */
    private _resetBoard(): void
    {
        this.logConsole.clear();
        this.boardEditor.resetBoard();
        this.logger.save("Board is reset.");
    }
}
