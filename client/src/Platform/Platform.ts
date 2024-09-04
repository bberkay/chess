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
import { BoardCreator } from "./Components/BoardCreator.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { LogConsole } from "./Components/LogConsole";
import { NavigatorModal } from "./Components/NavigatorModal";
import { MenuOperation, UtilityMenuSection } from "./Types";
import { WsMessage, WsCommand } from "../Types";
import { Logger } from "@Services/Logger";
import { GameStatus } from "@Chess/Types/index.ts";

/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform{

    private readonly chess: Chess;
    private readonly boardCreator: BoardCreator;
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
        this.boardCreator = new BoardCreator(this.chess);
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
                    this.handleOperation(menuItem.getAttribute("data-menu-operation") as MenuOperation);
                });
                this.menuOperationItems.push(menuItem);
            }
        });
    }

    /**
     * This function makes an operation on menu.
     */
    protected handleOperation(menuOperation: MenuOperation): void
    {
        switch(menuOperation){
            case MenuOperation.ClearConsole:
                this.logConsole.clear();
                break;
            case MenuOperation.ChangeMode:
                this.boardCreator.changeMode();
                break;
            case MenuOperation.FlipBoard:
                this.chess.board!.flip();
                this.notationMenu.flip();
                break;
            case MenuOperation.ResetBoard:
                this._resetBoard();
                break;
            case MenuOperation.CreateBoard:
                this._createBoard();
                break;
            case MenuOperation.ToggleUtilityMenu:
                this.notationMenu.toggleUtilityMenu();
                break;
            case MenuOperation.PlayAgainstBot:
                this.navigatorModal.showPlayAgainstBot();
                break
            case MenuOperation.CreateLobby:
                this.connectToLobby();
                break;  
            case MenuOperation.ShowGameCreatorModal:
                this.navigatorModal.showGameCreator();
                break;
            case MenuOperation.ShowWelcomeModal:
                this.navigatorModal.showWelcome();
                break;
            case MenuOperation.HideNavigatorModal:
                this.navigatorModal.hide();
                break;
            case MenuOperation.UndoNavigatorModal:
                this.navigatorModal.undo();
                break;
            case MenuOperation.AskConfirmation:
                this.navigatorModal.showConfirmation();
                break;
            case MenuOperation.CancelGame:
                this.navigatorModal.hide();
                this.socket?.close();
                this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.NewGame);
                this.chess.board.lock();
                break;
        }

        this._reBindUnbindedMenuOperations();
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
     * Update the components of the menu, for example
     * update the notation menu and print the logs of the game on log
     * console after the move is made.
     */
    private updateComponents(){
        this.notationMenu.update();
        this.logConsole.stream();
        this.boardCreator.show(this.chess.engine.getGameAsFenNotation());

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
     * Create a new game and update the components of the menu.
     */
    private _createBoard(fenNotation: string | null = null): void 
    {
        this.navigatorModal.hide();
        this.clearComponents();
        console.log("burada",fenNotation);
        this.boardCreator.createBoard(fenNotation);
        this.listenBoardChanges();
        this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.Board);
        this.logger.save("Board is created.");
    }

    /**
     * Reset the board and update the components of the menu.
     */
    private _resetBoard(): void
    {
        this.clearComponents();
        this.boardCreator.resetBoard();
        this.listenBoardChanges();
        this.logger.save("Board is reset.");
    }
}
