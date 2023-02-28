class Piece extends Engine{
    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} target_square_id 
     */
    constructor(type, color, target_square_id) {
        super();
        this.id = this.createPieceID();
        this.type = type;
        this.color = color;

        // Set white and black king
        if(this.type == "king") // NOTE: Bunun varlığı düşünülecek check işlemlerinden sonra
            GameController.setKing(this);

        // Set Target Square Content to this piece
        GameController.changeSquare(target_square_id, this); 
    }

    /**
    * Get Playable Squares
    * @returns {Array<int>}
    */
    getPlayableSquaresOfPiece() {
        var playable_squares_id = [];
        switch (this.type) {
            case "rook":
                playable_squares_id = this.getPlayableSquaresOfRook(GameController.getSquareIDByPiece(this));
                break;
            case "bishop":
                playable_squares_id = this.getPlayableSquaresOfBishop(GameController.getSquareIDByPiece(this));
                break;
            case "pawn":
                playable_squares_id = this.getPlayableSquaresOfPawn(GameController.getSquareIDByPiece(this));
                break;
            case "king":
                playable_squares_id = this.getPlayableSquaresOfKing(GameController.getSquareIDByPiece(this));
                break;
            case "queen":
                playable_squares_id = this.getPlayableSquaresOfQueen(GameController.getSquareIDByPiece(this));
                break;
            case "knight":
                playable_squares_id = this.getPlayableSquaresOfKnight(GameController.getSquareIDByPiece(this));
                break;
            default:
                break;
        }
        return playable_squares_id;
    }
}