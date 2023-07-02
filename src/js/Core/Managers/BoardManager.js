class BoardManager {
    /**
     * @static
     * Get Pieces By Filter
     * @param {PieceType|null} type Type of pieces to get
     * @param {Color|null} color Color of pieces to get
     * @returns {(Array<Piece>|null)}
     */
    static getPiecesWithFilter(type=null, color=null) {
        let pieces = [];
        let gl_squares = Global.getSquares();
        for (let square in gl_squares) {
            let piece = this.getPieceBySquareId(parseInt(square));
            if ((!color || piece.color === color) && (!type || piece.type === type))
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
     * @param {PieceType|Array<PieceType>} specific_pieces Specific piece types(optional)
     * @returns {boolean}
     */
    static isSquareHasPiece(square_id, specific_color = null, specific_pieces = [PieceType.Queen, PieceType.King, PieceType.Pawn, PieceType.Bishop, PieceType.Rook, PieceType.Knight]) {
        if(specific_pieces instanceof String)
            specific_pieces = [specific_pieces];

        let piece = BoardManager.getPieceBySquareId(square_id);
        if (piece)
            return !(specific_color && piece.color !== specific_color || !specific_pieces.includes(piece.type));
        
        return false;
    }

    /**
     * @static
     * Get All Playable Squares For A Color
     * @param {Color} color
     * @returns {Array<int>}
     */
    static getAllPlayableSquares(color) {

        // Get playable squares in cache
        let cached_playable_squares = Cache.get(CacheLayer.Game, "playable_squares");
        let playable_squares = [];

        // Get all pieces
        let pieces = BoardManager.getPiecesWithFilter(null, color);
        for (let piece of pieces) {
            if(cached_playable_squares && piece.id in cached_playable_squares) // If playable squares are in cache, get from cache
            {
                playable_squares = playable_squares.concat(cached_playable_squares[piece.id]);
            }
            else // Else calculate playable squares and add to cache
            {
                playable_squares = playable_squares.concat(piece.getPlayableSquares());
                Cache.add(CacheLayer.Game,"playable_squares", {[piece.id]:piece.getPlayableSquares()});
            }
        }

        return playable_squares;
    }
}
