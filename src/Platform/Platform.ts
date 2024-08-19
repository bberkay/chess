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
import { MenuOperation } from "./Types";

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
            this.initOperationListener();
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
                this.notationMenu?.update(this.chess.engine.getNotation(), this.chess.engine.getScores());
                this.logConsole?.print(this.chess.getLogs());
                this.gameCreator?.show(this.chess.engine.getGameAsFenNotation());
            });
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
        // Do operation by given operation type.
        switch(menuOperation){
          case MenuOperation.ClearConsole:
              this.logConsole?.clear();
              break;
            case MenuOperation.CreateGame:
              this.updateComponentsForNewGame();
              this.gameCreator?.createGame();
              break;
            case MenuOperation.ChangeMode:
              this.gameCreator?.changeMode();
              break;
          case MenuOperation.FlipBoard:
            this.chess.board!.flip();
            break;
        }
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
