/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {JsonNotation, PieceType, Square, Color, StartPosition, ChessEvent} from "./Types";
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

    private _selectedSquare: Square | null = null;
    private _isPromotionScreenOpen: boolean = false;

    public readonly logger: Logger = new Logger("src/Chess/Chess.ts");

    /**
     * Constructor of the Chess class.
     */
    constructor(){
        //For testing purposes
        //document.addEventListener("keydown", (event) => {
        //    if(event.ctrlKey && event.key === " "){
        //        (async () => {
        //            let counter = 0;
        //            const moves = [{from:53,to:37}];
        //            for(const move of moves){
        //                this.engine.playMove(move.from, move.to);
        //                this.board.playMove(move.from, move.to);
        //                this.finishTurn();
        //                await new Promise(resolve => setTimeout(resolve, 1000)); 
        //                counter++;
        //            }
        //        })();
        //    }
        //});
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Services/LocalStorage.ts
     */
    public checkAndLoadGameFromCache(): boolean
    {
        // If there is a game in the cache, load it.
        if(LocalStorage.isExist(LocalStorageKey.LastBoard)){
            this.logger.save("Game loading from cache...");
            this.createGame(LocalStorage.load(LocalStorageKey.LastBoard));
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
        LocalStorage.clear(LocalStorageKey.LastBoard);
        this.logger.save("Cache cleared before creating a new game");

        if(typeof position === "string"){
            position = Converter.fenToJson(position);
            this.logger.save(`Given position converted to json notation.`);
        }

        this.engine.createGame(position);
        this.logger.save(`Game successfully created on ChessEngine`);
        
        this.board.createGame(position);
        this.board.setTurnColor(this.engine.getTurnColor());
        this.logger.save(`Game successfully created on Chessboard`);

        LocalStorage.save(LocalStorageKey.LastBoard, position);
        this.logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`);

        this.board.showStatus(this.engine.getGameStatus());

        // Initialize the listener for moves because the game is 
        // created from scratch and the listener is not initialized.
        this.initBoardListener();
    }

    /**
     * Create a piece on the board and engine.
     */
    public createPiece(color: Color, pieceType: PieceType, square: Square): void
    {
        this.board.createPiece(color, pieceType, square);
        this.engine.createPiece(color, pieceType, square);
        this.logger.save(`Piece[${JSON.stringify({color, pieceType, square})}] created on board and engine`);
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
        document.dispatchEvent(new CustomEvent(
            ChessEvent.OnPieceCreated, {detail: {square: square}}
        ));
    }

    /**
     * Remove a piece from the board and engine.
     */
    public removePiece(square: Square): void
    {
        this.board.removePiece(square);
        this.engine.removePiece(square);
        this.logger.save(`Piece[${square}] removed from board and engine`);
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
        document.dispatchEvent(new CustomEvent(
            ChessEvent.OnPieceRemoved, {detail: {square: square}}
        ));
    }

    /**
     * This function initializes the listener for user's
     * actions on chessboard to make a move on engine and board.
     */
    private initBoardListener(): void
    {
        this.board.bindMoveEventCallbacks({
            onPieceSelected: (squareId: Square, isPreSelected: boolean) => {
                this.handleOnPieceSelected(squareId, isPreSelected);
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
    private handleOnPieceSelected(squareId: Square, isPreSelected: boolean): void
    {
        this._selectedSquare = squareId;
        this.board.highlightMoves(this.engine.getMoves(this._selectedSquare, isPreSelected)!);
        document.dispatchEvent(new CustomEvent(ChessEvent.OnPieceSelected, {detail: {square: squareId}}));
    }

    /**
     * Handle the moved piece on the board.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void
    {
        if(![SquareClickMode.PreSelect,
            SquareClickMode.Select, 
            SquareClickMode.PreSelected,
            SquareClickMode.Selected, 
            SquareClickMode.Clear, 
            SquareClickMode.Disable].includes(squareClickMode)
        ){
            const selectedSquare = this._selectedSquare;
            this._isPromotionScreenOpen = squareClickMode == SquareClickMode.Promotion;
            this.playMove(selectedSquare!, squareId);
            document.dispatchEvent(new CustomEvent(
                ChessEvent.onPieceMovedByPlayer, {detail: {from: selectedSquare, to: squareId}}
            ));
        }
    }

    /**
     * Play a move on the board and engine.
     */
    public playMove(from: Square, to: Square): void
    {
        this.engine.playMove(from, to);
        this.board.playMove(from, to);
        this.finishTurn();
        document.dispatchEvent(new CustomEvent(ChessEvent.OnPieceMoved, {detail: {from: from, to: to}}));
    }


    /**
     * This function returns the game as fen notation.
     */
    public finishTurn(): void
    {
        this._selectedSquare = this._isPromotionScreenOpen ? this._selectedSquare : null;
        this.board.showStatus(this.engine.getGameStatus());
        if(!this._isPromotionScreenOpen){
            this.board.setTurnColor(this.engine.getTurnColor());
            LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
            this.logger.save("Game updated in cache after move");
        } 
    }
}
