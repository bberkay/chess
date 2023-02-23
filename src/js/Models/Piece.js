class Piece extends Engine{
    /**
     * Create Piece Object
     * @param {string} type 
     * @param {string} color 
     * @param {int} target_square_id 
     */
    constructor(type, color, target_square_id) {
        this.id = BoardEngine.createPieceID();
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
                playable_squares_id = this.#getPlayableSquaresOfRook();
                break;
            case "bishop":
                playable_squares_id = this.#getPlayableSquaresOfBishop();
                break;
            case "pawn":
                playable_squares_id = this.#getPlayableSquaresOfPawn();
                break;
            case "king":
                playable_squares_id = this.#getPlayableSquaresOfKing();
                break;
            case "queen":
                playable_squares_id = this.#getPlayableSquaresOfQueen();
                break;
            case "knight":
                playable_squares_id = this.#getPlayableSquaresOfKnight();
                break;
            default:
                break;
        }
        return playable_squares_id;
    }

    /**
     * @private
     * Get Playable Squares Of Rook
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfRook() {
        return this.#filterPlayableSquares(
            this.calcRookPath(GameController.getSquareIDByPiece(this))
        );
    }

    /**
     * @private
     * Get Playable Squares Of Bishop
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfBishop() {
        return this.#filterPlayableSquares(
            this.calcBishopPath(GameController.getSquareIDByPiece(this))
        );
    }

    /**
     * @private
     * Get Playable Squares Of Pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn() {
        let playable_squares = this.#filterPlayableSquares(
            this.calcPawnPath(GameController.getSquareIDByPiece(this))
        );

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of King
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing() {
        let playable_squares = this.calcKingPath(GameController.getSquareIDByPiece(this));

        /*
        // Rok 
        if(gl_castling_control[this.color + "-short"] == null || gl_castling_control[this.color + "-long"] == null){
            console.log("rok");
        }*/

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen() {
        return this.#filterPlayableSquares(
            this.calcQueenPath(GameController.getSquareIDByPiece(this))
        );
    }

    /**
     * @private
     * Get Playable Squares Of Knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight() {
        return this.#filterPlayableSquares(
            this.calcKnightPath(GameController.getSquareIDByPiece(this))
        );
    }

    /**
     * Get playable path to not to be check/avoid endangering the king
     * @param {JSON} playable_squares Playable Squares of Target Piece
     * @example {"top":[4,6,7], "top-right":[3,2,1]} 
     * @returns {JSON} {"top":[2,3,4], "bottom":[5,6,7]}
     */
    #filterPlayableSquares(playable_squares) {
        let playable_paths = [];
        let king_square_id = GameController.getKingSquareID({ player: true }); 

        for (let i in playable_squares) {
            let target_square_for_enemy_control = playable_squares[i].slice(-1)[0]; // Get last square of the path
            
            // Control, is last square has enemy
            let enemy_control = GameController.isSquareHasEnemy(target_square_for_enemy_control, this.color, this.type == "queen" ? ["queen", "bishop", "rook"] : [this.type]);
            if (enemy_control) {
                let enemy = GameController.getPieceBySquareID(target_square_for_enemy_control);
                if (enemy.type == "bishop" || enemy.type == "queen") {
                    // If enemy type is bishop or queen then current piece just move ...
                    if (i == "top-left" || i == "bottom-right") {
                        // if enemy on top-left or bottom-right then current piece just move bottom-right and top-left squares
                        let target_square_for_king_control = playable_squares[i == "top-left" ? "bottom-right" : "top-left"].slice(-1)[0];

                        // Is current piece guard king
                        if (i == "top-left" && target_square_for_king_control + 9 == king_square_id || i == "bottom-right" && target_square_for_king_control - 9 == king_square_id)
                            playable_paths = ["bottom-right", "top-left"];
                    }
                    else if (i == "top-right" || i == "bottom-left") {
                        // if enemy on top-right or bottom-left then just move bottom-left and top-right squares
                        let target_square_for_king_control = playable_squares[i == "top-right" ? "bottom-left" : "top-right"].slice(-1)[0];

                        // Is current piece guard king
                        if (i == "top-right" && target_square_for_king_control + 7 == king_square_id || i == "bottom-left" && target_square_for_king_control - 7 == king_square_id)
                            playable_paths = ["top-right", "bottom-left"];
                    }
                }
                if (enemy.type == "rook" || enemy.type == "queen") {
                    // If enemy type is rook or queen then current piece just move ...
                    if (i == "top" || i == "bottom") {
                        // If enemy on top or bottom then current piece just move bottom and top squares
                        let target_square_for_king_control = playable_squares[i == "top" ? "bottom" : "top"].slice(-1)[0];

                        // Is current piece guard king
                        if (i == "top" && target_square_for_king_control + 8 == king_square_id || i == "bottom" && target_square_for_king_control - 8 == king_square_id)
                            playable_paths = ["top", "bottom"];
                    }
                }
            }
        }

        // Delete unplayable paths in playable squares/paths to avoid endangering the king
        for(let i in playable_squares){
            if(!playable_paths.includes(i))
                delete playable_squares[i];
        }

        return playable_squares;
    }
}