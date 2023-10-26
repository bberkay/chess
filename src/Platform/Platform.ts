/**
 * @module Platform
 * @description This class is the main class of the chess platform menu. It provides the components of the menu and connections between the chess and menu.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */


import { Chess } from "../Chess/Chess";
import { GameStatus } from "../Chess/Types";
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
    private operationValue: MenuOperationValue | null;
    private isGameFinished: boolean;

    /**
     * Constructor of the Platform class.
     */
    constructor(chess: Chess) {
        this.chess = chess;
        this.gameCreator = new GameCreator();
        this.notationMenu = new NotationMenu();
        this.logConsole = new LogConsole();
        this.operationValue = null;
        this.isGameFinished = false;

        // Initialize the listeners when the dom is loaded.
        document.addEventListener("DOMContentLoaded", () => {
            this.initListenerForUpdates();
            this.initListenerForOperations();

            // Update the notation table and log console.
            this.notationMenu!.load(this.chess.getNotation());
            this.logConsole!.show(this.chess.getLogs());
        });
    }

    /**
     * Listen actions/clicks of player on chess board
     * for update the notation table and log console.
     */
    private initListenerForUpdates(): void
    {
        document.querySelectorAll("[data-square-id]").forEach(square => {
            square.addEventListener("mousedown", () => {
                // If game isn't finished then update the platform components.
                if(!this.isGameFinished){
                    // Update the notation table and log console.
                    this.notationMenu!.update(this.chess.getNotation(), this.chess.getScores());
                    this.logConsole!.show(this.chess.getLogs());

                    /**
                     * If the log count is greater than 130, clear the log console.
                     * This is for preventing the log console from slowing down the browser.
                     */
                    if(this.logConsole!.getLogCount() > 130)
                        this.clearLogConsole();
                }

                if(!this.isGameFinished && [GameStatus.WhiteVictory, GameStatus.BlackVictory, GameStatus.Draw].includes(this.chess.getStatus()))
                    this.isGameFinished = true;
            });
        });
    }

    /**
     * Listen actions/clicks of user on menu on platform
     * like game creator and log console clear.
     */
    private initListenerForOperations(): void
    {
        document.querySelectorAll("[data-operation-type]").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                // Make operation(from menu)
                this.doActionOnMenu(
                    menuItem.getAttribute("data-operation-type") as MenuOperationType,
                    menuItem.getAttribute("data-operation-value") as MenuOperationValue
                );
            });
        });
    }

    /**
     * This function makes an operation on menu.
     */
    public doActionOnMenu(operationType: MenuOperationType, operationValue: MenuOperationValue): void
    {
        this.operationValue = operationValue;

        // Do operation by given operation type.
        switch(operationType){
            case MenuOperationType.GameCreatorCreate:
                this.createGameWithGameCreator();
                break;
            case MenuOperationType.GameCreatorChangeMode:
                this.gameCreator!.changeMode(this.operationValue!);
                break;
            case MenuOperationType.LogConsoleClear:
                this.clearLogConsole();
                break;
        }
    }

    /**
     * This function clears the log console and logs of the chess.
     */
    private clearLogConsole(): void
    {
        this.chess!.clearLogs();
        this.logConsole!.clear();
    }

    /**
     * This function create a new game with the game creator
     */
    private createGameWithGameCreator(): void
    {
        // Clear components.
        this.notationMenu!.clear();
        this.logConsole!.clear();

        // Create a new game with input value by given operation value.
        this.chess.createGame(this.gameCreator!.getValueByMode(this.operationValue!));
        this.isGameFinished = false;

        // Initialize the listener for updates.
        this.initListenerForUpdates();
    }
}
