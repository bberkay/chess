class BoardManager {
    /**
     * @static
     * Get Pieces By Filter
     * @param {Type} type Type of pieces to get
     * @param {Color} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getPiecesWithFilter(type, color) {
        let pieces = [];
        let gl_squares = Global.getSquares();
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
    static getPieceBySquareId(square_id) {
        let piece = Global.getSquare(square_id);
        return piece !== 0 ? piece : false;
    }

    /**
     * @static
     * Get Piece By Filter
     * @param {Type} type 
     * @param {Color} color 
     * @returns {(Piece|nulll)}
     */
    static getPieceByFilter(type, color){
        let pieces = this.getPiecesWithFilter(type, color);
        return pieces ? pieces[0] : null;
    }

    /**
     * @static
     * Is Square Has Piece ?
     * @param {int} square_id Square ID of the target square
     * @param {Color} specific_color Specific Color(optional)
     * @param {Array<Type>} specific_pieces Specific piece types(optional)
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id, specific_color = null, specific_pieces = [Type.Queen, Type.King, Type.Pawn, Type.Bishop, Type.Rook, Type.Knight]) {
        let piece = BoardManager.getPieceBySquareId(square_id);
        if (piece)
            return !(specific_color && piece.color !== specific_color || !specific_pieces.includes(piece.type));
        return false;
    }
}
