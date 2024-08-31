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
            menuItem.addEventListener("click", () => {
                this.handleOperation(
                    menuItem.getAttribute("data-menu-operation") as MenuOperation
                );
            });
        });

        this.logger.save("Menu operations are binded to the menu items.");
    }

    /**
     * This function makes an operation on menu.
     */
    protected handleOperation(menuOperation: MenuOperation): void
    {
        switch(menuOperation){
            case MenuOperation.ClearConsole:
                this.logConsole.clear();
                this.logger.save("Console is cleared.");
                break;
            /*case MenuOperation.CreateGame:
                this.createGameAndUpdateComponents();
                this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.Board);
                break;*/
            case MenuOperation.ChangeMode:
                this.boardCreator.changeMode();
                this.logger.save("Board Creator mode is changed.");
                break;
            case MenuOperation.FlipBoard:
                this.notationMenu.flip();
                this.logger.save("Board is flipped.");
                break;
            case MenuOperation.Reset:
                this.createBoard();
                break;
            case MenuOperation.CreateBoard:
                this.createBoard();
                break;
            case MenuOperation.ToggleUtilityMenu:
                this.notationMenu.toggleUtilityMenu();
                this.logger.save("Utility menu is appeareance is switched.");
                break;
            case MenuOperation.PlayAgainstBot:
                this.navigatorModal.showPlayAgainstBot();
                this.bindMenuOperations();
                break
            case MenuOperation.PlayAgainstFriend:
                this.navigatorModal.showPlayAgainstFriend();
                this.bindMenuOperations();
                break;  
            case MenuOperation.OpenGameCreator:
                this.navigatorModal.showGameCreator();
                this.bindMenuOperations();
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
        this.logger.save("Components are updated.");
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
        this.listenBoardChanges();
        this.logger.save("Game is created and components are updated.");
    }

    /**
     * Function for handling MenuOperation.CreateBoard operation.
     */
    private createBoard(): void
    {
        if(this.boardCreator.isCustomMode())
            this.boardCreator.changeMode();
        this.createGameAndUpdateComponents();
        this.notationMenu.changeUtilityMenuSection(UtilityMenuSection.Board);
        this.logger.save("Board is created.");
    }
}
