class Piece {
    #piece_engine = new PieceEngine();

    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} square 
     */
    constructor(type, color, square) {
        this.id = this.#piece_engine.createPieceID();
        this.type = type;
        this.color = color;

        // Set Target Square Content to this piece
        Global.setSquare(square, this);
    }

    /**
     * @public
     * Get Playable Squares
     * @returns {Array<int>}
     */
    getPlayableSquares() {
        return this.#piece_engine.getPlayableSquaresOfPiece(this.type, this.getSquareID());
    }

    
    /**
     * @public
     * Get Square ID of Piece
     * @returns {int} 
     */
    getSquareID() {
        for (let k in Global.getSquares()) {
            if (Global.getSquare(parseInt(k)) === this)
                return parseInt(k);
        }
    }
}