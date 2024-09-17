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
import { BoardEditorEvent, BoardEditorOperation, LogConsoleOperation, MenuOperation, NavigatorModalOperation, NotationMenuOperation } from "./Types";
import { Logger } from "@Services/Logger";
import { ChessEvent, Color, GameStatus, JsonNotation, PieceType, StartPosition } from "@Chess/Types/index.ts";

/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform{

    private readonly chess: Chess;
    public readonly boardEditor: BoardEditor;
    public readonly notationMenu: NotationMenu;
    public readonly logConsole: LogConsole;
    public readonly navigatorModal: NavigatorModal;
    public readonly logger: Logger = new Logger("src/Platform/Platform.ts");

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
        /**
         * Listen actions/clicks of user on menu squares for
         * updating the notation menu, log console etc.
         */
        const listenBoardChanges = () => {
            // For the first time
            this.boardEditor.updateFen();

            // When a board is created by the board editor
            // this is because the stream first logs on the log console
            document.addEventListener(BoardEditorEvent.onBoardCreatedByBoardEditor, () => {
                this.updateComponents();
            });

            // Every change on the board like moving a piece, removing a piece etc.
            document.addEventListener(ChessEvent.OnPieceSelected, () => { this.updateComponents() });
            document.addEventListener(ChessEvent.OnPieceMoved, () => { this.updateComponents() });

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

            document.addEventListener("componentLoaded", ((event: CustomEvent) => {
                const menuOperations = document.querySelectorAll(`#${event.detail.componentId} [data-menu-operation]`);
                if(!menuOperations) return;
                menuOperations.forEach((menuItem) => {
                    menuItem.addEventListener("click", () => {
                        this.handleMenuOperation(menuItem as HTMLElement) 
                    });
                });
            }) as EventListener);

            this.logger.save("Menu operations are binded to loaded components.");
        }

        /**
         * Initialize the platform components.
         */
        document.addEventListener("DOMContentLoaded", () => {
            if(!this.checkAndLoadGameFromCache()) 
                this.boardEditor.createBoard();

            if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled))
                this._enableBoardEditor();

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
    private checkAndLoadGameFromCache(): boolean
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
     * This function makes an operation on menu.
     */
    private handleMenuOperation(menuItem: HTMLElement): void
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
            case NavigatorModalOperation.ShowSelectDuration:
                this.navigatorModal.showSelectDuration();
                break;
            case NavigatorModalOperation.ShowSelectDurationCustom:
                this.navigatorModal.showSelectDurationCustom();
                break
            case NavigatorModalOperation.ShowStartPlayingBoard:
                this.navigatorModal.showStartPlayingBoard(this.boardEditor.getFen());
                break;
            case NavigatorModalOperation.ShowPlayAgainstBot:
                this.navigatorModal.showPlayAgainstBot();
                break;
            case NavigatorModalOperation.ShowCreateLobby:
                if(LocalStorage.isExist(LocalStorageKey.LastPlayerName))
                    this.navigatorModal.setPlayerNameInputValue(LocalStorage.load(LocalStorageKey.LastPlayerName));
                this.navigatorModal.showCreateLobby();
                break
            case NavigatorModalOperation.ShowJoinLobby:
                if(LocalStorage.isExist(LocalStorageKey.LastPlayerName))
                    this.navigatorModal.setPlayerNameInputValue(LocalStorage.load(LocalStorageKey.LastPlayerName));
                this.navigatorModal.showJoinLobby();
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
        // TODO: Satranç taşları sıra gelmeyince de drag edilebilmeli. Bu move işlemi olmadan yapılamaz. 
        switch(menuOperation){
            case BoardEditorOperation.Enable:
                this.navigatorModal.hide();
                this._enableBoardEditor();
                break;
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

        if(!BoardEditor.isEditorModeEnable()){
            this.notationMenu.update()

            const gameStatus = this.chess.engine.getGameStatus();
            if([GameStatus.BlackVictory, GameStatus.WhiteVictory,GameStatus.Draw].includes(gameStatus))
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
        duration: [number, number]
    }, playerColor: Color): void
    {
        this._createBoard(game.board);
        this.chess.board.disablePreSelectionFor(playerColor === Color.White ? Color.Black : Color.White);
        this.notationMenu.displayLobbyUtilityMenu();
        this.notationMenu.updatePlayerCards(game.whitePlayer, game.blackPlayer, game.duration);
        this.notationMenu.changeTurnIndicator(this.chess.engine.getTurnColor());
        //this.notationMenu.displayWhitePlayerDuration(wsData.duration[0].toString());
        //this.notationMenu.displayBlackPlayerDuration(wsData.duration[0].toString());
        if(playerColor === Color.Black) this._flipBoard();
        if(playerColor !== this.chess.engine.getTurnColor()) this.chess.board.lock(false);
        else this.chess.board.unlock();
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
    private _playBoard(fenNotation: string | null = null): void 
    {
        this.boardEditor.disableEditorMode();
        this.logConsole.clear();
        this.notationMenu.clear();
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
