import { Chess } from "../Chess/Chess";
import { Square } from "../Chess/Types";
import { SquareClickMode } from "../Chess/Board/Types";
import { GameCreatorForm } from "./Components/GameCreatorForm";
import { NotationTable } from "./Components/NotationTable";
import { GameCreatorOperationType, GameCreatorOperationValue } from "./Types";

export class Platform{

    private readonly chess: Chess;
    private readonly gameCreatorForm: GameCreatorForm | null;
    private readonly notationTable: NotationTable | null;
    //private readonly logConsole: LogConsole | null;

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.gameCreatorForm = document.getElementById("game-creator-form") ? new GameCreatorForm() : null;
        this.notationTable = document.getElementById("notation-table") ? new NotationTable() : null;
        //this.logConsole = platformConfig.createLogConsole ? new LogConsole() : null;

        // Initialize the listeners when the dom is loaded.
        document.addEventListener("DOMContentLoaded", () => {
            this.initListeners();

            // Update the notation table.
            if(this.notationTable !== null)
                this.notationTable.set(this.chess.getNotation());
        });
    }

    /**
     * This function makes an operation on menu.
     */
    public doActionOnMenu(operationType: GameCreatorOperationType, operationValue: GameCreatorOperationValue): void
    {
        switch(operationType){
            case GameCreatorOperationType.CreateGame:
                if(this.gameCreatorForm === null)
                    throw new Error("Game creator form is not initialized.");

                // Create a new game with input value by given operation value.
                this.chess.createGame(this.gameCreatorForm.getValueByMode(operationValue));

                /**
                 * Initialize the listeners again because when the board changes on the dom tree,
                 * the listeners are removed.
                 */
                this.initListeners();
                break;
            case GameCreatorOperationType.ChangeMode:
                if(this.gameCreatorForm === null)
                    throw new Error("Game creator form is not initialized.");

                // Change mode of game creator form.
                this.gameCreatorForm.changeMode(operationValue);
                break;
        }
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

                // Update the notation table.
                if(this.notationTable !== null)
                    this.notationTable.add(this.chess.getNotation());
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
                    menuItem.getAttribute("data-operation-type") as GameCreatorOperationType,
                    menuItem.getAttribute("data-operation-value") as GameCreatorOperationValue
                );
            });
        });
    }
}