class Piece {
    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} square 
     */
    constructor(type, color, square) {
        this.id = this.createPieceID();
        this.type = type;
        this.color = color;
        this.piece_engine = new PieceEngine();

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
        let playable_squares_id = [];
        switch (this.type) {
            case "rook":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfRook(GameController.getSquareIDByPiece(this));
                break;
            case "bishop":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfBishop(GameController.getSquareIDByPiece(this));
                break;
            case "pawn":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfPawn(GameController.getSquareIDByPiece(this));
                break;
            case "king":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfKing(GameController.getSquareIDByPiece(this));
                break;
            case "queen":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfQueen(GameController.getSquareIDByPiece(this));
                break;
            case "knight":
                playable_squares_id = this.piece_engine.getPlayableSquaresOfKnight(GameController.getSquareIDByPiece(this));
                break;
            default:
                break;
        }
        return playable_squares_id;
    }

}