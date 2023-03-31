class Piece {
    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} square 
     */
    constructor(type, color, square) {
        this.piece_engine = new PieceEngine();
        this.id = this.piece_engine.createPieceID();
        this.type = type;
        this.color = color;

        // Set white and black king
        if (this.type === "king")
            GameController.setKing(this);

        // Set Target Square Content to this piece
        GameController.changeSquare(square, this);
    }

    /**
     * @public
     * Get Playable Squares
     * @returns {Array<int>}
     */
    getPlayableSquaresOfPiece() {
        return this.piece_engine.getPlayableSquaresOfPiece(GameController.getSquareIDByPiece(this));
    }

}