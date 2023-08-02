import { StartPosition, CacheLayer, Color, PieceType, Square } from "./Enums.ts";
import { ChessEngine } from "./Engine/ChessEngine";
import { ChessBoard } from "./Board/ChessBoard";
import { Cache } from "./Global/Cache";
import { Session } from "./Global/Session.ts";

export class Chess{
    /**
     * This class provides users to a playable game on the web by connecting chessEngine and chessBoard.
     */

    private chessEngine: ChessEngine;
    private chessBoard: ChessBoard;

    constructor(){
        this.chessEngine = new ChessEngine();
        this.chessBoard = new ChessBoard();

        // Check the cache and load the game.
        this.checkAndLoadGameFromCache();
    }

    /**
     * This function loads the game from the cache. If there is no game in the cache, it creates a new game.
     */
    private checkAndLoadGameFromCache(): void
    {
        this.createNewGame();
        /*if(!Cache.get(CacheLayer.Game))
            this.createNewGame();
        else{
            console.log("Game is loaded from the cache.");
        }*/
    }

    /**
     * This function creates a new game with the given position(fen notation or json notation).
     */
    public createNewGame(position:StartPosition|Array<{color: Color, type:PieceType, square:Square}> = StartPosition.Standard): void
    {
        // Clear the cache and global variables.
        Session.clear()

        // Create a new game.
        this.chessEngine.createGame(position);

        // Setup the chess board.
        this.chessBoard.createBoard(position);
    }
}
