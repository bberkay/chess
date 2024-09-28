/**
 * @module Platform
 * @description This class is the main class of the chess platform menu. It provides the components of the menu and connections between the chess and menu.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from "@Chess/Chess";
import { Navbar } from "./Components/Navbar";
import { BoardEditor } from "./Components/BoardEditor.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { NavigatorModal } from "./Components/NavigatorModal";
import { 
    AppearanceMenuOperation,
    BoardEditorOperation, 
    LogConsoleOperation, 
    MenuOperation, 
    NavbarOperation, 
    NavigatorModalOperation, 
    NotationMenuOperation, 
    PlatformEvent 
} from "./Types";
import { 
    ChessEvent, 
    Color, 
    Durations, 
    GameStatus, 
    JsonNotation, 
    PieceType, 
    StartPosition 
} from "@Chess/Types/index.ts";
import { LogConsole } from "./Components/NavbarComponents/LogConsole";
import { AboutMenu } from "./Components/NavbarComponents/AboutMenu.ts";
import { ConnectionsMenu } from "./Components/NavbarComponents/ConnectionsMenu.ts";
import { AppearanceMenu } from "./Components/NavbarComponents/AppearanceMenu.ts";
import { Logger } from "@Services/Logger";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage.ts";

/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform{

    private readonly chess: Chess;
    public readonly navbar: Navbar;
    public readonly boardEditor: BoardEditor;
    public readonly notationMenu: NotationMenu;
    public readonly navigatorModal: NavigatorModal;
    public readonly logConsole: LogConsole;
    public readonly connectionsMenu: ConnectionsMenu
    public readonly appearanceMenu: AppearanceMenu;
    public readonly aboutMenu: AboutMenu;
    public readonly logger: Logger = new Logger("src/Platform/Platform.ts");

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.appearanceMenu = new AppearanceMenu();
        this.boardEditor = new BoardEditor(this.chess);
        this.notationMenu = new NotationMenu(this.chess);
        this.navigatorModal = new NavigatorModal();
        this.logConsole = new LogConsole();
        this.aboutMenu = new AboutMenu();
        this.connectionsMenu = new ConnectionsMenu();
        this.navbar = new Navbar([this.logConsole, this.aboutMenu, this.connectionsMenu, this.appearanceMenu]);
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
        /**
         * Listen actions/clicks of user on menu squares for
         * updating the notation menu, log console etc.
         */
        const listenBoardChanges = () => {
            // First time update
            this.boardEditor.updateFen();

            const updateFenTriggers = [
                PlatformEvent.OnBoardCreated,
                ChessEvent.OnPieceCreated,
                ChessEvent.OnPieceRemoved,
                ChessEvent.OnPieceSelected,
                ChessEvent.OnPieceMoved,
                ChessEvent.onGameOver,
            ]

            updateFenTriggers.forEach((trigger) => {
                document.addEventListener(trigger, () => {
                    this.updateComponents();
                });
            });

            this.logger.save("Board changes are listening...");
        }

        /**
         * Find the menu operations and bind them to the menu 
         * items. When the user clicks on the menu item, the
         * operation will be executed.
         */
        const bindMenuOperations = () => {
            document.querySelectorAll("[data-menu-operation]").forEach((menuItem) => {
                menuItem.addEventListener("click", () => {
                    this.handleMenuOperation(menuItem as HTMLElement) 
                });
            });

            document.addEventListener(PlatformEvent.OnOperationMounted, ((event: CustomEvent) => {
                if(typeof event.detail.selector === "string"){
                    const menuOperations = document.querySelectorAll(`${event.detail.selector} [data-menu-operation]`);
                    if(!menuOperations) return;
                    menuOperations.forEach((menuItem) => {
                        menuItem.addEventListener("click", () => {
                            this.handleMenuOperation(menuItem as HTMLElement) 
                        });
                    });
                }
                else if(event.detail.selector instanceof HTMLElement){
                    if(!event.detail.selector.hasAttribute("data-menu-operation")) return;
                    event.detail.selector.addEventListener("click", () => {
                        this.handleMenuOperation(event.detail.selector as HTMLElement) 
                    });
                }
            }) as EventListener);

            this.logger.save("Menu operations are binded to loaded components.");
        }

        /**
         * Load the settings from the local storage and 
         * apply them to the platform.
         */
        const applyCachedPlatformSettings = () => {
            this.navbar.hideComponents();

            // Welcome message
            if(LocalStorage.isExist(LocalStorageKey.WelcomeShown))
                this.navbar.showComponent(this.logConsole);
            else{
                this.navbar.showComponent(this.aboutMenu);
                LocalStorage.save(LocalStorageKey.WelcomeShown, true);
            }

            // Theme
            if(LocalStorage.isExist(LocalStorageKey.Theme))
                this.appearanceMenu.changeTheme(LocalStorage.load(LocalStorageKey.Theme));

            // Last Board
            if(!this.checkAndLoadBoardFromCache()) 
                this.boardEditor.createBoard();

            // Board Editor
            if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled)){
                this.notationMenu.hidePlayerCards();
                this._enableBoardEditor();
            }

            // Custom Appearance
            if(LocalStorage.isExist(LocalStorageKey.CustomAppearance))
                this.appearanceMenu.initColorPalette();
        }

        /**
         * Initialize the platform components.
         */
        document.addEventListener("DOMContentLoaded", () => {
            applyCachedPlatformSettings();
            bindMenuOperations();
            listenBoardChanges();
            this.updateComponents();
        });
        
        this.logger.save("Cache is checked, last game/lobby is loaded if exists. Menu operations are binded.");
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Services/LocalStorage.ts
     */
    private checkAndLoadBoardFromCache(): boolean
    {
        // If there is a game in the cache, load it.
        if(LocalStorage.isExist(LocalStorageKey.LastBoard)){
            const lastBoard = LocalStorage.load(LocalStorageKey.LastBoard);
            if([GameStatus.BlackVictory, 
                GameStatus.WhiteVictory, 
                GameStatus.Draw
            ].includes(lastBoard.gameStatus))
            {
                this.logger.save("Last game is over, loading a new game...");
                return false;
            }
            this.logger.save("Game loading from cache...");
            this.boardEditor.createBoard(lastBoard);
            this.logger.save("Game loaded from cache");
            return true;
        }

        this.logger.save("No games found in cache");
        return false;
    }

    /**
     * This function makes an operation on menu.
     */
    private handleMenuOperation(menuItem: HTMLElement): void
    {
        const menuOperation = menuItem.getAttribute("data-menu-operation") as MenuOperation;
        if(Object.hasOwn(LogConsoleOperation, menuOperation))
        {
            this.logConsole.handleOperation(
                menuOperation as LogConsoleOperation
            );
        }
        else if(Object.hasOwn(AppearanceMenuOperation, menuOperation))
        {
            this.appearanceMenu.handleOperation(
                menuOperation as AppearanceMenuOperation
            );
        }
        else if(Object.hasOwn(NavigatorModalOperation, menuOperation))
        {
            this.navigatorModal.handleOperation(
                menuOperation as NavigatorModalOperation,
            );
            this.handleNavigatorModalOperation(
                menuOperation as NavigatorModalOperation, 
                menuItem
            );
        }
        else if(Object.hasOwn(NotationMenuOperation, menuOperation))
        {
            this.notationMenu.handleOperation(
                menuOperation as NotationMenuOperation
            );
            this.handleNotationMenuOperation(
                menuOperation as NotationMenuOperation, 
                menuItem
            );
        }
        else if(Object.hasOwn(BoardEditorOperation, menuOperation))
        {
            this.boardEditor.handleOperation(
                menuOperation as BoardEditorOperation,
                menuItem
            );
            this.handleBoardEditorOperation(
                menuOperation as BoardEditorOperation, 
                menuItem
            );
        }
        else if(Object.hasOwn(NavbarOperation, menuOperation))
        {
            this.navbar.handleOperation(
                menuOperation as NavbarOperation
            );
            this.handleNavbarOperation(
                menuOperation as NavbarOperation
            );
        }
    }
    
    /**
     * Handle the navigator modal operations.
     */
    private handleNavigatorModalOperation(menuOperation: NavigatorModalOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
            case NavigatorModalOperation.ShowStartPlayingBoard:
                this.navigatorModal.showStartPlayingBoard(this.boardEditor.getFen());
                break;
            case NavigatorModalOperation.PlayByYourself:
                this.navigatorModal.hide();
                this._playBoard();
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
        }
    }

    /**
     * Handle the board editor operations.
     */
    private handleBoardEditorOperation(menuOperation: BoardEditorOperation, menuItem: HTMLElement): void
    {
        // TODO: Mobil için touchup, touchmove, touchstart eventleri eklenebilir chessboard 
        // altında ki mouseup a gibi.
        
        // TODO: WsData, SocketData. vs server dan çekilsin ve bir dosyaya yazılsın. type kontrolü 
        // TODO: yapılmalı ws den gelen data için mesela WsMoved şöyle bir data gibi
        
        // TODO: Geri alma, resign, draw, next move yapılır.
        // TODO: multiple pre move ancak geri alma yapıldıktan sonra eklenebilir.
        // TODO: Moved from to efektleri geri alma da sonra yapılacak çünkü geri alma 
        // TODO: da moves kaydedilecek cache.

        // TODO: Multiple lobby, cache ve arayüzü
        // TODO: Multiple lobby den sonra chess platform switch case dan handling yapılmalı.
        // TODO: handleWsConnected gibi
        
        switch(menuOperation){
            case BoardEditorOperation.Enable:
                this.navigatorModal.hide();
                this._enableBoardEditor();
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
        }
    }

    /**
     * Handle the navbar operations.
     */
    private handleNavbarOperation(menuOperation: NavbarOperation): void
    {
        switch(menuOperation){
            case NavbarOperation.ShowLogConsole:
                this.navbar.showComponent(this.logConsole);
                break;
            case NavbarOperation.ShowConnections:
                this.navbar.showComponent(this.connectionsMenu);
                break;
            case NavbarOperation.ShowAppearance:
                this.navbar.showComponent(this.appearanceMenu);
                this.appearanceMenu.initColorPalette();
                break;
            case NavbarOperation.ShowAbout:
                this.navbar.showComponent(this.aboutMenu);
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

        if(!BoardEditor.isEditorModeEnable()){
            this.notationMenu.update();

            const gameStatus = this.chess.engine.getGameStatus();
            if([
                GameStatus.BlackVictory, 
                GameStatus.WhiteVictory,
                GameStatus.Draw
            ].includes(gameStatus))
                this.navigatorModal.showGameOver(gameStatus);             
            else if (gameStatus === GameStatus.NotReady)
                this.navigatorModal.showBoardNotReady();
        }
    }

    /**
     * Clear the components of the menu like log console, 
     * notation menu etc.
     */
    private clearComponents(){
        this.logConsole.clear();
        if(!BoardEditor.isEditorModeEnable()) this.notationMenu.clear();
    }
    
    /**
     * Enable the board editor and clear the components of the menu.
     */
    private _enableBoardEditor(): void
    {
        if(BoardEditor.isEditorModeEnable()) return;
        this.clearComponents();
        this.boardEditor.enableEditorMode();
        LocalStorage.clear(LocalStorageKey.LastLobbyConnection);
        LocalStorage.save(LocalStorageKey.BoardEditorEnabled, true);
        this.logger.save("Board editor is enabled.");
    }

    /**
     * Prepare the platform components for the online game.
     */
    public createOnlineGame(game: { 
        whitePlayer: {name: string, isOnline: boolean},
        blackPlayer: {name: string, isOnline: boolean},
        board: string, 
        durations: Durations
    }, playerColor: Color): void
    {
        this._createBoard(game.board, game.durations);
        this.chess.board.disablePreSelectionFor(playerColor === Color.White ? Color.Black : Color.White);
        this.notationMenu.displayLobbyUtilityMenu();
        this.notationMenu.updatePlayerCards(game.whitePlayer, game.blackPlayer, game.durations);
        this.notationMenu.setTurnIndicator(this.chess.engine.getTurnColor());
        if(playerColor === Color.Black) this._flipBoard();
        if(playerColor !== this.chess.engine.getTurnColor()) this.chess.board.lock(false);
        else this.chess.board.unlock();
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _createBoard(
        notation: string | StartPosition | JsonNotation | null = null,
        durations: Durations | null = null
    ): void 
    {
        this.navigatorModal.hide();
        this.navbar.showComponent(this.logConsole);
        this.clearComponents();
        this.boardEditor.createBoard(notation, durations);
        this.logger.save(`Board is created and components are updated.`);
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private _playBoard(fenNotation: string | null = null): void 
    {
        this.boardEditor.disableEditorMode();
        this.logConsole.clear();
        this.notationMenu.clear();
        this.notationMenu.showPlayerCards();
        this.notationMenu.setTurnIndicator(this.chess.engine.getTurnColor());
        this.boardEditor.createBoard(fenNotation);
        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
        this.logger.save(`Editor mode is disabled and board is now playable.`);
    }

    /**
     * Flip the board and notation menu.
     */
    private _flipBoard(): void
    {
        this.boardEditor.flipBoard();
        if(!BoardEditor.isEditorModeEnable())
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
