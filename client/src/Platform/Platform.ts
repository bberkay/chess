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

            const updateComponentTriggers = [
                ChessEvent.onGameCreated,
                ChessEvent.onPieceCreated,
                ChessEvent.onPieceRemoved,
                ChessEvent.onPieceSelected,
                ChessEvent.onPieceMoved,
                ChessEvent.onGameOver,
            ]

            updateComponentTriggers.forEach((trigger) => {
                document.addEventListener(trigger, () => {
                    if(trigger == ChessEvent.onPieceSelected || trigger == ChessEvent.onPieceMoved)
                        this.navbar.showComponent(this.logConsole);
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

            document.addEventListener(PlatformEvent.onOperationMounted, ((event: CustomEvent) => {
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

        document.addEventListener(ChessEvent.onBotAdded, ((event: CustomEvent) => {
            if(event.detail.color === Color.White) 
                this._flipBoardAndComponents();
        }) as EventListener);

        /**
         * Initialize the platform components.
         */
        document.addEventListener("DOMContentLoaded", () => {
            bindMenuOperations();
            listenBoardChanges();
            this.updateComponents();
        });
        
        this.logger.save("Cache is checked, last game/lobby is loaded if exists. Menu operations are binded.");
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
            this.handleLogConsoleOperation(
                menuOperation as LogConsoleOperation, 
                menuItem
            );
        }
        else if(Object.hasOwn(AppearanceMenuOperation, menuOperation))
        {
            this.appearanceMenu.handleOperation(
                menuOperation as AppearanceMenuOperation
            );
            this.handleAppearanceMenuOperation(
                menuOperation as AppearanceMenuOperation, 
                menuItem
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
     * Handle the log console operations.
     */
    private handleLogConsoleOperation(menuOperation: LogConsoleOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
        }
    }
    
    /**
     * Handle the appearance menu operations.
     */
    private handleAppearanceMenuOperation(menuOperation: AppearanceMenuOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
        }
    }

    /**
     * Handle the notation menu operations.
     */
    private handleNotationMenuOperation(menuOperation: NotationMenuOperation, menuItem: HTMLElement): void
    {
        switch(menuOperation){
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
                this.preparePlatformForSingleplayerGameByYourself();
                break;
            case NavigatorModalOperation.PlayAgainstBot:
                this.preparePlatformForSingleplayerGameAgainstBot();
                break;
        }
    }

    /**
     * Handle the board editor operations.
     */
    private handleBoardEditorOperation(menuOperation: BoardEditorOperation, menuItem: HTMLElement): void
    {   
        // TODO: Board editor start da bir problem var.
        // TODO: Cache kaydetmiyor nedense? hatta in play utility menu de gelmiyor nednese?

        // TODO: Geri hamle, Undo, MEVCUT YAPI TEST EDİLECEK.
            // Castling, promotion
            // Skorlar vs. de gözükmeli.

        // TODO: Coverage test

        // TODO: Long algebraic notation
        // TODO: Bot için resign, draw, play again, promotion, castling, undo test edilmeli.
        // TODO: Board settings chess.com dan bakılabilir. Connections menu kaldırılmalı.
        
        // TODO: Multiple pre move
        // TODO: Switch case yapısı handling socket
            // addEventListener onPieceMovedByPlayer
        // TODO: Component fonksiyonları toplanabilir
            // Mesela preparePlatformForSingleplayerGame preparePlatformForOnlineGame birleştiriilebilir.
            // NotationMenu.prepareForGame gibi fonksiyonlar oluşturulabilir ve diğer fonksiyon private hale getirilir.
            // Bu kadar detaylı erişlmemeli component methodlara daha genel itibari ile yukarıda ki gibi prepareForGame
            // gibi basitçe methodlar olsun.
            // TODO: Public ve private 

        // TODO: Server Uploading and supabase duruma göre
        // TODO: Mobil için touchup
        // function isTouchDevice() {
        //  return window.matchMedia('(hover: none)').matches || window.matchMedia('(pointer: coarse)').matches;
        // }

        // TODO: Belki language eklenmese bile eklenecek altyapı kurulabilir.
        // TODO: Mesele, tüm stringlerin bir objede tutulması ve bu objenin diline göre değişmesi.
        // TODO: Son bir test farklı tarayıcılar ile(özellikle connection testi, reload testleri) ve Readme
            // TODO: Board editor ile oyun yaratıp bot ve online oynama ve play again testleri de var aynı yaratılan
            // oyun ile başlamalı.
            // TODO: fixme ve todoları araştır.

        switch(menuOperation){
            case BoardEditorOperation.Enable:
                this.navigatorModal.hide();
                this.logConsole.clear();
                this.boardEditor.enableEditorMode();
                document.dispatchEvent(new Event(PlatformEvent.onBoardCreated));
                break;
            case BoardEditorOperation.FlipBoard:
                this._flipBoardAndComponents();
                break;
            case BoardEditorOperation.ResetBoard:
                this._resetBoardAndComponents();
                break;
            case BoardEditorOperation.CreateBoard:
                this._createBoardAndHandleComponents();
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
     * Create a new game and update the components of the menu.
     */
    private _createBoardAndHandleComponents(
        notation: string | StartPosition | JsonNotation | null = null
    ): void 
    {
        this.navigatorModal.hide();
        this.navbar.showComponent(this.logConsole);
        this.clearComponents();
        this.boardEditor.createBoard(notation);
        this.logger.save(`Board is created and components are updated.`);
    }

    /**
     * Prepare the platform components for the online game.
     */
    public preparePlatformForOnlineGame(createdGame: { 
        whitePlayer: {id: string, name: string, isOnline: boolean},
        blackPlayer: {id: string, name: string, isOnline: boolean},
        game: string | JsonNotation
    }, playerColor: Color): void
    {
        if(BoardEditor.isEditorModeEnable()) this.boardEditor.disableEditorMode();
        this._createBoardAndHandleComponents(createdGame.game);
        this.chess.board.disablePreSelectionFor(playerColor === Color.White ? Color.Black : Color.White);
        this.notationMenu.displayInPlayUtilityMenu();
        this.notationMenu.updatePlayerCards(createdGame.whitePlayer, createdGame.blackPlayer);
        this.notationMenu.setTurnIndicator(this.chess.engine.getTurnColor());
        if(playerColor === Color.Black) this._flipBoardAndComponents();
        if(playerColor !== this.chess.engine.getTurnColor()) this.chess.board.lock(false);
        else this.chess.board.unlock();
        this.logger.save(`Online game is created and components are updated.`);
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private preparePlatformForSingleplayerGame(
        fenNotation: string | null,
        againstBot: boolean
    ): void 
    {
        const { botColor, botDifficulty } = this.navigatorModal.getCreatedBotSettings();

        if(!BoardEditor.isEditorModeEnable()) 
            fenNotation = StartPosition.Standard;
        else
            this.boardEditor.disableEditorMode();
        
        this._createBoardAndHandleComponents(fenNotation);
        this.notationMenu.displayInPlayUtilityMenu();

        if(againstBot && botColor && botDifficulty)
            this.chess.addBotToCurrentGame(botColor, botDifficulty);

        this.notationMenu.showPlayerCards();
        this.notationMenu.setTurnIndicator(this.chess.engine.getTurnColor());
        
        this.logger.save(`Editor mode is disabled and board is now playable.`);
        LocalStorage.clear(LocalStorageKey.BoardEditorEnabled);
        document.dispatchEvent(new Event(PlatformEvent.onBoardCreated));
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private preparePlatformForSingleplayerGameByYourself(
        fenNotation: string | null = null
    ): void 
    {
        this.preparePlatformForSingleplayerGame(fenNotation, false);
    }

    /**
     * Create a new game and update the components of the menu.
     */
    private preparePlatformForSingleplayerGameAgainstBot(
        fenNotation: string | null = null
    ): void 
    {
        this.preparePlatformForSingleplayerGame(fenNotation, true);
    }

    /**
     * Flip the board and notation menu.
     */
    private _flipBoardAndComponents(): void
    {
        this.boardEditor.flip();
        if(!BoardEditor.isEditorModeEnable())
            this.notationMenu.flip();
    }

    /**
     * Reset the board and update the components of the menu.
     */
    private _resetBoardAndComponents(): void
    {
        this.logConsole.clear();
        this.boardEditor.resetBoard();
        this.logger.save("Board is reset.");
    }
}
