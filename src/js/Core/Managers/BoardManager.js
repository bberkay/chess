class BoardManager {
    /**
     * @static
     * Set Square
     * @param {int} square_id 
     * @param {(Piece|int)} square_content 
     */
    static setSquare(square_id, square_content){
        Global.setSquare(square_id, square_content);
    }

    /**
     * @static
     * Get Active Pieces On The Board With Filter Like Enemy Queen, Enemy Bishops ... etc.
     * @param {Piece} type Type of pieces to get
     * @param {Color} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getActivePiecesWithFilter(type, color) {
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
    static getPieceBySquareID(square_id) {
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
    static isSquareHasPiece(square_id, specific_color = null, specific_pieces = [Type.Queen, Type.King, Type.Pawn, Type.Bishop, Type.Rook, Type.Knight]) {
        let piece = this.getPieceBySquareID(square_id);
        if (piece)
            return !(specific_color && piece.color !== specific_color || !specific_pieces.includes(piece.type));
        return false;
    }

    /**
     * @static
     * Get Player's King
     * @returns {Piece}
     */
    static getPlayerKing() {
        return Global.getCurrentMove() === Color.White ? Global.getWhiteKing() : Global.getBlackKing();
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
        return Global.getCurrentMove() === Color.Black ? Global.getBlackKing() : Global.getWhiteKing();
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
        return Global.getCurrentMove() === Color.White ? Color.Black : Color.White;
    }
}
