class BoardManager {
    /**
     * @static
     * Get Pieces By Filter
     * @param {PieceType} type Type of pieces to get
     * @param {Color} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getPiecesWithFilter(type, color) {
        let pieces = [];
        let gl_squares = Global.getSquares();
        for (let square in gl_squares) {
            let piece = this.getPieceBySquareId(parseInt(square));
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
    static getPieceBySquareId(square_id) {
        let piece = Global.getSquare(square_id);
        return piece !== 0 ? piece : false;
    }

    /**
     * @static
     * Is Square Has Piece ?
     * @param {int} square_id Square ID of the target square
     * @param {Color} specific_color Specific Color(optional)
     * @param {Array<Type>} specific_pieces Specific piece types(optional)
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id, specific_color = null, specific_pieces = [PieceType.Queen, PieceType.King, PieceType.Pawn, PieceType.Bishop, PieceType.Rook, PieceType.Knight]) {
        let piece = BoardManager.getPieceBySquareId(square_id);
        if (piece)
            return !(specific_color && piece.color !== specific_color || !specific_pieces.includes(piece.type));
        return false;
    }
}
