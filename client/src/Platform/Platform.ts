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
import { Color, GameStatus, PieceType } from "@Chess/Types/index.ts";

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
    }

    /**
     * Initialize the platform by checking the cache and 
     * handling the menu operations.
     */
    private init(): void
    {
        if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection)){
            // @ts-ignore
            this.connectToLobby(LocalStorage.load(LocalStorageKey.LastLobbyConnection));
        }
        else{
            const lobbyId = window.location.pathname.split("/").pop(); 
            if(lobbyId)
                this.connectToLobby(lobbyId);
        }

        document.addEventListener("DOMContentLoaded", () => {
            if(!this.checkAndLoadGameFromCache())
                this.boardEditor.createBoard();

            if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled))
                this._enableBoardEditor();
        
            if(!LocalStorage.isExist(LocalStorageKey.WelcomeShown))
            {
                this.navigatorModal.showWelcome();
                LocalStorage.save(LocalStorageKey.WelcomeShown, true);
            }

            this.listenBoardChanges();
            this.bindMenuOperations();
            this.updateComponents();
        });
        
        this.logger.save("Cache is checked, last game/lobby is loaded if exists. Menu operations are binded.");
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
     * Parse the websocket message returned from the server.
     * @example [Connected, {lobbyId: "1234"}]
     * @example [Started, "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"]
     */
    private _parseWsMessage(event: MessageEvent): [WsCommand, any] {
        const [ wsCommand, wsData ] = event.data.split(/ (.+)/);
        return [wsCommand, wsData.startsWith("{") ? JSON.parse(wsData) : wsData];
    }

    /**
     * Connect to the lobby with the given lobby id.
     */
    private connectToLobby(lobbyId: string | null = null): void
    {
        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);

        // @ts-ignore
        this.socket = new WebSocket(import.meta.env.VITE_WS_ADDRESS + (lobbyId ? "/" + lobbyId : ""));
        
        this.socket.addEventListener("open", event => {

        });

        this.socket.addEventListener("message", event => {
            const [wsCommand, wsData] = this._parseWsMessage(event);
            switch(wsCommand){
                case WsCommand.Connected:
                    this.navigatorModal.showLobbyInfo(window.location.origin + "/" + wsData.lobbyId);
                    // LocalStorage.save(LocalStorageKey.LastLobbyConnection, {lobbyId: lobbyId, color: data.color});
                    this.logger.save("Connected to the lobby[" + lobbyId + "] as " + wsData.color + " player.");
                    break;
                case WsCommand.Started:
                    this._createBoard(wsData);
                    break;
            }

            this.bindMenuOperations();
        });

        this.socket.addEventListener("close", event => {
            // if(onPurpose)
            //    LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        });
    }

    /**
     * Listen actions/clicks of user on menu squares for
     * updating the notation menu, log console etc.
     */
    private listenBoardChanges(): void
    {
        const observer = new MutationObserver(() => {
            this.updateComponents();
        });

        observer.observe(document.getElementById("chessboard")!, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true
        });

        this.logger.save("Board changes are listening...");
    }

    /**
     * Find the menu operations and bind them to the menu 
     * items. When the user clicks on the menu item, the
     * operation will be executed.
     */
    protected bindMenuOperations(): void
    {
        /**
         * Create a tooltip for the menu item by data-tooltip-text 
         * attribute of the menu item.
         */
        function createTooltipOfMenuItem(menuItem: HTMLElement): void
        {
            const tooltipText = menuItem.getAttribute("data-tooltip-text");
            if(!tooltipText) return;

            const tooltipElement = document.createElement("div");
            tooltipElement.classList.add("tooltip");
            menuItem.append(tooltipElement);

            let tooltipTimeout: number | Timer | undefined;
            menuItem.addEventListener("mouseover", function() {
                tooltipTimeout = setTimeout(() => {
                    tooltipElement.classList.add("active");
                    tooltipElement.textContent = tooltipText;
                }, 500);
            });

            menuItem.addEventListener("mouseout", function() {
                clearTimeout(tooltipTimeout);
                tooltipElement.classList.remove("active");
                tooltipElement.textContent = "";
            });

            menuItem.addEventListener("mousedown", function(e) {
                e.preventDefault();
                clearTimeout(tooltipTimeout);
                tooltipElement.classList.remove("active");
                tooltipElement.textContent = "";
            });
        }

        (document.querySelectorAll("[data-menu-operation]") as NodeListOf<HTMLElement>).forEach((menuItem: HTMLElement) => {
            if(this.menuOperationItems.length == 0 || !this.menuOperationItems.includes(menuItem)){
                menuItem.addEventListener("click", () => { this.handleMenuOperation(menuItem) });
                createTooltipOfMenuItem(menuItem);
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
            case NavigatorModalOperation.Hide:
                this.navigatorModal.hide();
                break;
            case NavigatorModalOperation.Undo:
                this.navigatorModal.undo();
                break;
            case NavigatorModalOperation.ShowGameCreator:
                this.navigatorModal.showGameCreator();
                break;
            case NavigatorModalOperation.ShowWelcome:
                this.navigatorModal.showWelcome();
                break;
            case NavigatorModalOperation.AskConfirmation:
                this.navigatorModal.showConfirmation();
                break;
            case NavigatorModalOperation.PlayAgainstBot:
                this.navigatorModal.showPlayAgainstBot();
                break;
            case NavigatorModalOperation.CreateLobby:
                this.connectToLobby();
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
            case BoardEditorOperation.FlipBoard:
                this._flipBoard();
                break;
            case BoardEditorOperation.ResetBoard:
                this._resetBoard();
                break;
            case BoardEditorOperation.CreateBoard:
                this._createBoard();
                break;
            case BoardEditorOperation.ToggleBoardEditorUtilityMenu:
                this.boardEditor.toggleUtilityMenu();
                break;
            case BoardEditorOperation.ChangeBoardCreatorMode:
                this.boardEditor.changeBoardCreatorMode();
                break;
            case BoardEditorOperation.ClearBoard:
                this.boardEditor.clearBoard();
                break;
            case BoardEditorOperation.SelectPiece:
                this.boardEditor.selectPiece(menuItem);
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

        LocalStorage.save(LocalStorageKey.LastBoard, this.chess.engine.getGameAsJsonNotation());
    }

    /**
     * Cancel the game and close the socket connection
     */
    private _cancelGame(): void
    {
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        this.navigatorModal.hide();
        this.socket?.close();
        this.notationMenu.showNewGameUtilityMenu();
        this.chess.board.lock();
    }

    /**
     * Update the components of the menu, for example
     * update the notation menu and print the logs of the game on log
     * console after the move is made.
     */
    private updateComponents(){
        this.notationMenu.update();
        this.logConsole.stream();
        this.boardEditor.showFen(this.chess.engine.getGameAsFenNotation());

        if(!this.boardEditor.isEditorModeEnable()){
            const gameStatus = this.chess.engine.getGameStatus();
            if([GameStatus.BlackVictory, GameStatus.WhiteVictory,GameStatus.Draw].includes(gameStatus))
                this.navigatorModal.showGameOver(gameStatus);
            else if (gameStatus === GameStatus.NotStarted)
                this.navigatorModal.showBoardNotReady();
        }

        this.bindMenuOperations();
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
     * Enable the board editor and clear the components of the menu.
     */
    private _enableBoardEditor(): void
    {
        this.navigatorModal.hide();
        if(this.boardEditor.isEditorModeEnable()) return;
        this.clearComponents();
        this.boardEditor.enableEditorMode();
        this.listenBoardChanges();
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        LocalStorage.save(LocalStorageKey.BoardEditorEnabled, true);
        this.logger.save("Board editor is enabled.");
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _createBoard(fenNotation: string | null = null): void 
    {
        this.navigatorModal.hide();
        this.clearComponents();
        this.boardEditor.createBoard(fenNotation);
        this.listenBoardChanges();
        this.logger.save(`Board is created and components are updated.`);
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
        this.listenBoardChanges();
        this.logger.save("Board is reset.");
    }
}
