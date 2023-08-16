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

/**
 * This class provides users to a playable game on the web by connecting chessEngine and chessBoard.
 */
export class Chess{

    /**
     * Properties of the Chess class.
     */
    private chessEngine: ChessEngine;
    private chessBoard: ChessBoard;
    private selectedSquare: Square | null = null;

    /**
     * Constructor of the Chess class.
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

        // Create a new game on engine.
        this.chessEngine.createGame(position);

        // Create a new game on board.
        this.chessBoard.createGame(position);
    }

    /**
     * Make action on the game.
     * @example doAction(SquareClickMode.Select, Square.a2); // Select the piece on the square a2.
     * @example doAction(SquareClickMode.Play, Square.a3); // Play the selected piece(a2) to the square a3.
     * @example doAction(SquareClickMode.Promote, Square.a8); // Promote the selected piece(a2) to the piece on the square a8.
     */
    public doAction(moveType: SquareClickMode, square: Square): void
    {
        if(this.selectedSquare && BoardManager.getPiece(this.selectedSquare)!.getColor() !== StateManager.getPlayerColor())
            return;

        if(moveType === SquareClickMode.Play && this.selectedSquare !== null)
        {
            /**
             * If move type is play, move the selected square on chessEngine and chessBoard,
             * then set the selected square to null and clear the board.
             */
            this.chessEngine.playMove(this.selectedSquare, square);
            this.chessBoard.playMove(this.selectedSquare, square);
            this.selectedSquare = null;
            this.chessBoard.clearBoard();
        }
        else if(moveType === SquareClickMode.Select)
        {
            /**
             * If move type is select, set the selected square and highlight select on
             * chessBoard then get the possible moves of the selected square
             * with chessEngine and highlight them on chessBoard.
             */
            this.selectedSquare = square;
            this.chessBoard.highlightSelect(square);
            this.chessBoard.highlightMoves(this.chessEngine.getMoves(square)!);
        }
        else if(moveType == SquareClickMode.Clear)
        {
            /**
             * If move type is clear, clear the selected square and clear
             * the board on chessBoard.
             */
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
