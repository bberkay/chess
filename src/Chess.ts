import {Color, PieceType, Square, SquareClickMode, StartPosition} from "./Enums.ts";
import {ChessEngine} from "./Engine/ChessEngine";
import {ChessBoard} from "./Board/ChessBoard";
import {Session} from "./Global/Session.ts";
import {Converter} from "./Utils/Converter.ts";

export class Chess{
    /**
     * This class provides users to a playable game on the web by connecting chessEngine and chessBoard.
     */

    private chessEngine: ChessEngine;
    private chessBoard: ChessBoard;
    private selectSquare: Square | null = null;

    constructor(){
        this.chessEngine = new ChessEngine();
        this.chessBoard = new ChessBoard();

        // Check the cache and load the game(if exists).
        this.checkAndLoadGameFromCache();
    }

    /**
     * This function loads the game from the cache. If there is no game in the cache, it creates a new game.
     */
    private checkAndLoadGameFromCache(): void
    {
        this.createGame();
        /*if(!Cache.get(CacheLayer.Game))
            this.createGame();
        else{
            console.log("Game is loaded from the cache.");
        }*/
    }

    /**
     * This function creates a new game with the given position(fen notation or json notation).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // Clear the cache and global variables.
        Session.clear()

        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create a new game.
        this.chessEngine.createGame(position);

        // Setup the chess board.
        this.chessBoard.createBoard(position);
    }

    /**
     * Make a move on the board.
     * @example makeMove(Square.a2, "Select"); // Select the piece on the square a2.
     * @example makeMove(Square.a3, "Play"); // Play the selected piece(a2) to the square a3.
     * @example makeMove(Square.a8, "Promote"); // Promote the selected piece(a2) to the piece on the square a8.
     */
    public makeMove(square: Square, moveType: SquareClickMode): void
    {
        // If move is play, move the selected square then unset selected square.
        if(moveType === SquareClickMode.Play && this.selectSquare !== null)
        {
            this.chessBoard.highlightMove(this.selectSquare, square);
            this.selectSquare = null;
        }
        // If move type is select, select the square.
        else if(moveType === SquareClickMode.Select)
        {
            this.selectSquare = square;
            this.chessBoard.highlightSquare(square);
            this.chessBoard.highlightMoves(this.chessEngine.getMoves(square));
        }
        // If move type is clear, unset selected square and clear the board.
        else if(moveType == SquareClickMode.Refresh)
        {
            this.selectSquare = null;
            this.chessBoard.refreshBoard();
        }
    }
}
