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
        let square_id = GameEngine.getSquareIDByPiece(this);

        // get all squares of row and column
        return this.getColumnSquaresOfSquare({ square_id: square_id }).concat(this.getRowSquaresOfSquare({ square_id: square_id }));
    }

    /**
     * @private
     * Get Playable Squares Of Bishop
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfBishop() {
        let square_id = GameEngine.getSquareIDByPiece(this);

        // get all squares of diagonal
        return this.getDiagonalSquaresOfSquare({ square_id: square_id });
    }

    /**
     * @private
     * Get Playable Squares Of Pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn() {
        let square_id = GameEngine.getSquareIDByPiece(this);
        let playable_squares_id = [];

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

        playable_squares_id = this.getColumnSquaresOfSquare({square_id:square_id, distance_limit:limit, route_path:route}); // get first [limit] square of [route] column
        let diagonal_control = this.getDiagonalSquaresOfSquare({square_id:square_id, distance_limit:1, route_path:route}) // get first diagonal squares

        // is first diagonal squares has enemy piece then add playable squares
        diagonal_control.filter(item => {
            if (GameEngine.isSquareHas(item) == "enemy")
                playable_squares_id.push(item);
        })

        return playable_squares_id;
    }

    /**
     * @private
     * Get Playable Squares Of King
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing() {
        let playable_squares;
        let unplayable_squares;
        let square_id = GameEngine.getSquareIDByPiece(this);

        playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id, distance_limit: 1 }).concat(this.getRowSquaresOfSquare({ square_id: square_id, distance_limit: 1 })).concat(this.getDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1 }));
        unplayable_squares = this.getUnplayableSquares(square_id);

        // Substract unplayable squares from playable squares(for itself)
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        // Substract unplayable squares from playable squares(for squares around)
        playable_squares = playable_squares.filter(square => !this.isSquareUnplayable(square));

        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen() {
        let unplayable_squares = [];
        let square_id = GameEngine.getSquareIDByPiece(this);
        let playable_squares = this.getColumnSquaresOfSquare({ square_id: square_id }).concat(this.getRowSquaresOfSquare({ square_id: square_id })).concat(this.getDiagonalSquaresOfSquare({ square_id: square_id }));

        playable_squares.forEach(square => {
            GameEngine.movePieceToSquare(square_id, square);
            if(isCheck()){
                unplayable_squares.push(square);        
            }
            GameEngine.movePieceToSquare(square, square_id);
        });

        // Substract unplayable squares from playable squares(for itself)
        playable_squares = playable_squares.filter(square => !unplayable_squares.includes(square));

        // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
        return playable_squares;
    }

    /**
     * @private
     * Get Playable Squares Of Knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight() {
        let square_id = GameEngine.getSquareIDByPiece(this);
        let playable_squares_id = [];

        // get 2 squares of column
        let column = this.getColumnSquaresOfSquare({square_id:square_id, distance_limit:2, piece_sensivity:true}).sort();
        // get 2 squares of row
        let row = this.getRowSquaresOfSquare({square_id:square_id, distance_limit:2, piece_sensivity:true}).sort();
        // get first square of left side and right side at end of the column 
        let column_sides = this.getRowSquaresOfSquare({square_id:column[0], distance_limit:1, piece_sensivity:true}).concat(this.getRowSquaresOfSquare({square_id:column[column.length - 1], distance_limit:1, piece_sensivity:true}));
        // get first square of top side and bottom side at end of the row
        let row_sides = this.getColumnSquaresOfSquare({square_id:row[0], distance_limit:1, piece_sensivity:true}).concat(this.getColumnSquaresOfSquare({square_id:row[row.length - 1], distance_limit:1, piece_sensivity:true}));
        // concat all playable squares
        playable_squares_id = column_sides.concat(row_sides);

        return playable_squares_id;
    }
}