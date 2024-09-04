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
            this.listenBoardChanges();
            this.bindMenuOperations();

            if(LocalStorage.load(LocalStorageKey.Welcome))
                this.navigatorModal.showWelcome();
        });
        
        this.logger.save("Components are created.");
    }

    /**
     * Parse the websocket message return it as a command-data tuple.
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
        // @ts-ignore
        this.socket = new WebSocket(import.meta.env.VITE_WS_ADDRESS + (lobbyId ? "/" + lobbyId : ""));
        
        this.socket.addEventListener("open", event => {

        });

        this.socket.addEventListener("message", event => {
            const [wsCommand, wsData] = this._parseWsMessage(event);
            switch(wsCommand){
                case WsCommand.Connected:
                    this.navigatorModal.showLobbyInfo(window.location.origin + "/" + wsData.lobbyId);
                    break;
                case WsCommand.Started:
                    this._createBoard(wsData);
                    break;
            }

            this._reBindUnbindedMenuOperations();
        });

        this.socket.addEventListener("close", event => {
            // if(onPurpose)
            //    LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        });

        // this.logger.save("Connected to the lobby[" + lobbyId + "] as " + data.color + " player.");
        //LocalStorage.save(LocalStorageKey.LastLobbyConnection, {lobbyId: lobbyId, color: data.color});
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
        document.querySelectorAll("[data-menu-operation]").forEach(menuItem => {
            if(this.menuOperationItems.length == 0 || !this.menuOperationItems.includes(menuItem)){
                menuItem.addEventListener("click", () => {
                    this.handleMenuOperation(menuItem as HTMLElement);
                });
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

        this._reBindUnbindedMenuOperations();
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
            case NotationMenuOperation.ToggleUtilityMenu:
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
            case BoardEditorOperation.Flip:
                this._flipBoard();
                break;
            case BoardEditorOperation.Reset:
                this._resetBoard();
                break;
            case BoardEditorOperation.CreateBoard:
                this._createBoard();
                break;
            case BoardEditorOperation.ToggleUtilityMenu:
                this.boardEditor.toggleUtilityMenu();
                break;
            case BoardEditorOperation.ChangeBoardCreatorMode:
                this.boardEditor.changeBoardCreatorMode();
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
            case BoardEditorOperation.EnableAddPieceCursorMode:
                this.boardEditor.enableAddPieceCursorMode();
                break;
            case BoardEditorOperation.EnableRemovePieceCursorMode:
                this.boardEditor.enableRemovePieceCursorMode();
                break;
        }
    }

    /**
     * Rebind the menu operations in case of the menu operations
     * are unbinded. This method is can be used after the new menu items
     * are added to the menu.
     */
    private _reBindUnbindedMenuOperations(): void
    {
        if(this.menuOperationItems !== Array.from(document.querySelectorAll("[data-menu-operation]")))
            this.bindMenuOperations();
    }
    
    /**
     * Cancel the game and close the socket connection
     */
    private _cancelGame(): void
    {
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

        const gameStatus = this.chess.engine.getGameStatus();
        if([GameStatus.BlackVictory, GameStatus.WhiteVictory,GameStatus.Draw].includes(gameStatus))
            this.navigatorModal.showGameOver(gameStatus);
        else if (gameStatus === GameStatus.NotStarted)
            this.navigatorModal.showBoardNotReady();

        this.bindMenuOperations();
    }

    /**
     * Clear the components of the menu like log console, 
     * notation menu etc.
     */
    private clearComponents(){
        this.logConsole.clear();
        this.notationMenu.clear();
    }

    /**
     * Enable the board editor and clear the components of the menu.
     */
    private _enableBoardEditor(): void
    {
        this.navigatorModal.hide();
        this.clearComponents();
        this.boardEditor.enable();
        this.listenBoardChanges();
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
        this.logger.save("Board is created.");
    }

    /**
     * Flip the board and notation menu.
     */
    private _flipBoard(): void
    {
        this.boardEditor.flipBoard();
        this.notationMenu.flip();
    }

    /**
     * Reset the board and update the components of the menu.
     */
    private _resetBoard(): void
    {
        this.clearComponents();
        this.boardEditor.resetBoard();
        this.listenBoardChanges();
        this.logger.save("Board is reset.");
    }
}
