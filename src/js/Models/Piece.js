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

        // Set white and black king
        if (this.type === "king")
            BoardManager.setKing(this);

        // Set Target Square Content to this piece
        BoardManager.changeSquare(square, this);
    }

    /**
     * @public
     * Get Playable Squares
     * @returns {Array<int>}
     */
    getPlayableSquaresOfPiece() {
        return this.#piece_engine.getPlayableSquaresOfPiece(this.type, BoardManager.getSquareIDByPiece(this));
    }

}