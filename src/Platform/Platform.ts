/**
 * @module Platform
 * @description This class is the main class of the chess platform menu. It provides the components of the menu and connections between the chess and menu.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from "../Chess/Chess";
import { GameCreator } from "./Components/GameCreator.ts";
import { NotationMenu } from "./Components/NotationMenu.ts";
import { LogConsole } from "./Components/LogConsole";
import { MenuOperationType } from "./Types";

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
        this.gameCreator = document.querySelector("#game-creator") ? new GameCreator(this.chess) : null;
        this.notationMenu = document.querySelector("#notation-menu") ? new NotationMenu(this.chess) : null;
        this.logConsole = document.querySelector("#notation-menu") ? new LogConsole(this.chess) : null;

        // Initialize the listeners when the dom is loaded.
        document.addEventListener("DOMContentLoaded", () => {
            this.initBoardListener();
            this.initComponentListener();
        });
    }

    /**
     * Listen actions/clicks of user on menu squares for
     * updating the notation menu, log console etc.
     */
    private initBoardListener(): void
    {
        document.querySelectorAll("[data-square-id]").forEach(square => {
            square.addEventListener("mousedown", () => {
                // Update components every time a square is clicked.
                this.notationMenu?.update(this.chess.getNotation(), this.chess.getScores());
                this.logConsole?.print(this.chess.getLogs());
                this.gameCreator?.show(this.chess.getGameAsFenNotation());
            });
        });
    }

    /**
     * Listen actions/clicks of user on menu components for
     * updating the chess board, notation menu, log console etc.
     */
    private initComponentListener(): void
    {
        document.querySelectorAll("[data-operation-type]").forEach(square => {
            square.addEventListener("click", () => {
                switch(square.getAttribute("data-operation-type")){
                    case MenuOperationType.GameCreatorCreate:
                        this.updateComponentsForNewGame();
                        break;
                    default:
                        break;
                }
            });
        });
    }

    /**
     * Update the components of the menu for new game, for example
     * clear the notation menu and print the logs of the game on log
     * console after the game is completely created.
     */
    private updateComponentsForNewGame(): void
    {
        this.notationMenu?.clear();
        this.logConsole?.clear();
        this.gameCreator?.clear();
        this.initBoardListener();

        // Wait until game creator response is ready.
        const interval = setInterval(() => {
            const gameCreatorResponse = document.querySelector("#game-creator-response");
            if(gameCreatorResponse){
                clearInterval(interval);

                // Print the logs of the game on log console after the game is completely created.
                this.logConsole?.print(JSON.parse(gameCreatorResponse!.innerHTML));
                gameCreatorResponse.remove();
            }
        });
    }
}
