class Session{
    // FIXME: Cache.Set

    /**
     * This class stores the current status of the current game
     */

    /**
     * Board of the current game
     * @example {1: Piece, 2: null, 3: Piece, etc...}
     */
    private static _squares:Record<Square, Piece|null> = {};

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
     * Get ID list of pieces
     */
    static getIdList(): Array<number>
    {
        return this._idList;
    }

    /**
     * Get castling status
     */
    static getCastlingStatus(castlingType:CastlingType): boolean
    {
        return this._castlingStatus[castlingType];
    }

    /**
     * Get en passant status of piece
     */
    static getEnPassantStatus(pieceId: number): EnPassantDirection|true
    {
        return this._enPassantStatus[pieceId];
    }

    /**
     * Is en passant disabled?
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
    }

    /**
     * Set next move(change current player's color to enemy's color)
     */
    static setNextMove(): void
    {
        this._currentPlayer = this.getEnemyColor();
    }

    /**
     * Increase move count
     */
    static increaseMoveCount(): void
    {
        this._moveCount += 1;
    }

    /**
     * Set current player's color(generally used at start and reset operations)
     */
    static setCurrentPlayer(color: Color): void
    {
        this._currentPlayer = color;
    }

    /**
     * Set move count(generally used at start and reset operations)
     */
    static setMoveCount(count: number): void
    {
        this._moveCount = count;
    }

    /**
     * Add id to id list
     */
    static addIdList(id: number): void
    {
        this._idList.push(id);
    }

    /**
     * Change castling status
     */
    static changeCastlingStatus(castlingType: CastlingType, value: boolean): void
    {
        this._castlingStatus[castlingType] = value;
    }

    /**
     * Add piece(id) that can't en passant to en passant status list
     */
    static setDisabledEnPassant(pieceId: number, direction: EnPassantDirection|true): void
    {
        this._enPassantStatus[pieceId] = direction;
    }

    /**
     * Set Checked Player
     */
    static setCheckedPlayer(color: Color|null): void
    {
        this._checkedPlayer = color;
    }

    /**
     * Reset all variables
     */
    static reset(): void
    {
        this.setMoveCount(0);
        this.setCurrentPlayer(Color.White);
        this.setCheckedPlayer(null);
        this._enPassantStatus = {};
        this._castlingStatus = {
            [CastlingType.WhiteLong]: true,
            [CastlingType.WhiteShort]: true,
            [CastlingType.BlackLong]: true,
            [CastlingType.BlackShort]: true,
            [CastlingType.Long]: true,
            [CastlingType.Short]: true,
        }
    }

}