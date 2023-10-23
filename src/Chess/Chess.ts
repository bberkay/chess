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
import {Cacher} from "./Services/Cacher.ts";
import {Converter} from "./Utils/Converter.ts";
import {Logger, Source} from "./Services/Logger.ts";

/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses Cacher which provides users to save the game to the cache and load the game from the cache and Logger
 * which provides users to log the game.
 */
export class Chess{

    /**
     * Properties of the Chess class.
     */
    private chessEngine: ChessEngine;
    private chessBoard: ChessBoard;
    private selectedSquare: Square | null;
    private isPromotionScreenOpen: boolean = false;
    private readonly isCachingEnabled: boolean = true;
    private readonly initListener: boolean = true;

    /**
     * Constructor of the Chess class.
     */
    constructor(enableCaching: boolean = true, initListener: boolean = true){
        this.chessBoard = new ChessBoard(false);
        this.chessEngine = new ChessEngine(false);
        this.selectedSquare = null;
        this.isCachingEnabled = enableCaching;
        this.initListener = initListener;

        // If there is a game in cache, load it. Otherwise, create a new game.
        if(!this.checkAndLoadGameFromCache())
            this.createGame();

        /**
         * Initialize the listener when the dom is loaded if chess is not
         * created by the platform.
         */
        if(this.initListener){
            document.addEventListener("DOMContentLoaded", () => {
                this.initActionListener();
            });

            Logger.save("Action listener initialized on constructor", "constructor", Source.Chess);
        }
    }

    /**
     * This function initializes the listener for user's
     * actions on chessboard to make a move on engine and board.
     */
    private initActionListener(): void
    {
        document.querySelectorAll("[data-square-id]").forEach(square => {
            square.addEventListener("mousedown", () => {
                // Make move(with square ID and click mode)
                this.doActionOnBoard(
                    square.getAttribute("data-click-mode") as SquareClickMode,
                    parseInt(square.getAttribute("data-square-id")!) as Square
                );
            });
        });
        Logger.save("Action listener initialized.", "initActionListener", Source.Chess);
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
            Logger.save("Game loaded from cache.", "checkAndLoadGameFromCache", Source.Chess);
            return true;
        }

        Logger.save("No games found in cache", "checkAndLoadGameFromCache", Source.Chess);
        return false;
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        Logger.clear();

        // Initialize the listener
        if(this.initListener)
            this.initActionListener();

        // Clear the game from the cache before creating a new game.
        if(this.isCachingEnabled){
            Cacher.clear();
            Logger.save("Cache cleared before creating a new game", "createGame", Source.Chess);
        }

        // Convert the position to json notation if it is not json notation.
        if(typeof position === "string"){
            position = Converter.fenToJson(position);
            Logger.save(`Given position converted to json notation.`, "createGame", Source.Chess);
        }

        // Create a new game on board.
        this.chessBoard.createGame(position);
        Logger.save(`Game successfully created on Chessboard`, "createGame", Source.Chess);

        // Create a new game on engine.
        this.chessEngine.createGame(position);
        Logger.save(`Game successfully created on ChessEngine`, "createGame", Source.Chess);

        // Save the game to the cache as json notation.
        if(this.isCachingEnabled){
            Cacher.save(position);
            Logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`, "createGame", Source.Chess);
        }

        // Get status from engine and show it on board.
        this.chessBoard.showStatus(this.chessEngine.getStatusOfGame());
    }

    /**
     * Make action on the board.
     * @example doAction(SquareClickMode.Select, Square.a2); // Select the piece on the square a2.
     * @example doAction(SquareClickMode.Play, Square.a3); // Play the selected piece(a2) to the square a3.
     * @example doAction(SquareClickMode.Promote, Square.a8); // Promote the selected piece(a2) to the piece on the square a8.
     */
    public doActionOnBoard(moveType: SquareClickMode, square: Square): void
    {
        // Find the move type and do the action.
        if([SquareClickMode.Play, SquareClickMode.Castling, SquareClickMode.Promote, SquareClickMode.Promotion, SquareClickMode.EnPassant].includes(moveType))
        {
            // Do not allow to cache the game when the promotion screen is open.
            this.isPromotionScreenOpen = moveType == SquareClickMode.Promotion;

            // Play the move on engine and board.
            this._doPlayAction(square);

            /**
             * If the move type is not promotion, clear the board
             * and set selected square to promotion piece square.
             * @see For more information about promote check _doPromote() in src/Chess/Engine/ChessEngine.ts
             */
            if(moveType == SquareClickMode.Promotion){
                this.selectedSquare = this.selectedSquare! % 8 == 0 ? this.selectedSquare! + 8 : this.selectedSquare! - 8;
                this.chessBoard.clearBoard();
            }
            else{
                this._doClearAction();
            }
        }
        else if(moveType === SquareClickMode.Select)
            this._doSelectAction(square);
        else if(moveType == SquareClickMode.Clear)
            this._doClearAction();
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
        if(!this.chessEngine.isSquareSelectable(square))
            return;

        // Get the possible moves of the selected square and highlight them on chessBoard.
        this.selectedSquare = square;
        this.chessBoard.highlightSelect(square);
        this.chessBoard.highlightMoves(this.chessEngine.getMoves(square)!);
    }

    /**
     * This function move the selected square on chessEngine and chessBoard,
     * then finish the turn.
     */
    private _doPlayAction(square: Square): void
    {
        this.chessEngine.playMove(this.selectedSquare!, square);
        this.chessBoard.playMove(this.selectedSquare!, square);
        this.finishTurn();
    }

    /**
     * This function returns the game as fen notation.
     */
    private finishTurn(): void
    {
        // Get status from engine and show it on board.
        this.chessBoard.showStatus(this.chessEngine.getStatusOfGame());

        // Save the game to the cache as json notation.
        if(this.isCachingEnabled && !this.isPromotionScreenOpen){
            Cacher.save(this.chessEngine.getGameAsJsonNotation());
            Logger.save("Game updated in cache after move", "finishTurn", Source.Chess);
        }
    }

    /**
     * Get algebraic notation of the game
     */
    public getNotation(): string[]
    {
        return this.chessEngine.getNotation();
    }

    /**
     * Get scores of the game
     */
    public getScores(): Record<Color, {score: number, pieces: PieceType[]}>
    {
        return this.chessEngine.getScores();
    }

    /**
     * Get log of the game
     */
    public getLogs(): Array<{source: string, message: string}>
    {
        console.log(Logger.get());
        return Logger.get();
    }

    /**
     * Clear the logs of the game
     */
    public clearLogs(): void
    {
        Logger.clear();
    }

    /**
     * Get the status of the game
     */
    public getStatus(): GameStatus
    {
        return this.chessEngine.getStatusOfGame();
    }
}
