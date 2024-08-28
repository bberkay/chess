/**
 * @module Platform
 * @description This class is the main class of the chess platform menu. It provides the components of the menu and connections between the chess and menu.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from "../Chess/Chess";
import { BoardCreator } from "./Components/BoardCreator.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { LogConsole } from "./Components/LogConsole";
import { NavigatorModal } from "./Components/NavigatorModal";
import { MenuOperation, UtilityMenuSection } from "./Types";

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
            this.initBoardListener();
            this.initOperationListener();
        });
    }

    /**
     * Listen actions/clicks of user on menu squares for
     * updating the notation menu, log console etc.
     */
    private initBoardListener(): void
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

    }

    /**
     * Listen actions/clicks of user on menu components for
     * updating the chess board, notation menu, log console etc.
     */
    protected initOperationListener(): void
    {
        document.querySelectorAll("[data-menu-operation]").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                this.handleOperation(
                    menuItem.getAttribute("data-menu-operation") as MenuOperation
                );
            });
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
                this.notationMenu.flip();
                break;
            case MenuOperation.Reset:
                this.createBoard();
                break;
            case MenuOperation.CreateBoard:
                this.createBoard();
                break;
            case MenuOperation.ToggleUtilityMenu:
                this.notationMenu.toggleUtilityMenu();
                break;
            case MenuOperation.CreateLobby:
                this.navigatorModal.showLobbyInfo();
                this.initOperationListener();
                break;  
            case MenuOperation.OpenGameCreator:
                this.navigatorModal.showGameCreator();
                this.initOperationListener();
                break;
        }
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
    }
    

    /**
     * Update the components of the menu for new game, for example
     * clear the notation menu and print the logs of the game on log
     * console after the game is completely created.
     */
    private createGameAndUpdateComponents(): void
    {
        this.logConsole.clear();
        this.notationMenu.clear();
        this.boardCreator.createBoard();
        this.initBoardListener();
    }

    /**
     * Function for handling MenuOperation.CreateBoard operation.
     */
    private createBoard(): void
    {
        if(this.boardCreator.getCurrentMode() === "custom-mode")
            this.boardCreator.changeMode();
        this.createGameAndUpdateComponents();
        this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.Board);
    }
}
