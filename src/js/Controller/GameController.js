class GameController {
    /**
     * Change Square Content to Piece[object] or 0[int]
     * @param {int} key
     * @param {(Piece|int)} value
     * @returns {void}
     */
    static changeSquareTo(key, value) {
        if (Object.is(key, int) && key < 65 && Object.is(value, Piece) || Object.is(value, int) && value === 0)
            gl_squares[key] = value;
    }


    /**
     * Get Active Pieces On The Board With Filter Like Enemy Queen, Enemy Bishops ... etc.
     * @param {string} type Type of pieces to get
     * @param {string} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getActivePiecesWithFilter(type, color) {
        let pieces = [];
        for (let square in gl_squares) {
            let piece = this.getPieceBySquareID(parseInt(square));
            if (piece.color == color && piece.type == type)
                pieces.push(piece);
        }

        return pieces.length > 0 ? pieces : null;
    }


    /**
     * Get Piece By Square ID
     * @param {int} square_id 
     * @returns {(Piece|boolean)} 
     */
    static getPieceBySquareID(square_id) {
        return gl_squares[square_id] != 0 ? gl_squares[square_id] : false;
    }


    /**
     * Get Square ID By Piece
     * @param {Piece} piece 
     * @returns {(int|boolean)} 
     */
    static getSquareIDByPiece(piece) {
        for (let k in gl_squares) {
            if (gl_squares[k] == piece)
                return parseInt(k);
        }
        return false;
    }

    /**
     * Is Square Has Piece ?
     * @param {int} square_id Square ID of the target square
     * @param {string} specific_color Color to compare(optional, default is player's color)
     * @param {Array<string>} specific_pieces Specific piece types(optional, default is all pieces type)
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id, specific_color = gl_current_move, specific_pieces = ["queen", "king", "pawn", "bishop", "rook", "knight"]) {
        let piece = this.getPieceBySquareID(square_id);
        if (piece) {
            if (piece.color != specific_color)
                return false;

            if (!specific_pieces.includes(piece.type))
                return false;

            return true;
        }
        return false;
    }

    /**
    * Set Player or Enemy King
    * @param {Piece} piece
    * @returns {void}
    */
    static setKing(piece) {
        if (piece.type == "king") {
            if (piece.color == "white")
                gl_white_king = king;
            else if (piece.color == "black")
                gl_black_king = king;
        }
    }

    /**
     * Get Player or Enemy King
     * @param {boolean} Player 
     * @param {boolean} Enemy 
     * @returns {Piece}
     */
    static getKing({ player = false, enemy = false }) {
        if (player && !enemy)
            return gl_current_move == "white" ? gl_white_king : gl_black_king;
        else if (!player && enemy)
            return gl_current_move == "white" ? gl_black_king : gl_white_king;
    }

    /**
     * Get Square ID of Player or Enemy King 
     * @param {boolean} Player 
     * @param {boolean} Enemy 
     * @returns {int}
     */
    static getKingSquareID({ player = false, enemy = false }) {
        return this.getSquareIDByPiece(this.getKing({ player: player, enemy: enemy }));
    }
}
