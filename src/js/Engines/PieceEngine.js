class PieceEngine{
    /**
     * Get Column of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    getColumnOfSquare(square_id) {
        return square_id % 8 == 0 ? 8 : square_id % 8;
    }

    /**
     * Get Row of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    getRowOfSquare(square_id) {
        return Math.ceil(square_id / 8);
    }

    /**
     * Get Column Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(string|null)} route_path Specific route path only "top" or "bottom" of square
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example {"top":[3,4,5]} If route path is not null
     * @returns {(Array<int>|JSON)}
     */
    getColumnSquaresOfSquare({ square_id, distance_limit = null, route_path = null, piece_sensivity = true }) {
        let playable_squares = {};
        let squares = [];
        const current_square_id = square_id;
        if (route_path == null || route_path.includes("top")) {
            let counter = 1;

            // Top of Column
            for (let i = square_id - 8; i > 0; i -= 8) {
                if (distance_limit && counter > distance_limit)
                    break;
                squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
                if (squares.includes("break")) {
                    squares.pop(); // delete "break" from squares
                    break;
                }
                counter += 1;
            }

            if(route_path != null){
                if(route_path.includes("top"))
                    playable_squares["top"] = squares;
            }
        }

        if (route_path == null || route_path.includes("bottom")) {
            let counter = 1;

            // Bottom of Column
            for (let i = square_id + 8; i < 65; i += 8) {
                if (distance_limit && counter > distance_limit)
                    break;
                squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
                if (squares.includes("break")) {
                    squares.pop();
                    break;
                }
                counter += 1;
            }

            if(route_path != null){
                if(route_path.includes("bottom"))
                    playable_squares["bottom"] = squares;
            }
        }

        return route_path ? playable_squares : squares;

    }

    /**
     * Get Row Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(Array<string>|null)} route_path Specific route path only "left" or "right"
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example {"right":[4,5,6]} If route path is not null
     * @returns {(Array<int>|JSON)}
     */
    getRowSquaresOfSquare({ square_id, distance_limit = null, route_path = null, piece_sensivity = true }) {
        let playable_squares = {};
        let squares = [];
        let row = this.getRowOfSquare(square_id);
        const current_square_id = square_id;

        if (route_path == null || route_path.includes("right")) {
            let counter = 1;

            // Right of Square
            for (let i = square_id + 1; i <= row * 8; i++) {
                if (distance_limit && counter > distance_limit)
                    break;
                squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
                if (squares.includes("break")) { // delete "break" from squares
                    squares.pop();
                    break;
                }
                counter += 1;
            }
            if(route_path != null){
                if(route_path.includes("right"))
                    playable_squares["right"] = squares;
            }
        }

        if (route_path == null || route_path.includes("left")) {
            let counter = 1;

            // Left of Square
            for (let i = square_id - 1; i >= (row * 8) - 7; i--) {
                if (distance_limit && counter > distance_limit)
                    break;
                squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
                if (squares.includes("break")) {
                    squares.pop();
                    break;
                }
                counter += 1;
            }
            if(route_path != null){
                if(route_path.includes("left"))
                    playable_squares["left"] = squares;
            }
        }

        return route_path ? playable_squares : squares;
    }

    /**
     * Get Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(Array<string>|null)} route_path Specific route path("bottom", "top", "bottom-right", "bottom-left", "top-left", "top-right")
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example {"top":[3,4,5], "top-left":[4,5,6]} If route path is not null
     * @returns {(Array<int>|JSON)}
     */
    getDiagonalSquaresOfSquare({ square_id, distance_limit = null, route_path = null, piece_sensivity = true }) {
        let playable_squares = {};
        let squares = [];
        let counter = 1;
        const current_square_id = square_id;
        
        // Top Left Diagonal of Piece
        if (route_path == null || route_path.includes("top") || route_path.includes("top-left")) {
            counter = 1;
            if (this.getColumnOfSquare(square_id) != 1) { // if piece not on the far left
                for (let i = square_id - 9; i > 0; i -= 9) {
                    if (distance_limit && counter > distance_limit)
                        break;

                    squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
                    if (squares.includes("break")) { // delete "break" from squares
                        squares.pop();
                        break;
                    }
                    counter += 1;
                }
            }
            if(route_path != null){
                if(route_path.includes("top"))
                    playable_squares["top"] = squares;
                else if(route_path.includes("top-left"))
                    playable_squares["top-left"] = squares;
            }
        }

        // Left Bottom Diagonal of Piece
        if (route_path == null || route_path.includes("bottom") || route_path.includes("bottom-left")) {
            counter = 1;
            if (this.getColumnOfSquare(square_id) != 1) {
                for (let i = square_id + 7; i < 65; i += 7) {
                    if (distance_limit && counter > distance_limit)
                        break;

                    squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
                    if (squares.includes("break")) {
                        squares.pop();
                        break;
                    }
                    counter += 1;
                }
            }
            if(route_path != null){
                if(route_path.includes("bottom"))
                    playable_squares["bottom"] = squares;
                else if(route_path.includes("bottom-left"))
                    playable_squares["bottom-left"] = squares;
            }
        }

        // Top Right Diagonal of Piece
        if (route_path == null || route_path.includes("top") || route_path.includes("top-right")) {
            counter = 1;
            if (this.getColumnOfSquare(square_id) != 8) { // if piece not on the far right
                for (let i = square_id - 7; i > 0; i -= 7) {
                    if (distance_limit && counter > distance_limit)
                        break;

                    squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
                    if (squares.includes("break")) {
                        squares.pop();
                        break;
                    }
                    counter += 1;
                }
            }
            if(route_path != null){
                if(route_path.includes("top"))
                    playable_squares["top"] = squares;
                else if(route_path.includes("top-right"))
                    playable_squares["top-right"] = squares;
            }
        }

        // Bottom Right Diagonal of Piece
        if (route_path == null || route_path.includes("bottom") || route_path.includes("bottom-right")) {
            counter = 1;
            if (this.getColumnOfSquare(square_id) != 8) {
                for (let i = square_id + 9; i < 65; i += 9) {
                    if (distance_limit && counter > distance_limit)
                        break;

                    squares = squares.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
                    if (squares.includes("break")) {
                        squares.pop();
                        break;
                    }
                    counter += 1;
                }
            }
            if(route_path != null){
                if(route_path.includes("bottom"))
                    playable_squares["bottom"] = squares;
                else if(route_path.includes("bottom-right"))
                    playable_squares["bottom-right"] = squares;
            }
        }

        return route_path ? playable_squares : squares;
    }

    /**
     * Get Playable Square on the path
     * @param {int} current_square_id Current Square 
     * @param {int} target_square_id Target Square(loop element, example 'i')
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @param {boolean} diagonal Is path diagonal
     * @returns {(Array<int>|JSON)}
     */
    #getPlayableSquares(current_square_id, target_square_id, piece_sensivity, diagonal = false) {
        let squares = [];

        // If target square and current square is same then not push square to squares 
        if (piece_sensivity) { // if piece sensivity is true then calculate every piece on the path
            // Control square 
            let square_type = GameController.isSquareHasPiece(target_square_id);
            if(square_type)
                square_type = GameController.isSquareHasEnemy(target_square_id, GameController.getPieceBySquareID(current_square_id).color) ? "enemy" : "friend";

            // Stop if any piece on the path and piece doesn't have to ability to jump(of course this control because of knight).    
            if (square_type == "friend") {
                squares.push("break");
                return squares;
            }
            else if (square_type == "enemy") {
                squares.push(target_square_id);
                squares.push("break");
                return squares;
            }
            else
                squares.push(target_square_id);
        }
        else // if piece sensivity is false add all squares to squares list
            squares.push(target_square_id);

        // if square reach the edges of the board
        if (diagonal) {
            if (this.getColumnOfSquare(target_square_id) == 8 || this.getColumnOfSquare(target_square_id) == 1)
                squares.push("break");
        }

        return squares;
    }

    /**
     * Check is square in danger by any enemy piece(for check operations)
     * @param {int} square_id Square ID of the target square
     * @param {string} enemy_color Enemy color to compare(optional)
     * @returns {boolean}
     */
    isSquareInDanger(square_id, enemy_color) {  
         // Bishop and Queen - Diagonal
        let diagonal = this.getDiagonalSquaresOfSquare({square_id:square_id, route_path:"left"});
        diagonal = GameController.isSquareHasEnemy(diagonal[diagonal.length - 1], enemy_color, ["queen", "bishop"]);

        if(diagonal)
            return true;

        // Rook and Queen - Row
        let row_right = this.getRowSquaresOfSquare({square_id:square_id, route_path:"right"}); 
        let row_left = this.getRowSquaresOfSquare({square_id:square_id, route_path:"left"});
        row_right = GameController.isSquareHasEnemy(row_right[row_right.length - 1], enemy_color, ["queen", "rook"]);
        row_left = GameController.isSquareHasEnemy(row_left[row_left.length - 1], enemy_color, ["queen", "rook"]);

        if(row_right || row_left)
            return true;

        // Rook and Queen - Column
        let column_top = this.getColumnSquaresOfSquare({square_id:square_id, route_path:"top"}); 
        let column_bottom = this.getColumnSquaresOfSquare({square_id:square_id, route_path:"bottom"}); 
        column_top = GameController.isSquareHasEnemy(column_top[column_top.length - 1], enemy_color, ["queen", "rook"]);
        column_bottom = GameController.isSquareHasEnemy(column_bottom[column_bottom.length - 1], enemy_color, ["queen", "rook"]);
        
        if(column_top || column_bottom)
            return true;

        // Enemy Pawn - Diagonal distance limit 1
        let enemy_pawn = this.getDiagonalSquaresOfSquare({square_id:square_id, distance_limit:1}); 
        enemy_pawn = GameController.isSquareHasEnemy(enemy_pawn[enemy_pawn.length - 1], enemy_color, ["pawn"]);

        if(enemy_pawn)
            return true;

        // TODO: Knight ve King de hesaplanacak.

        return false;

        /*
        // get all piece types(except pawn) for get all enemy on the board
        const piece_types = ["queen", "bishop", "rook", "knight", "king"];
        piece_types.forEach(type => {
            let enemy_pieces = GameController.getActivePiecesWithFilter(type, enemy_color);
            if (enemy_pieces) {
                enemy_pieces.forEach(enemy_piece => {
                    if(enemy_piece.getPlayableSquaresOfPiece(false).includes(square_id))
                        result = true;
                });
            }
        });
        
        if(result == true)
            return result;

        // get all enemy pawns
        const enemy_pawns = GameController.getActivePiecesWithFilter("pawn", enemy_color);
        if (enemy_pawns) {
            enemy_pawns.forEach(enemy_pawn => {
                let enemy_pawn_pos = GameController.getSquareIDByPiece(enemy_pawn);
                if (enemy_color == "white") {
                    // get white pawn killable squares(white pawn first diagonal squares + 7 and + 9)
                    if (square_id == enemy_pawn_pos + 7 || square_id == enemy_pawn_pos + 9)
                        result = true;
                } else {
                    // get black pawn killable squares(black pawn first diagonal squares - 7 and - 9)
                    if (square_id == enemy_pawn_pos - 7 || square_id == enemy_pawn_pos - 9)
                        result = true;
                }
            });
        }

        // Control every square in array with recursive
        return result;
        */
    }

}











