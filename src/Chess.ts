/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import { Color, PieceType, Square, StartPosition, CacheLayer } from "Types";
import { SquareClickMode } from "Types/board";
import { ChessEngine } from "./Engine/ChessEngine";
import { ChessBoard } from "./Interface/ChessBoard";
import { Converter } from "./Utils/Converter.ts";
import { CacheManager } from "./Managers/CacheManager.ts";


/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses CacheManager which provides users to save the game to the cache and load the game from the cache.
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
     * @see For more information about cache management check src/Managers/CacheManager.ts
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
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     * @see For more information about StartPosition enum check src/types.ts
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // Clear the game from the cache.
        CacheManager.clear(CacheLayer.Game);

        // If fen notation is given, convert it to json notation.
        if(!Array.isArray(position))
            position = Converter.convertFENToJSON(position as string);

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
        // TODO : Check the move is legal or not with chess engine.
        if(moveType === SquareClickMode.Play && this.selectedSquare !== null && this.selectedSquare !== square)
        {
            /**
             * If the selected square is not null and the selected square is not the same as the square
             */
            this._doPlayAction(square);
        }
        else if(moveType === SquareClickMode.Select && this.selectedSquare === null)
        {
            /**
             * If the selected square is null
             */
            this._doSelectAction(square);
        }
        else if(moveType == SquareClickMode.Clear)
        {
            /**
             * If the move type is clear or
             */
            this._doClearAction();
        }
    }

    /**
     * This function clears the selected square and clears the board on chessBoard.
     */
    private _doClearAction(): void
    {
        this.selectedSquare = null;
        this.chessBoard.clearBoard();
    }

    /**
     * This function set the selected square and highlight select on
     * chessBoard then get the possible moves of the selected square
     * with chessEngine and highlight them on chessBoard.
     */
    private _doSelectAction(square: Square): void
    {
        this.selectedSquare = square;
        this.chessBoard.highlightSelect(square);
        this.chessBoard.highlightMoves(this.chessEngine.getMoves(square)!);
    }

    /**
     * This function move the selected square on chessEngine and chessBoard,
     * then set the selected square to null and clear the board.
     */
    private _doPlayAction(square: Square): void
    {
        this.chessEngine.playMove(this.selectedSquare!, square);
        this.chessBoard.playMove(this.selectedSquare!, square);
        this.selectedSquare = null;
        this.chessBoard.clearBoard();
    }
}
