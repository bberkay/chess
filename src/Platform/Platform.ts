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
import { MenuOperationType, PlatformConfig } from "./Types";

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
    constructor(chess: Chess, platformConfig: PlatformConfig) {
        this.chess = chess;
        this.gameCreator = platformConfig.enableGameCreator ? new GameCreator(this.chess) : null;
        this.notationMenu = platformConfig.enableNotationMenu ? new NotationMenu(this.chess) : null;
        this.logConsole = platformConfig ? new LogConsole(this.chess) : null;

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
                // Update notation menu and log console every time when user click a square.
                this.notationMenu!.update(this.chess.getNotation(), this.chess.getScores());
                this.logConsole!.print(this.chess.getLogs());
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
                if(square.getAttribute("data-operation-type") === MenuOperationType.GameCreatorCreate){
                    this.notationMenu!.clear();
                    this.logConsole!.clear();
                    this.initBoardListener();
                }
            });
        });
    }
}
