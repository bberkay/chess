import { CacheManager } from "./CacheManager.ts";
import { Color, CastlingType, EnPassant, EnPassantDirection, Castling, CacheLayer } from "../Types.ts";

export class StateManager{
    /**
     * This class provides the state management of the game.
     */

    /**
     * @description General information about the game.
     */
    private static currentColor: Color = Color.White;
    private static checkedColor: Color | null = null;
    private static moveCount: number = 0;

    /**
     * @description Color Long mean Color player's queen side, Color Short mean Color player's king side.
     * @see src/Engine/Checker/StateChecker.ts
     */
    private static castlingStatus: Castling = {
        [CastlingType.WhiteLong]: true,
        [CastlingType.WhiteShort]: true,
        [CastlingType.BlackLong]: true,
        [CastlingType.BlackShort]: true,
        [CastlingType.Long]: true,
        [CastlingType.Short]: true,
    }

    /**
     * @description Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimized).
     * @see src/Engine/Checker/StateChecker.ts
     */
    private static bannedEnPassantPawns: EnPassant = {};

    /**
     * @description Get current player
     */
    public static getPlayerColor(): Color
    {
        return StateManager.currentColor;
    }

    /**
     * @description Get enemy color
     */
    public static getEnemyColor(): Color
    {
        return StateManager.currentColor === Color.White ? Color.Black : Color.White;
    }

    /**
     * @description Get checked player
     */
    public static getCheckedColor(): Color|null
    {
        return StateManager.checkedColor;
    }

    /**
     * @description Get move count
     */
    public static getMoveCount(): number
    {
        return StateManager.moveCount;
    }

    /**
     * @description Get castling status
     * @example StateManager.getCastlingStatus(CastlingType.WhiteLong)
     */
    static getCastlingStatus(castlingType: CastlingType): boolean
    {
        return StateManager.castlingStatus[castlingType];
    }

    /**
     * @description Get en passant status of pawn
     * @example StateManager.getEnPassantStatus(1000) // Returns EnPassantDirection.Left and/or EnPassantDirection.Right and/or EnPassantDirection.Both
     */
    static getEnPassantStatus(pieceID: number): EnPassantDirection
    {
        return StateManager.bannedEnPassantPawns[pieceID];
    }

    /**
     * @description Set next move(change current player's color to enemy's color)
     */
    public static setNextMove(): void
    {
        StateManager.currentColor = StateManager.getEnemyColor();

        // Add to cache
        CacheManager.set(CacheLayer.Game, "currentColor", StateManager.currentColor);
    }

    /**
     * @description Increase move count
     */
    public static increaseMoveCount(): void
    {
        StateManager.moveCount += 1;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "moveCount", StateManager.moveCount);
    }

    /**
     * @description Set current player's color(generally used at start and reset operations)
     */
    public static setPlayerColor(color: Color): void
    {
        StateManager.currentColor = color;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "currentColor", StateManager.currentColor);
    }

    /**
     * @description Set move count(generally used at start and reset operations)
     */
    public static setMoveCount(count: number): void
    {
        if(count < 0)
            throw new Error("Move count can't be negative");

        StateManager.moveCount = count;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "moveCount", StateManager.moveCount);
    }

    /**
     * @description Set Checked Color
     */
    public static setCheckedColor(color: Color|null): void
    {
        StateManager.checkedColor = color;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "checkedColor", StateManager.checkedColor);
    }

    /**
     * @description Change castling status
     * @example StateManager.setCastlingStatus(CastlingType.WhiteLong, false), That means white long castling is disabled
     */
    static changeCastlingStatus(castlingType: CastlingType, value: boolean): void
    {
        StateManager.castlingStatus[castlingType] = value;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "castlingStatus", StateManager.castlingStatus);
    }

    /**
     * @description Set castling status
     */
    static setCastlingStatus(castlingStatus: Castling | null): void
    {
        StateManager.castlingStatus = castlingStatus ? castlingStatus : {
            [CastlingType.WhiteLong]: true,
            [CastlingType.WhiteShort]: true,
            [CastlingType.BlackLong]: true,
            [CastlingType.BlackShort]: true,
            [CastlingType.Long]: true,
            [CastlingType.Short]: true,
        };

        // Add to cache
        CacheManager.set(CacheLayer.Game, "castlingStatus", StateManager.castlingStatus);
    }

    /**
     * @description Add piece(id) that can't en passant to en passant status list
     * @example StateManager.addBannedEnPassantPawn(pieceId, EnPassantDirection.Left), That means piece(id) can't en passant to left.
     */
    static addBannedEnPassantPawn(pieceID: number, direction: EnPassantDirection): void
    {
        StateManager.bannedEnPassantPawns[pieceID] = direction;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "bannedEnPassantPawns", StateManager.bannedEnPassantPawns);
    }

    /**
     * @description Set en passant status of pawn list
     */
    static setBannedEnPassantPawns(enPassantPawns: {[pieceID: number]: EnPassantDirection} | null): void
    {
        StateManager.bannedEnPassantPawns = !enPassantPawns ? {} : enPassantPawns;

        // Add to cache
        CacheManager.set(CacheLayer.Game, "bannedEnPassantPawns", StateManager.bannedEnPassantPawns);
    }

    /**
     * @description Reset state manager to default
     */
    public static clear(): void
    {
        StateManager.setPlayerColor(Color.White);
        StateManager.setCheckedColor(null);
        StateManager.setMoveCount(0);
        StateManager.setCastlingStatus(null);
        StateManager.setBannedEnPassantPawns(null);
    }
}