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
    private menuOperationItems: Array<Element> = [];
    public readonly logger: Logger = new Logger("src/Platform/Platform.ts");

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.boardCreator = new BoardCreator(this.chess);
        this.notationMenu = new NotationMenu(this.chess);
        this.logConsole = new LogConsole();
        this.navigatorModal = new NavigatorModal();
        
        document.addEventListener("DOMContentLoaded", () => {
            this.listenBoardChanges();
            this.bindMenuOperations();

            if(LocalStorage.load(LocalStorageKey.Welcome))
                this.navigatorModal.showWelcome();
        });
        
        this.logger.save("Components are created.");
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
            /*case MenuOperation.CreateGame:
                this.createGameAndUpdateComponents();
                this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.Board);
                break;*/
            case MenuOperation.ChangeMode:
                this.boardCreator.changeMode();
                break;
            case MenuOperation.FlipBoard:
                console.log("Flip board");
                this.chess.board!.flip();
                this.notationMenu.flip();
                break;
            case MenuOperation.Reset:
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
            case MenuOperation.PlayAgainstFriend:
                this.navigatorModal.showPlayAgainstFriend();
                break;  
            case MenuOperation.OpenGameCreator:
                this.navigatorModal.showGameCreator();
                break;
            case MenuOperation.HideNavigatorModal:
                this.navigatorModal.hide();
                break;
        }

        if(document.querySelectorAll("[data-menu-operation]").length !== this.menuOperationItems.length)
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
    private _createBoard(){
        this.navigatorModal.hide();
        this.clearComponents();
        this.boardCreator.createBoard();
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
