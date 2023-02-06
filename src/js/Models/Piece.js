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
        let square_id = GameController.getSquareIDByPiece(this);

        // get all squares of row and column
        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id }).concat(this.getRowSquaresOfSquare({ square_id: square_id }));
        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);

        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

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
        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);

        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn() {
        let square_id = GameController.getSquareIDByPiece(this);

        let limit = 0;
        let route = "";
        let row_of_pawn = this.getRowOfSquare(square_id);

        if (gl_current_move == "black") {
            limit = row_of_pawn == 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = "top"; // black goes top
        }
        else if (gl_current_move == "white") {
            limit = row_of_pawn == 2 ? 2 : 1;
            route = "bottom"; // white goes bottom
        }

        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: limit, route_path: route }); // get first [limit] square of [route] column
        let diagonal_control = this.getDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1, route_path: route }) // get first diagonal squares

        // is first diagonal squares has enemy piece then add playable squares
        diagonal_control.filter(item => {
            if (GameController.isSquareHasEnemy(item))
                playable_squares.push(item);
        })

        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);
        
        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of King
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing() {
        let square_id = GameController.getSquareIDByPiece(this);

        // get first squares of column, row and diagonal
        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: 1 }).concat(this.getRowSquaresOfSquare({ square_id: square_id, distance_limit: 1 })).concat(this.getDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1 }));
        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);
        
        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen() {
        let square_id = GameController.getSquareIDByPiece(this);

        // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id }).concat(this.getRowSquaresOfSquare({ square_id: square_id })).concat(this.getDiagonalSquaresOfSquare({ square_id: square_id }));
        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);

        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight() {
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
        let unplayable_squares = this.#getUnplayableSquaresOfPiece(square_id, playable_squares);

        // Substract unplayable squares from playable squares
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        return playable_squares;
    }

    /**
     * Get Unplayable Squares Of Piece
     * @param {int} square_id Square ID of the Target Piece
     * @param {Array<int>} playable_squares Playable Squares of Target Piece
     * @returns {Array<int>}
     */
    #getUnplayableSquaresOfPiece(square_id, playable_squares) {
        // Get dangerous squares
        const enemy_color = gl_current_move == "white" ? "black" : "white";
        let unplayable_squares = [];
        if(this.type == "king"){
            // Delete piece itself from board for to get the back of the piece
            const real_position = gl_squares[square_id];
            GameController.setGlobalSquare(square_id, 0);

            playable_squares.forEach(square => {
                if (this.isSquareInDanger(square, enemy_color)) 
                    unplayable_squares.push(square);
            });

             // Add piece again 
            GameController.setGlobalSquare(square_id, real_position);
        }
        else{ 
            /*
             If type is not king then find king and check is king in danger
            */
            let players_king = GameController.getKingSquareID({player:true});
            playable_squares.forEach(square => {
                // Delete piece itself from board for to get the back of the piece
                const real_position = gl_squares[square_id];
                const target_square = gl_squares[square];
                GameController.setGlobalSquare(square, square_id);
                GameController.setGlobalSquare(square_id, 0);

                if(this.isSquareInDanger(players_king, enemy_color))
                    unplayable_squares.push(square);

                // Add pieces to their original squares again 
                GameController.setGlobalSquare(square_id, real_position);
                GameController.setGlobalSquare(square, target_square);
            });
        }
       
        return unplayable_squares;
    }
}