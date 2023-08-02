import { CacheLayer, Color, Square, CastlingType, EnPassantDirection } from "../Enums";
import { Board, Castling, EnPassant } from '../Types';
import { Cache } from "./Cache";
import { Piece } from "../Models/Piece";

export class Session {
    /**
     * This class stores the current status of the current game
     */

    // General information about the current game
    private static currentBoard: Board;
    private static currentColor: Color = Color.White;
    private static checkedColor: Color | null = null;
    private static moveCount: number = 0;

    // Color Long mean Color player's queen side, Color Short mean Color player's king side.
    private static castlingStatus: Castling = {
        [CastlingType.WhiteLong]: true,
        [CastlingType.WhiteShort]: true,
        [CastlingType.BlackLong]: true,
        [CastlingType.BlackShort]: true,
        [CastlingType.Long]: true,
        [CastlingType.Short]: true,
    }

    // Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimize, see GameManager.canPawnDoEnPassant).
    private static bannedEnPassantPawns: EnPassant = {};

    // Piece ID List(unique 64 number between 1000 and 9999 for each piece)
    private static pieceIDList: Array<number> = [];

    /*********************************************
     *
     * GETTER
     *
     *********************************************/

    /**
     * Get current board
     */
    static getBoard(): Board
    {
        return Session.currentBoard;
    }

    /**
     * Get current square
     */
    static getSquare(squareId: Square): Piece | null
    {
        return Session.currentBoard[squareId];
    }

    /**
     * Get current player
     */
    static getPlayerColor(): Color
    {
        return Session.currentColor;
    }

    /**
     * Get enemy color
     */
    static getEnemyColor(): Color
    {
        return Session.currentColor === Color.White ? Color.Black : Color.White;
    }


    /**
     * Get checked player
     */
    static getCheckedColor(): Color|null
    {
        return Session.checkedColor;
    }

    /**
     * Get move count
     */
    static getMoveCount(): number
    {
        return Session.moveCount;
    }

    /**
     * Get castling status
     * @example Session.getCastlingStatus(CastlingType.WhiteLong)
     */
    static getCastlingStatus(castlingType: CastlingType): boolean
    {
        return Session.castlingStatus[castlingType];
    }

    /**
     * Get en passant status of pawn
     */
    static getEnPassantStatus(pieceID: number): EnPassantDirection
    {
        return Session.bannedEnPassantPawns[pieceID];
    }

    static getPieceIDList(): Array<number>
    {
        return Session.pieceIDList;
    }


    /*********************************************
     *
     * SETTER
     *
     *********************************************/

    /**
     * Add piece to square or do empty
     */
    static setSquare(squareID: Square, content: Piece|null): void
    {
        Session.currentBoard[squareID] = content;

        // Add to cache
        Cache.set(CacheLayer.Game, "currentBoard", Session.currentBoard);
    }

    /**
     * Set next move(change current player's color to enemy's color)
     */
    static setNextMove(): void
    {
        Session.currentColor = this.getEnemyColor();

        // Add to cache
        Cache.set(CacheLayer.Game, "currentColor", Session.currentColor);
    }

    /**
     * Increase move count
     */
    static increaseMoveCount(): void
    {
        Session.moveCount += 1;

        // Add to cache
        Cache.set(CacheLayer.Game, "moveCount", Session.moveCount);
    }

    /**
     * Set current player's color(generally used at start and reset operations)
     */
    static setPlayerColor(color: Color): void
    {
        Session.currentColor = color;

        // Add to cache
        Cache.set(CacheLayer.Game, "currentColor", Session.currentColor);
    }

    /**
     * Set move count(generally used at start and reset operations)
     */
    static setMoveCount(count: number): void
    {
        if(count < 0)
            throw new Error("Move count can't be negative");
        Session.moveCount = count;

        // Add to cache
        Cache.set(CacheLayer.Game, "moveCount", Session.moveCount);
    }

    /**
     * Set Checked Color
     */
    static setCheckedColor(color: Color|null): void
    {
        Session.checkedColor = color;

        // Add to cache
        Cache.set(CacheLayer.Game, "checkedColor", Session.checkedColor);
    }

    /**
     * Change castling status
     * @example input: (CastlingType.WhiteLong, false), output: That means white long castling is disabled
     */
    static setCastlingStatus(castlingType: CastlingType, value: boolean): void
    {
        Session.castlingStatus[castlingType] = value;

        // Add to cache
        Cache.set(CacheLayer.Game, "castlingStatus", Session.castlingStatus);
    }

    /**
     * Add piece(id) that can't en passant to en passant status list
     * @example input: (pieceId, EnPassantDirection.Left), output: That means piece(id) can't en passant to left.
     */
    static setBannedEnPassantPawn(pieceID: number, direction: EnPassantDirection): void
    {
        Session.bannedEnPassantPawns[pieceID] = direction;

        // Add to cache
        Cache.set(CacheLayer.Game, "bannedEnPassantPawns", Session.bannedEnPassantPawns);
    }

    /**
     * Add id to piece id list
     */
    static addToPieceIDList(id: number): void
    {
        Session.pieceIDList.push(id);

        // Add to cache
        Cache.set(CacheLayer.Game, "pieceIDList", Session.pieceIDList);
    }

    /**
     * Set piece id list
     */
    static setPieceIDList(newPieceIDList: Array<number>): void
    {
        Session.pieceIDList = newPieceIDList;

        // Add to cache
        Cache.set(CacheLayer.Game, "pieceIDList", Session.pieceIDList);
    }

    /*********************************************
     *
     * METHODS
     *
     *********************************************/

    /**
     * Clear all variables
     */
    static clear(): void
    {
        // Cache clear
        Cache.clear(CacheLayer.Game);

        // Game variables reset
        Session.setMoveCount(0);
        Session.setPlayerColor(Color.White);
        Session.setCheckedColor(null);
        Session.bannedEnPassantPawns = {};
        Session.castlingStatus = {
            [CastlingType.WhiteLong]: true,
            [CastlingType.WhiteShort]: true,
            [CastlingType.BlackLong]: true,
            [CastlingType.BlackShort]: true,
            [CastlingType.Long]: true,
            [CastlingType.Short]: true,
        }
        Session.pieceIDList = [];
    }

}