import { ChessPlatformConfig } from "./Types";
import { Chess } from './Chess/Chess.ts';
import { Platform } from "./Platform/Platform.ts";
import { SquareClickMode } from "./Chess/Board/Types";
import { Square } from "./Chess/Types";
import { GameCreatorOperationType, GameCreatorOperationValue } from "./Platform/Types";

/**
 *
 */
export class ChessPlatform{

    public readonly chess: Chess;
    public readonly platform: Platform;

    /**
     * Constructor of the ChessPlatform class.
     */
    constructor(chessPlatformConfig: ChessPlatformConfig = {}) {
        this.chess = new Chess(chessPlatformConfig.chessConfig);
        this.platform = new Platform(this.chess, chessPlatformConfig.platformConfig);

        // If there is a game in cache, load it. Otherwise, create a new game.
        if(!this.chess.checkAndLoadGameFromCache())
            this.chess.createGame();

        // Init listeners.
        this.initListeners();
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
            });
        });

        /**
         * Listen actions/clicks of user on menu on platform.
         * This is for the platform in src\Platform\Platform.ts.
         */
        document.querySelectorAll("[data-operation-type]").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                // Make operation(from menu)
                this.platform.doActionOnMenu(
                    menuItem.getAttribute("data-operation-type") as GameCreatorOperationType,
                    menuItem.getAttribute("data-operation-value") as GameCreatorOperationValue
                );
            });
        });
    }
}
