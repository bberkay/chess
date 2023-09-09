import { Chess } from './Chess/Chess.ts';
import { Platform } from "./Platform/Platform.ts";

/**
 * This class is the main class of the chess platform.
 * It provides the connections between the chess, menu and other systems.
 */
export class ChessPlatform{

    public readonly chess: Chess;
    public readonly platform: Platform;

    /**
     * Constructor of the ChessPlatform class.
     */
    constructor(enableCaching: boolean = true) {
        this.chess = new Chess(enableCaching);
        this.platform = new Platform(this.chess);

        // If there is a game in cache, load it. Otherwise, create a new game.
        if(!this.chess.checkAndLoadGameFromCache())
            this.chess.createGame();
    }
}
