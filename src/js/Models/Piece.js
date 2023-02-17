class Piece extends PieceEngine {
    constructor(id, type, color) {
        super();
        this.id = id;
        this.type = type;
        this.color = color;
    }

    /**
    * Get Playable Squares
    * @returns {Array<int>}
    */
    getPlayableSquaresOfPiece(calculate_unplayable_squares = true) {
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
        let square_id = GameController.getSquareIDByPiece(this);

        // get all squares of row and column
        let playable_squares = {
            ...this.getColumnSquaresOfSquare({ square_id: square_id }),
            ...this.getRowSquaresOfSquare({ square_id: square_id }),
        }
        let playable_paths = this.#getPlayablePaths(playable_squares);

        // Substract unplayable paths from playable paths
        for (let i in playable_squares) {
            if (!playable_paths.includes(i))
                delete playable_squares[i];
        }

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Bishop
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfBishop() {
        let square_id = GameController.getSquareIDByPiece(this);

        // get diagonal squares
        let playable_squares = this.getDiagonalSquaresOfSquare({ square_id: square_id });
        if (calculate_unplayable_squares) {
            let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);
            // Substract unplayable squares from playable squares
            playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));
        }

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn(calculate_unplayable_squares) {
        let square_id = GameController.getSquareIDByPiece(this);

        let limit = 0;
        let route = "";
        let row_of_pawn = this.getRowOfSquare(square_id);

        if (gl_current_move == "black") {
            limit = row_of_pawn == 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = ["top"]; // black goes top
        }
        else if (gl_current_move == "white") {
            limit = row_of_pawn == 2 ? 2 : 1;
            route = ["bottom"]; // white goes bottom
        }

        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: limit, route_path: route })[route]; // get first [limit] square of [route] column
        let diagonal_control = this.getDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1, route_path: route })[route]; // get first diagonal squares

        // is first diagonal squares has enemy piece then add playable squares
        diagonal_control.filter(item => {
            if (GameController.isSquareHasEnemy(item))
                playable_squares.push(item);
        })

        if (calculate_unplayable_squares) {
            let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);
            // Substract unplayable squares from playable squares
            playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));
        }

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of King
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing(calculate_unplayable_squares) {
        let square_id = GameController.getSquareIDByPiece(this);

        // get first squares of column, row and diagonal
        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: 1 }).concat(this.getRowSquaresOfSquare({ square_id: square_id, distance_limit: 1 })).concat(this.getDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1 }));
        console.log(this.isSquareInDanger(square_id, gl_current_move));
        /*let unplayable_squares = this.isSquareInDanger(square_id, gl_current_move, true);
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));*/

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
        let square_id = GameController.getSquareIDByPiece(this);
        let playable_squares_list = [];

        let playable_paths = this.#getPlayablePaths({
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...this.getColumnSquaresOfSquare({ square_id: square_id }),
            ...this.getRowSquaresOfSquare({ square_id: square_id }),
            ...this.getDiagonalSquaresOfSquare({ square_id: square_id })
        });

        
        

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight(calculate_unplayable_squares) {
        let square_id = GameController.getSquareIDByPiece(this);

        // get 2 squares of column
        let column = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: 2, piece_sensivity: true }).sort();
        // get 2 squares of row
        let row = this.getRowSquaresOfSquare({ square_id: square_id, distance_limit: 2, piece_sensivity: true }).sort();
        // get first square of left side and right side at end of the column 
        let column_sides = this.getRowSquaresOfSquare({ square_id: column[0], distance_limit: 1, piece_sensivity: true }).concat(this.getRowSquaresOfSquare({ square_id: column[column.length - 1], distance_limit: 1, piece_sensivity: true }));
        // get first square of top side and bottom side at end of the row
        let row_sides = this.getColumnSquaresOfSquare({ square_id: row[0], distance_limit: 1, piece_sensivity: true }).concat(this.getColumnSquaresOfSquare({ square_id: row[row.length - 1], distance_limit: 1, piece_sensivity: true }));

        // concat all playable squares
        let playable_squares = column_sides.concat(row_sides);
        if (calculate_unplayable_squares) {
            let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);
            // Substract unplayable squares from playable squares
            playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));
        }

        return playable_squares;
    }

    /**
     * Get playable path to not to be check/avoid endangering the king
     * @param {JSON} playable_squares Playable Squares of Target Piece
     * @example {"top":[4,6,7], "top-right":[3,2,1]} 
     * @returns {JSON} {"top":[2,3,4], "bottom":[5,6,7]}
     */
    #getPlayablePaths(playable_squares) {
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