/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {JsonNotation, Square, StartPosition} from "./Types";
import {ChessEngine} from "./Engine/ChessEngine";
import {ChessBoard} from "./Board/ChessBoard";
import {SquareClickMode} from "./Board/Types";
import {LocalStorage, LocalStorageKey} from "@Services/LocalStorage.ts";
import {Converter} from "./Utils/Converter.ts";
import {Logger} from "@Services/Logger.ts";

/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses LocalStorage which provides users to save the game to the cache and load the game from the cache and Logger
 * which provides users to log the game.
 */
export class Chess{

    /**
     * Properties of the Chess class.
     */
    public readonly engine: ChessEngine = new ChessEngine();
    public readonly board: ChessBoard = new ChessBoard();
    private selectedSquare: Square | null;
    private isPromotionScreenOpen: boolean = false;
    private readonly isCachingEnabled: boolean = true;
    public readonly logger: Logger = new Logger("src/Chess/Chess.ts");

    /**
     * Constructor of the Chess class.
     */
    constructor(enableCaching: boolean = true){
        this.selectedSquare = null;
        this.isCachingEnabled = enableCaching;

        Logger.clear();
        LocalStorage.save(LocalStorageKey.Welcome, true);

        // If there is a game in cache, load it. Otherwise, create a new game.
        if(!this.checkAndLoadGameFromCache())
            this.createGame();
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Chess/Services/LocalStorage.ts
     */
    public checkAndLoadGameFromCache(): boolean
    {
        if(!this.isCachingEnabled)
            throw new Error("Cache is not enabled. Please enable it on constructor.");

        // If there is a game in the cache, load it.
        if(LocalStorage.isExist(LocalStorageKey.LastGame)){
            this.logger.save("Game loading from cache...");
            this.createGame(LocalStorage.load(LocalStorageKey.LastGame));
            LocalStorage.save(LocalStorageKey.Welcome, false);
            this.logger.save("Game loaded from cache");
            return true;
        }

        this.logger.save("No games found in cache");
        return false;
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        if(this.isCachingEnabled){
            LocalStorage.clear(LocalStorageKey.LastGame);
            this.logger.save("Cache cleared before creating a new game");
        }

        if(typeof position === "string"){
            position = Converter.fenToJson(position);
            this.logger.save(`Given position converted to json notation.`);
        }

        this.engine.createGame(position);
        this.logger.save(`Game successfully created on ChessEngine`);
        
        this.board.createGame(position);
        this.board.setTurnColor(this.engine.getTurnColor());
        this.logger.save(`Game successfully created on Chessboard`);

        if(this.isCachingEnabled){
            LocalStorage.save(LocalStorageKey.LastGame, position);
            this.logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`);
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
            onPieceSelected: (squareId: Square) => {
                this.handleOnPieceSelected(squareId);
            },
            onPieceMoved: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPieceMoved(squareId, squareClickMode);   
            }
        });
        this.logger.save("Moves listener initialized");
    }

    /**
     * Handle the selected piece on the board.
     */
    private handleOnPieceSelected(squareId: Square): void
    {
        this._doSelectAction(squareId);
    }

    /**
     * Handle the moved piece on the board.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void
    {
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
        if(!this.isPromotionScreenOpen) this.board.setTurnColor(this.engine.getTurnColor());
        if(this.isCachingEnabled && !this.isPromotionScreenOpen){
            LocalStorage.save(LocalStorageKey.LastGame, this.engine.getGameAsJsonNotation());
            this.logger.save("Game updated in cache after move");
        }
    }
}
