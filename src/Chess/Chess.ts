/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {Color, GameStatus, JsonNotation, PieceType, Square, StartPosition} from "./Types";
import {ChessEngine} from "./Engine/ChessEngine";
import {ChessBoard} from "./Board/ChessBoard";
import {SquareClickMode} from "./Board/Types";
import {Cacher} from "../Services/Cacher.ts";
import {Converter} from "./Utils/Converter.ts";
import {Logger} from "../Services/Logger.ts";

/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses Cacher which provides users to save the game to the cache and load the game from the cache and Logger
 * which provides users to log the game.
 */
export class Chess{

    /**
     * Properties of the Chess class.
     */
    public engine: ChessEngine;
    public board: ChessBoard;
    private selectedSquare: Square | null;
    private isPromotionScreenOpen: boolean = false;
    private readonly isCachingEnabled: boolean = true;

    /**
     * Constructor of the Chess class.
     */
    constructor(enableCaching: boolean = true){
        this.board = new ChessBoard();
        this.engine = new ChessEngine();
        this.selectedSquare = null;
        this.isCachingEnabled = enableCaching;

        // If there is a game in cache, load it. Otherwise, create a new game.
        if(!this.checkAndLoadGameFromCache())
            this.createGame();
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Chess/Services/Cacher.ts
     */
    public checkAndLoadGameFromCache(): boolean
    {
        if(!this.isCachingEnabled)
            throw new Error("Cache is not enabled. Please enable it on constructor.");

        // If there is a game in the cache, load it.
        if(!Cacher.isEmpty()){
            this.createGame(Cacher.load());
            Logger.save("Game loaded from cache.");
            return true;
        }

        Logger.save("No games found in cache");
        return false;
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        Logger.clear();

        if(this.isCachingEnabled){
            Cacher.clear();
            Logger.save("Cache cleared before creating a new game");
        }

        if(typeof position === "string"){
            position = Converter.fenToJson(position);
            Logger.save(`Given position converted to json notation.`);
        }

        this.engine.createGame(position);
        Logger.save(`Game successfully created on ChessEngine`);
        
        this.board.createGame(position);
        this.board.setTurnColor(this.engine.getTurnColor());
        Logger.save(`Game successfully created on Chessboard`);

        if(this.isCachingEnabled){
            Cacher.save(position);
            Logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`);
        }

        this.board.showStatus(this.engine.getGameStatus());

        // Initialize the listener for moves because the game is 
        // created from scratch and the listener is not initialized.
        this.initBoardListener();
    }

    /**
     * This function initializes the listener for user's
     * actions on chessboard to make a move on engine and board.
     */
    private initBoardListener(): void
    {
        this.board.bindMoveEventCallbacks({
            onPieceSelected: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPieceSelected(squareId, squareClickMode);
            },
            onPieceMoved: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPieceMoved(squareId, squareClickMode);   
            }
        });
        Logger.save("Moves listener initialized");
    }

    /**
     * Handle the selected piece on the board.
     */
    private handleOnPieceSelected(squareId: Square, squareClickMode: SquareClickMode): void
    {
        //console.log("on piece selected", "squareId: ", squareId, "squareClickMode: ", squareClickMode);
        this._doSelectAction(squareId);
    }

    /**
     * Handle the moved piece on the board.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void
    {
        //console.log("on piece moved", "squareId: ", squareId, "squareClickMode: ", squareClickMode);
        if(![
            SquareClickMode.Select, 
            SquareClickMode.Selected, 
            SquareClickMode.Clear, 
            SquareClickMode.Disable].includes(squareClickMode)
        ){
            this.isPromotionScreenOpen = squareClickMode == SquareClickMode.Promotion;
            this._doPlayAction(squareId);
        }
    }

    /**
     * This function set the selected square and highlight select on
     * chessBoard then get the possible moves of the selected square
     * with chessEngine and highlight them on chessBoard.
     */
    private _doSelectAction(square: Square): void
    {
        this.selectedSquare = square;
        this.board.highlightMoves(this.engine.getMoves(square)!);
    }

    /**
     * This function move the selected square on chessEngine and chessBoard,
     * then finish the turn.
     */
    private _doPlayAction(square: Square): void
    {
        this.engine.playMove(this.selectedSquare!, square);
        this.board.playMove(this.selectedSquare!, square);
        this.finishTurn();
    }

    /**
     * This function returns the game as fen notation.
     */
    private finishTurn(): void
    {
        this.selectedSquare = this.isPromotionScreenOpen ? this.selectedSquare : null;
        this.board.showStatus(this.engine.getGameStatus());
        this.board.setTurnColor(this.engine.getTurnColor());
        if(this.isCachingEnabled && !this.isPromotionScreenOpen){
            Cacher.save(this.engine.getGameAsJsonNotation());
            Logger.save("Game updated in cache after move");
        }
    }

    /**
     * Get log of the game
     */
    public getLogs(): ReadonlyArray<{source: string, message: string}>
    {
        return Logger.get();
    }

    /**
     * Clear the logs of the game
     */
    public clearLogs(): void
    {
        Logger.clear();
    }
}
