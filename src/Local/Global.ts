import { Cache } from "./Cache";
import "../Enums";

export class Global {
    /**
     * This class stores the current status of the current game
     */

    /**
     * Board of the current game
     */
    private static _squares:Record<Square, Piece|null> = {
        [Square.a1]: null, [Square.a2]: null, [Square.a3]: null, [Square.a4]: null, [Square.a5]: null, [Square.a6]: null, [Square.a7]: null, [Square.a8]: null,
        [Square.b1]: null, [Square.b2]: null, [Square.b3]: null, [Square.b4]: null, [Square.b5]: null, [Square.b6]: null, [Square.b7]: null, [Square.b8]: null,
        [Square.c1]: null, [Square.c2]: null, [Square.c3]: null, [Square.c4]: null, [Square.c5]: null, [Square.c6]: null, [Square.c7]: null, [Square.c8]: null,
        [Square.d1]: null, [Square.d2]: null, [Square.d3]: null, [Square.d4]: null, [Square.d5]: null, [Square.d6]: null, [Square.d7]: null, [Square.d8]: null,
        [Square.e1]: null, [Square.e2]: null, [Square.e3]: null, [Square.e4]: null, [Square.e5]: null, [Square.e6]: null, [Square.e7]: null, [Square.e8]: null,
        [Square.f1]: null, [Square.f2]: null, [Square.f3]: null, [Square.f4]: null, [Square.f5]: null, [Square.f6]: null, [Square.f7]: null, [Square.f8]: null,
        [Square.g1]: null, [Square.g2]: null, [Square.g3]: null, [Square.g4]: null, [Square.g5]: null, [Square.g6]: null, [Square.g7]: null, [Square.g8]: null,
        [Square.h1]: null, [Square.h2]: null, [Square.h3]: null, [Square.h4]: null, [Square.h5]: null, [Square.h6]: null, [Square.h7]: null, [Square.h8]: null,
    };

    /**
     * General information about the current game
     */
    private static _currentPlayer:Color = Color.White;
    private static _checkedPlayer:Color|null = null;
    private static _moveCount:number = 0;
    private static _idList:Array<number> = [];

    /**
     * Castling moves status of the current game
     */
    private static _castlingStatus:{
        [CastlingType.WhiteLong]: boolean;
        [CastlingType.BlackLong]: boolean;
        [CastlingType.WhiteShort]: boolean;
        [CastlingType.BlackShort]: boolean;
        [CastlingType.Long]: boolean;
        [CastlingType.Short]: boolean;
    } = {
        [CastlingType.WhiteLong]: true,
        [CastlingType.WhiteShort]: true,
        [CastlingType.BlackLong]: true,
        [CastlingType.BlackShort]: true,
        [CastlingType.Long]: true,
        [CastlingType.Short]: true,
    }

    /**
     * // FIXME: GameManager.canPawnDoEnPassant can be change
     * Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimize, see GameManager.canPawnDoEnPassant)
     * @example {pieceId: EnPassantDirection}
     */
    private static _enPassantStatus:Record<number, EnPassantDirection|true> = {}

    /**
     * Get current board
     */
    static getSquares(): Record<Square, Piece|null>
    {
        return this._squares;
    }

    /**
     * Get current square
     */
    static getSquare(squareId:Square): Piece|null
    {
        return this._squares[squareId];
    }

    /**
     * Get current player
     */
    static getCurrentPlayer(): Color
    {
        return this._currentPlayer;
    }

    /**
     * Get enemy color
     */
    static getEnemyColor(): Color
    {
        return this._currentPlayer === Color.White ? Color.Black : Color.White;
    }


    /**
     * Get checked player
     */
    static getCheckedPlayer(): Color|null
    {
        return this._checkedPlayer;
    }

    /**
     * Get move count
     */
    static getMoveCount(): number
    {
        return this._moveCount;
    }

    /**
     * // FIXME. Bundan kurtulunmaya çalışılacak
     * Get ID list of pieces
     */
    static getIdList(): Array<number>
    {
        return this._idList;
    }

    /**
     * Get castling status
     * @example Global.getCastlingStatus(CastlingType.WhiteLong)
     */
    static getCastlingStatus(castlingType:CastlingType): boolean
    {
        return this._castlingStatus[castlingType];
    }

