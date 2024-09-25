/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {JsonNotation, PieceType, Square, Color, StartPosition, ChessEvent, GameStatus} from "./Types";
import {ChessEngine, MoveValidationError} from "./Engine/ChessEngine";
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
    private _preSelectedSquare: Square | null = null;
    private _preMove: {from: Square, to: Square} | null = null;

    public readonly logger: Logger = new Logger("src/Chess/Chess.ts");
    
    /**
     * Constructor of the Chess class.
     */
    constructor(){
        this.logger.save("Chess class initialized");
    }

    /**
     * This function resets the properties of the Chess class.
     */
    private resetProperties(): void
    {
        this._selectedSquare = null;
        this._isPromotionScreenOpen = false;
        this._preSelectedSquare = null;
        this._preMove = null;
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
        this.resetProperties();
        this.logger.save("Cache cleared and properties reset before creating a new game");

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
        document.dispatchEvent(new CustomEvent(
            ChessEvent.OnPieceCreated, {detail: {square: square}}
        ));
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
    }

    /**
     * Remove a piece from the board and engine.
     */
    public removePiece(square: Square): void
    {
        this.board.removePiece(square);
        this.engine.removePiece(square);
        this.logger.save(`Piece[${square}] removed from board and engine`);
        document.dispatchEvent(new CustomEvent(
            ChessEvent.OnPieceRemoved, {detail: {square: square}}
        ));
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
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
            },
            onPreMoveCanceled: () => {
                this._preSelectedSquare = null;
                this._preMove = null;
                this.logger.save("Pre-move canceled");
            }
        });
        this.logger.save("Moves listener initialized");
    }

    /**
     * Handle the selected piece on the board.
     */
    private handleOnPieceSelected(squareId: Square, isPreSelected: boolean): void
    {
        if(isPreSelected) 
            this._preSelectedSquare = squareId;
        else 
            this._selectedSquare = squareId;    

        const selectedSquare = isPreSelected ? this._preSelectedSquare : this._selectedSquare;
        this.board.highlightMoves(
            this.engine.getMoves(
                selectedSquare!, 
                isPreSelected
            ), 
            isPreSelected
        );
        this.logger.save(`Piece[${squareId}] selected on the board`);
        document.dispatchEvent(new CustomEvent(ChessEvent.OnPieceSelected, {detail: {square: squareId}}));
    }

    /**
     * Handle the moved piece on the board.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void
    {
        if([SquareClickMode.Play, 
            SquareClickMode.Promote, 
            SquareClickMode.Promotion, 
            SquareClickMode.Castling, 
            SquareClickMode.EnPassant
        ].includes(squareClickMode))
        {
            this._isPromotionScreenOpen = squareClickMode == SquareClickMode.Promotion;
            this.playMove(this._selectedSquare!, squareId);
            document.dispatchEvent(new CustomEvent(
                ChessEvent.onPieceMovedByPlayer, {detail: {from: this._selectedSquare!, to: squareId}}
            ));
        }
        else if([SquareClickMode.PrePlay,
            SquareClickMode.PrePromote,
            SquareClickMode.PrePromotion,
            SquareClickMode.PreCastling,
            SquareClickMode.PreEnPassant
        ].includes(squareClickMode))
        {
            this._preMove = {from: this._preSelectedSquare!, to: squareId}
            this.logger.save(`Pre-move[${JSON.stringify({from: this._preSelectedSquare!, to: squareId})}] saved`);
            document.dispatchEvent(new CustomEvent(ChessEvent.OnPieceSelected, {detail: {square: squareId}}));
        }
    }

    /**
     * Play a move on the board and engine.
     */
    public playMove(from: Square, to: Square): void
    {
        try{
            this.engine.playMove(from, to);
            this._preSelectedSquare = null;
        }catch(e){
            if(!(e instanceof MoveValidationError && this._preSelectedSquare)){
                throw e;
            }
        }
        this.board.playMove(from, to);
        setTimeout(() => {
            this.logger.save(`Move[${JSON.stringify({from, to})}] played on board and engine`);
            this.finishTurn();   
            document.dispatchEvent(new CustomEvent(ChessEvent.OnPieceMoved, {detail: {from: from, to: to}}));
        }, 100);
    }

    /**
     * Play the pre-move if it exists.
     */
    private playPreMoveIfExist(): void
    {
        if(!this._preMove)
            return;

        const { from, to } = this._preMove;
        this._preMove = null;
        this.playMove(from, to);
        this.logger.save(`Pre-move[${JSON.stringify(this._preMove)}] played`);
        document.dispatchEvent(new CustomEvent(
            ChessEvent.onPieceMovedByPlayer, {detail: {from: from, to: to}}
        ));
    }

    /**
     * This function returns the game as fen notation.
     */
    public finishTurn(): void
    {
        const gameStatus = this.engine.getGameStatus();
        this.board.showStatus(gameStatus);

        if([GameStatus.BlackVictory, 
            GameStatus.WhiteVictory, 
            GameStatus.Draw
        ].includes(gameStatus))
        {
            this.logger.save("Game updated in cache after move");
            LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
            return;
        }

        this._selectedSquare = this._isPromotionScreenOpen ? this._selectedSquare : null;
        if(!this._isPromotionScreenOpen){
            this.board.setTurnColor(this.engine.getTurnColor());
            this.playPreMoveIfExist();
            this.logger.save("Game updated in cache after move");
            LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
        } 
    }
}
