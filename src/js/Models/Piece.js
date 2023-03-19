class Piece extends Engine {
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
        if (this.type === "king")
            GameController.setKing(this);

        // Set Target Square Content to this piece
        GameController.changeSquare(target_square_id, this);
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
                playable_squares_id = this.#getPlayableSquaresOfRook(GameController.getSquareIDByPiece(this));
                break;
            case "bishop":
                playable_squares_id = this.#getPlayableSquaresOfBishop(GameController.getSquareIDByPiece(this));
                break;
            case "pawn":
                playable_squares_id = this.#getPlayableSquaresOfPawn(GameController.getSquareIDByPiece(this));
                break;
            case "king":
                playable_squares_id = this.#getPlayableSquaresOfKing(GameController.getSquareIDByPiece(this));
                break;
            case "queen":
                playable_squares_id = this.#getPlayableSquaresOfQueen(GameController.getSquareIDByPiece(this));
                break;
            case "knight":
                playable_squares_id = this.#getPlayableSquaresOfKnight(GameController.getSquareIDByPiece(this));
                break;
            default:
                break;
        }
        return playable_squares_id;
    }

    /**
     * @private
     * Calculate Bishop Playable Squares/Path
     * @param {int} square_id Square ID of the bishop
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfBishop(square_id) {
        let squares = this.calcBishopPath(square_id);
        squares = this.#filterPlayableSquares(square_id, squares);

        return this.jsonPathToArrayPath(squares);
    }

    /**
     * @private
     * Calculate Rook Playable Squares/Path
     * @param {int} square_id Square ID of the rook
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfRook(square_id) {
        let squares = this.calcRookPath(square_id);
        squares = this.#filterPlayableSquares(square_id, squares);

        return this.jsonPathToArrayPath(squares);
    }

    /**
     * @private
     * Calculate Queen Playable Squares/Path
     * @param {int} square_id Square ID of the queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen(square_id) {
        return this.#filterPlayableSquaresNew(square_id, this.calcQueenPath(square_id));
    }

    /**
     * @private
     * Calculate King Playable Squares/Path
     * @param {int} square_id Square ID of the king
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing(square_id) {
        let playable_squares = [];
        let squares = this.jsonPathToArrayPath(this.calcKingPath(square_id));

        let king = GameController.getPlayerKing();

        const temp = square_id;
        squares.forEach(square => {
            // Check every playable squares is checked then add unchecked squares to playable squares list
            GameController.changeSquare(square, king);
            GameController.changeSquare(square_id, 0);
            if (!this.isCheck())
                playable_squares.push(square);
            GameController.changeSquare(square, 0);
        });
        GameController.changeSquare(temp, king); // set king to default position
        return playable_squares;
    }

    /**
     * @private
     * Calculate Pawn Playable Squares/Path
     * @param {int} square_id Square ID of the pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn(square_id) {
        let squares = this.calcPawnPath(square_id);
        squares = this.#filterPlayableSquares(square_id, squares);

        return this.jsonPathToArrayPath(squares);
    }

    /**
     * @private
     * Calculate Knight Playable Squares/Path
     * @param {int} square_id Square ID of the knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight(square_id) {
        let squares = this.calcKnightPath(square_id);
        squares = this.#filterPlayableSquares(square_id);

        return this.jsonPathToArrayPath(squares);
    }

    /**
     * @deprecated
     * @private
     * Get playable path to not to be check/avoid endangering the king
     * @param {int} square_id Square ID of current piece
     * @param {JSON} playable_squares Playable Squares of Target Piece
     * @example {"top":[4,6,7], "top-right":[3,2,1]}
     * @returns {JSON} {"top":[2,3,4], "bottom":[5,6,7]}
     */
    #filterPlayableSquares(square_id, playable_squares = null) {
        let playable_paths = [];
        let king_square_id = GameController.getPlayerKingSquareID();
        
        // If piece can guard king and can't kill enemy at the same time
        if(!playable_squares)
            playable_squares = this.calcQueenPath(square_id);
        
        for (let i in playable_squares) {
            let target_square_for_enemy_control = playable_squares[i].slice(-1)[0]; // Get last square of the path

            // Control, is last square has enemy
            let enemy_control = GameController.isSquareHasPiece(target_square_for_enemy_control, gl_current_move == "white" ? "black" : "white", this.type == "queen" ? ["queen", "bishop", "rook"] : [this.type]);
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

                    } else if (i == "top-right" || i == "bottom-left") {
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
                        if (i == "top" && target_square_for_king_control + 8 === king_square_id || i == "bottom" && target_square_for_king_control - 8 == king_square_id)
                            playable_paths = ["top", "bottom"];
                    }
                }
            }
        }

        // Delete unplayable paths in playable squares/paths to avoid endangering the king
        for (let i in playable_squares) {
            if (!playable_paths.includes(i))
                delete playable_squares[i];
        }

        return playable_squares;
    }


    /**
     * @private
     * Get playable path to not to be check/avoid endangering the king
     * @param {int} square_id Square ID of current piece
     * @param {JSON} playable_squares Playable Squares of Target Piece
     * @returns {Array<int>}
     */
    #filterPlayableSquaresNew(square_id, playable_squares = null){
        let king = GameController.getPlayerKingSquareID();
        
        // get diagonal, row and column with calcqueenpath method
        let routes = this.calcQueenPath(square_id);

        for(let i in routes){
            // check all squares on the route
            routes[i].forEach(item => {
                // if king in guardable area
                if(item - 9 == king || item - 7 == king || item + 1 == king || item - 1 == king || item + 9 == king || item + 7 == king || item - 8 == king || item + 8 == king){
                    console.log("King in guardable area: ", king);
                }
            })
        }

        return playable_squares;
    }

}