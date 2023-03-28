class GameController {
    /**
     * @static
     * Change Square Content to Piece[object] or 0[int]
     * @param {int} key
     * @param {(Piece|int)} value
     * @returns {void}
     */
    static changeSquare(key, value) {
        gl_squares[key] = value;
    }


    /**
     * @static
     * Get Active Pieces On The Board With Filter Like Enemy Queen, Enemy Bishops ... etc.
     * @param {string} type Type of pieces to get
     * @param {string} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getActivePiecesWithFilter(type, color) {
        let pieces = [];
        for (let square in gl_squares) {
            let piece = this.getPieceBySquareID(parseInt(square));
            if (piece.color === color && piece.type === type)
                pieces.push(piece);
        }

        return pieces.length > 0 ? pieces : null;
    }


    /**
     * @static
     * Get Piece By Square ID
     * @param {int} square_id 
     * @returns {(Piece|boolean)} 
     */
    static getPieceBySquareID(square_id) {
        return gl_squares[square_id] !== 0 ? gl_squares[square_id] : false;
    }


    /**
     * @static
     * Get Square ID By Piece
     * @param {Piece} piece 
     * @returns {(int|boolean)} 
     */
    static getSquareIDByPiece(piece) {
        for (let k in gl_squares) {
            if (gl_squares[k] === piece)
                return parseInt(k);
        }
        return false;
    }

    /**
     * @static
     * Is Square Has Piece ?
     * @param {int} square_id Square ID of the target square
     * @param {string|null} specific_color Specific Color(optional)
     * @param {Array<string>} specific_pieces Specific piece types(optional)
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id, specific_color = null, specific_pieces = ["queen", "king", "pawn", "bishop", "rook", "knight"]) {
        let piece = this.getPieceBySquareID(square_id);
        if (piece)
            return !(specific_color && piece.color !== specific_color || !specific_pieces.includes(piece.type));
        return false;
    }

    /**
     * @static
     * Set Player or Enemy King
     * @param {Piece} piece
     * @returns {void}
     */
    static setKing(piece) {
        if (piece.type === "king") {
            if (piece.color === "white")
                gl_white_king = piece;
            else if (piece.color === "black")
                gl_black_king = piece;
        }
    }

    /**
     * @static
     * Get Player's King
     * @returns {Piece}
     */
    static getPlayerKing() {
        return gl_current_move === "white" ? gl_white_king : gl_black_king;
    }

    /**
     * @static
     * Get Square ID of Player's King
     * @returns {int}
     */
    static getPlayerKingSquareID() {
        return this.getSquareIDByPiece(this.getPlayerKing());
    }

    /**
     * @static
     * Get Enemy's King
     * @returns {Piece}
     */
    static getEnemyKing() {
        return gl_current_move === "white" ? gl_black_king : gl_white_king;
    }

    /**
     * @static
     * Get Square ID of Enemy's King
     * @returns {int}
     */
    static getEnemyKingSquareID() {
        return this.getSquareIDByPiece(this.getEnemyKing());
    }

    /**
     * @static
     * Get Enemy Color
     * @returns {string}
     */
    static getEnemyColor(){
        return gl_current_move === "white" ? "black" : "white";
    }
}
