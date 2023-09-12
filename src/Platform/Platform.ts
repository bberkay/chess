import { Chess } from "../Chess/Chess";
import { Square } from "../Chess/Types";
import { SquareClickMode } from "../Chess/Board/Types";
import { GameCreator } from "./Components/GameCreator.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { LogConsole } from "./Components/LogConsole";
import { MenuOperationType, MenuOperationValue } from "./Types";

/**
 * This class is the main class of the chess platform menu.
 * It provides the components of the menu and connections between the chess and menu.
 */
export class Platform{

    private readonly chess: Chess;
    private readonly gameCreator: GameCreator | null;
    private readonly notationMenu: NotationMenu | null;
    private readonly logConsole: LogConsole | null;

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.gameCreator = document.getElementById("game-creator") ? new GameCreator() : null;
        this.notationMenu = document.getElementById("notation-menu") ? new NotationMenu() : null;
        this.logConsole = document.getElementById("log-console") ? new LogConsole() : null;

        // Initialize the listeners when the dom is loaded.
        document.addEventListener("DOMContentLoaded", () => {
            this.initListeners();

            // Update the notation table and log console.
            this.updateNotationTable(true);
            this.updateLogConsole();
        });
    }

    /**
     * This function initializes the listeners for user's
     * actions on platform.
     */
    private initListeners(): void
    {
        /**
         * Listen actions/clicks of player on chess board.
         * This is for the chess in src\Chess\Chess.ts.
         */
        document.querySelectorAll("[data-square-id]").forEach(square => {
            square.addEventListener("click", () => {
                // Make move(with square ID and click mode)
                this.chess.doActionOnBoard(
                    square.getAttribute("data-click-mode") as SquareClickMode,
                    parseInt(square.getAttribute("data-square-id")!) as Square
                );

                // Update the notation table and log console.
                this.updateNotationTable();
                this.updateLogConsole();
            });
        });

        /**
         * Listen actions/clicks of user on menu on platform.
         * This is for the platform in src\Platform\Platform.ts.
         */
        document.querySelectorAll("[data-operation-type]").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                // Make operation(from menu)
                this.doActionOnMenu(
                    menuItem.getAttribute("data-operation-type") as MenuOperationType,
                    menuItem.getAttribute("data-operation-value") as MenuOperationValue
                );

                // Update the log console if the operation is not clear log console.
                if(menuItem.getAttribute("data-operation-type") !== MenuOperationType.LogConsoleClear)
                    this.updateLogConsole();
            });
        });
    }

    /**
     * This function makes an operation on menu.
     */
    public doActionOnMenu(operationType: MenuOperationType, operationValue: MenuOperationValue): void
    {
        switch(operationType){
            case MenuOperationType.GameCreatorCreate:
                if(this.gameCreator === null)
                    throw new Error("Game creator form is not initialized.");

                // Clear components.
                this.clearNotationTable();
                this.clearLogConsole();

                // Create a new game with input value by given operation value.
                this.chess.createGame(this.gameCreator.getValueByMode(operationValue));

                /**
                 * Initialize the listeners again because when the board changes on the dom tree,
                 * the listeners are removed.
                 */
                this.initListeners();
                break;
            case MenuOperationType.GameCreatorChangeMode:
                if(this.gameCreator === null)
                    throw new Error("Game creator form is not initialized.");

                // Change mode of game creator form.
                this.gameCreator.changeMode(operationValue);
                break;
            case MenuOperationType.LogConsoleClear:
                this.clearLogConsole();
                break;
        }
    }

    /**
     * This function clears the notation table.
     */
    private clearNotationTable(): void
    {
        if(this.notationMenu === null)
            throw new Error("Notation table is not initialized.");

        this.notationMenu!.clear();
    }

    /**
     * This function clears the log console.
     */
    private clearLogConsole(): void
    {
        if(this.logConsole === null)
            throw new Error("Log console is not initialized.");

        this.logConsole!.clear();
    }

    /**
     * This function updates the notation table.
     */
    private updateNotationTable(isInitOperation: boolean = false): void
    {
        if(this.notationMenu === null)
            throw new Error("Notation table is not initialized.");

        if(isInitOperation)
            this.notationMenu!.addNotations(this.chess.getNotation());
        else
            this.notationMenu!.addNotation(this.chess.getNotation());

        // Show the score of the players on the top and bottom of the table.
        this.notationMenu!.showScore(this.chess.getScores());
    }

    /**
     * This function updates the log console.
     */
    private updateLogConsole(): void
    {
        if(this.logConsole === null)
            throw new Error("Log console is not initialized.");

        this.logConsole!.show(this.chess.getLogs());
    }

}