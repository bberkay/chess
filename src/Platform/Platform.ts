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
        this.logConsole = document.querySelector("#log-console") ? new LogConsole() : null;

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
     * Update the components of the menu, for example
     * update the notation menu and print the logs of the game on log
     * console after the move is made.
     */
    private updateComponents(){
        this.notationMenu?.update();
        this.logConsole?.stream();
        this.gameCreator?.show(this.chess.engine.getGameAsFenNotation());
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
              this.logConsole?.clear();
              break;
            case MenuOperation.CreateGame:
              this.createGameAndUpdateComponents();
              break;
            case MenuOperation.ChangeMode:
              this.gameCreator?.changeMode();
              break;
          case MenuOperation.FlipBoard:
            this.notationMenu?.flip();
            break;
        }
    }

    /**
     * Update the components of the menu for new game, for example
     * clear the notation menu and print the logs of the game on log
     * console after the game is completely created.
     */
    private createGameAndUpdateComponents(): void
    {
        this.gameCreator?.createGame();
        this.notationMenu?.clear();
        this.logConsole?.clear();
        this.initBoardListener();

        // Print first logs of the game.
        /*const interval = setInterval(() => {
            const gameCreatorResponse = document.querySelector("#game-creator-response");
            if(gameCreatorResponse){
                clearInterval(interval);
                this.logConsole?.stream();
                gameCreatorResponse.remove();
            }
        });*/
    }
}