    /**
     * Get en passant status of piece
     * @example Global.getEnPassantStatus(pieceId)
     */
    static getEnPassantStatus(pieceId: number): EnPassantDirection|true
    {
        return this._enPassantStatus[pieceId];
    }

    /**
     * Is en passant disabled?
     * @example Global.isEnPassantDisabled(pieceId, EnPassantDirection.Left) // if result is truer than that means piece(id) can't en passant to left
     */
    static isEnPassantDisabled(pieceId: number, direction: EnPassantDirection|true): EnPassantDirection|boolean
    {
        const enPassantStatus = this.getEnPassantStatus(pieceId);
        return enPassantStatus || enPassantStatus === direction;
    }

    /**
     * Add piece to square or do empty
     */
    static setSquare(squareId: Square, content: Piece|null): void
    {
        this._squares[squareId] = content;

        // Add to cache
        Cache.set(CacheLayer.Game, "squares", this._squares);
    }

    /**
     * Set next move(change current player's color to enemy's color)
     */
    static setNextMove(): void
    {
        this._currentPlayer = this.getEnemyColor();

        // Add to cache
        Cache.set(CacheLayer.Game, "currentPlayer", this._currentPlayer);
    }

    /**
     * Increase move count
     */
    static increaseMoveCount(): void
    {
        this._moveCount += 1;

        // Add to cache
        Cache.set(CacheLayer.Game, "moveCount", this._moveCount);
    }

    /**
     * Set current player's color(generally used at start and reset operations)
     */
    static setCurrentPlayer(color: Color): void
    {
        this._currentPlayer = color;

        // Add to cache
        Cache.set(CacheLayer.Game, "currentPlayer", this._currentPlayer);
    }

    /**
     * Set move count(generally used at start and reset operations)
     */
    static setMoveCount(count: number): void
    {
        this._moveCount = count;

        // Add to cache
        Cache.set(CacheLayer.Game, "moveCount", this._moveCount);
    }

    /**
     * Add id to id list
     */
    static addIdList(id: number): void
    {
        this._idList.push(id);

        // Add to cache
        Cache.set(CacheLayer.Game, "idList", this._idList);
    }}

    /**
     * Change castling status
     * @example Global.changeCastlingStatus(CastlingType.WhiteLong, false) // That means white long castling is disabled
     */
    static changeCastlingStatus(castlingType: CastlingType, value: boolean): void
    {
        this._castlingStatus[castlingType] = value;

        // Add to cache
        Cache.set(CacheLayer.Game, "castlingStatus", this._castlingStatus);
    }

    /**
     * Add piece(id) that can't en passant to en passant status list
     * @example Global.setDisabledEnPassant(pieceId, EnPassantDirection.Left) // That means piece(id) can't en passant to left
     */
    static setDisabledEnPassant(pieceId: number, direction: EnPassantDirection|true): void
    {
        this._enPassantStatus[pieceId] = direction;

        // Add to cache
        Cache.set(CacheLayer.Game, "enPassantStatus", this._enPassantStatus);
    }

    /**
     * Set Checked Player
     */
    static setCheckedPlayer(color: Color|null): void
    {
        this._checkedPlayer = color;

        // Add to cache
        Cache.set(CacheLayer.Game, "checkedPlayer", this._checkedPlayer);
    }

    /**
     * Reset all variables
     */
    static reset(): void
    {
        this.setMoveCount(0);
        this.setCurrentPlayer(Color.White);
        this.setCheckedPlayer(null);

        // En passant and castling status reset
        this._enPassantStatus = {};

        // Add to cache
        Cache.set(CacheLayer.Game, "enPassantStatus", this._enPassantStatus);

        this._castlingStatus = {
            [CastlingType.WhiteLong]: true,
            [CastlingType.WhiteShort]: true,
            [CastlingType.BlackLong]: true,
            [CastlingType.BlackShort]: true,
            [CastlingType.Long]: true,
            [CastlingType.Short]: true,
        }

        // Add to cache
        Cache.set(CacheLayer.Game, "castlingStatus", this._castlingStatus);
    }

}