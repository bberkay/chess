/**
 * @module Chess
 * @description This module provides users to a playable game on the web by connecting ChessEngine and ChessBoard.
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import {ChessEngine} from "./Engine/ChessEngine";
import {ChessBoard} from "./Interface/ChessBoard";
import {Converter} from "./Utils/Converter.ts";
import {BoardManager} from "./Managers/BoardManager.ts";
import {StateManager} from "./Managers/StateManager.ts";
import {CacheManager} from "./Managers/CacheManager.ts";
import {CacheLayer, Color, PieceType, Square, SquareClickMode, StartPosition} from "./Types.ts";

export class Chess{
    /**
     * This class provides users to a playable game on the web by connecting chessEngine and chessBoard.
     */

    private chessEngine: ChessEngine;
    private chessBoard: ChessBoard;
    private selectedSquare: Square | null = null;

    /**
     * Constructor of the Chess class.b
     */
    constructor(){
        this.chessEngine = new ChessEngine(false);
        this.chessBoard = new ChessBoard(false);

        // Check the cache and load the game(if exists).
        this.checkAndLoadGameFromCache();
    }

    /**
     * This function loads the game from the cache. If there is no game in the cache, it creates a new game.
     */
    private checkAndLoadGameFromCache(): void
    {
        this.createGame(StartPosition.Standard);
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
        // Clear the current/old game.
        this.clear()

        // If fen notation is given, convert it to json notation.
        if(!Array.isArray(position))
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create a new game.
        this.chessEngine.createGame(position);

        // Set up the chess board.
        this.chessBoard.createBoard(position);
    }

    /**
     * Make a move on the board.
     * @example makeMove(SquareClickMode.Select, Square.a2); // Select the piece on the square a2.
     * @example makeMove(SquareClickMode.Play, Square.a3); // Play the selected piece(a2) to the square a3.
     * @example makeMove(SquareClickMode.Promote, Square.a8); // Promote the selected piece(a2) to the piece on the square a8.
     */
    public makeMove(moveType: SquareClickMode, square: Square): void
    {
        // If move is play, move the selected square then unset selected square.
        if(moveType === SquareClickMode.Play && this.selectedSquare !== null)
        {
            this.chessEngine.playMove(this.selectedSquare, square);
            this.chessBoard.movePiece(this.selectedSquare, square);
            this.selectedSquare = null;
        }
        // If move type is select, select the square.
        else if(moveType === SquareClickMode.Select)
        {
            this.selectedSquare = square;
            this.chessBoard.selectSquare(square);
            this.chessBoard.highlightMoves(this.chessEngine.getMoves(square)!);
        }
        // If move type is clear, unset selected square and clear the board.
        else if(moveType == SquareClickMode.Clear)
        {
            this.selectedSquare = null;
            this.chessBoard.clearBoard();
        }
    }

    /**
     * @description This function clear the current game and cache then creates a new game.
     */
    private clear(): void
    {
        // Clear the complete game.
        BoardManager.clear();
        StateManager.clear();
        CacheManager.clear(CacheLayer.Game);
    }
}
