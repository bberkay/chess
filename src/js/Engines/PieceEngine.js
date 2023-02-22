class PieceEngine {
    /**
     * Calculate Column of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    #calcColumnOfSquare(square_id) {
        return square_id % 8 == 0 ? 8 : square_id % 8;
    }

    /**
     * Calculate Row of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    #calcRowOfSquare(square_id) {
        return Math.ceil(square_id / 8);
    }

    /**
     * Calculate Column Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"top":[5,13,21], "bottom":[37,45,53,61]} 
     * @returns {JSON}
     */
    #calcColumnSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
        let playable_squares = {};
        const current_square_id = square_id;
        let counter, path;

        // Top of Column
        counter = 1;
        path = [];

        for (let i = square_id - 8; i > 0; i -= 8) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity));
            if (path.includes("break")) {
                path.pop(); // delete "break" from path
                break;
            }
            counter += 1;
        }
        playable_squares["top"] = path;

        // Bottom of Column
        counter = 1;
        path = [];

        for (let i = square_id + 8; i < 65; i += 8) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity));
            if (path.includes("break")) {
                path.pop();
                break;
            }
            counter += 1;
        }
        playable_squares["bottom"] = path;


        return playable_squares;

    }

    /**
     * Calculate Row Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"left":[25, 26, 27, 28], "right":[30, 31, 32]} 
     * @returns {JSON}
     */
    #calcRowSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
        let playable_squares = {};
        let row = this.getRowOfSquare(square_id);
        const current_square_id = square_id;
        let path, counter;

        // Right of Square
        counter = 1;
        path = [];

        for (let i = square_id + 1; i <= row * 8; i++) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity));
            if (path.includes("break")) { // delete "break" from path
                path.pop();
                break;
            }
            counter += 1;
        }
        playable_squares["right"] = path;

        // Left of Square
        counter = 1;
        path = [];

        for (let i = square_id - 1; i >= (row * 8) - 7; i--) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity));
            if (path.includes("break")) {
                path.pop();
                break;
            }
            counter += 1;
        }
        playable_squares["left"] = path;

        return playable_squares;
    }

    /**
     * Calculate Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example If square id is 29 then result will be {"top-left": [2, 11, 20], "bottom-right":[38, 47, 56], "top-right": [8, 15, 22], "bottom-left":[36, 43, 50, 57]} 
     * @returns {JSON}
     */
    #calcDiagonalSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
        let playable_squares = {};
        const current_square_id = square_id;
        let path, counter;

        // Top Left Diagonal of Piece
        path = [];
        counter = 1;

        if (this.getColumnOfSquare(square_id) != 1) { // if piece not on the far left
            for (let i = square_id - 9; i > 0; i -= 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity, true));
                if (path.includes("break")) { // delete "break" from path
                    path.pop();
                    break;
                }
                counter += 1;
            }
        }
        playable_squares["top-left"] = path;

        // Left Bottom Diagonal of Piece
        path = [];
        counter = 1;

        if (this.getColumnOfSquare(square_id) != 1) {
            for (let i = square_id + 7; i < 65; i += 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity, true));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }
                counter += 1;
            }
        }
        playable_squares["bottom-left"] = path;

        // Top Right Diagonal of Piece
        path = [];
        counter = 1;

        if (this.getColumnOfSquare(square_id) != 8) { // if piece not on the far right
            for (let i = square_id - 7; i > 0; i -= 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity, true));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }
                counter += 1;
            }
        }
        playable_squares["top-right"] = path;

        // Bottom Right Diagonal of Piece
        path = [];
        counter = 1;
        if (this.getColumnOfSquare(square_id) != 8) {
            for (let i = square_id + 9; i < 65; i += 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcCurrentSquare(current_square_id, i, piece_sensivity, true));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }
                counter += 1;
            }
        }
        playable_squares["bottom-right"] = path;

        return playable_squares;
    }

    /**
     * Calculate Current Square on the path
     * @param {int} current_square_id Current Square 
     * @param {int} target_square_id Target Square(loop element, example 'i')
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @param {boolean} diagonal Is path diagonal
     * @returns {(Array<int>|JSON)}
     */
    #calcCurrentSquare(current_square_id, target_square_id, piece_sensivity, diagonal = false) {
        let squares = [];

        // If target square and current square is same then not push square to squares 
        if (piece_sensivity) { // if piece sensivity is true then calculate every piece on the path
            // Control square 
            let square_type = GameController.isSquareHasPiece(target_square_id);
            if (square_type)
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
     * Is Check ?
     * @param {int} square_id Square ID of the target square
     * @param {string} enemy_color Enemy color to compare(optional)
     * @returns {(Array<int>|boolean)}
     */
    isSquareInDanger(square_id, enemy_color) {
        // Array<int> 
        let dangerous_paths = [];

        // Bishop and Queen - Diagonal
        const diagonal = this.getDiagonalSquaresOfSquare({ square_id: square_id});
        for (let i in diagonal) {
            if (GameController.isSquareHasEnemy(diagonal[i].slice(-1)[0], enemy_color, ["queen", "bishop"])) {
                if (get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(diagonal[i == "top-left" ? "top-left" : "top-right"].concat(diagonal[i == "bottom-right" ? "bottom-right" : "bottom-left"]));
                else
                    return true;
            }
        }


        // Rook and Queen - Row
        const row = this.getRowSquaresOfSquare({ square_id: square_id, route_path: ["right", "left"] });
        for (let i in row) {
            if (GameController.isSquareHasEnemy(row[i].slice(-1)[0], enemy_color, ["queen", "rook"])) {
                if (get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(row["right"].concat(row["left"]));
                else
                    return true;
            }
        }

        // Rook and Queen - Column
        const column = this.getColumnSquaresOfSquare({ square_id: square_id, route_path: ["top", "bottom"] });
        for (let i in column) {
            if (GameController.isSquareHasEnemy(column[i].slice(-1)[0], enemy_color, ["queen", "rook"])) {
                if (get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(column["top"].concat(column["bottom"]));
                else
                    return true;
            }
        }

        /*
        // TODO: Knight, Pawn ve king de hesaplanacak.
        */
        return dangerous_paths.length != 0 ? dangerous_paths : false;
    }

    /**
     * Calculate Queen Playable Squares/PathS
     * @returns {JSON}
     */
    calcQueenPlayableSquares(){
        return {
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...this.#calcColumnSquaresOfSquare({ square_id: square_id }),
            ...this.#calcRowSquaresOfSquare({ square_id: square_id }),
            ...this.#calcDiagonalSquaresOfSquare({ square_id: square_id })
        }
    }

    calcBishopPlayableSquares(){
        return {
            // get all squares of diagonal
            ...this.#calcDiagonalSquaresOfSquare({ square_id: square_id })
        }
    }

    calcRookPlayableSquares(){
        return {
            // get all squares of column and row
            ...this.#calcColumnSquaresOfSquare({ square_id: square_id }),
            ...this.#calcRowSquaresOfSquare({ square_id: square_id }),
        }
    }

    calcPawnPlayableSquares(square_id){
        // FIXME: Burası düzeltilecek yeni json formatına göre
        let limit = 0;
        let route = "";
        let row_of_pawn = this.#calcRowOfSquare(square_id);

        if (gl_current_move == "black") {
            limit = row_of_pawn == 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = ["top"]; // black goes top
        }
        else if (gl_current_move == "white") {
            limit = row_of_pawn == 2 ? 2 : 1;
            route = ["bottom"]; // white goes bottom
        }

        let playable_squares = this.#calcColumnSquaresOfSquare({ square_id: square_id, distance_limit: limit, route_path: route })[route]; // get first [limit] square of [route] column
        let diagonal_control = this.#calcDiagonalSquaresOfSquare({ square_id: square_id, distance_limit: 1, route_path: route })[route]; // get first diagonal squares

        // is first diagonal squares has enemy piece then add playable squares
        diagonal_control.filter(item => {
            if (GameController.isSquareHasEnemy(item))
                playable_squares.push(item);
        })
    }

    calcKnightPlayableSquares(){

    }

    calcKingPlayableSquares(){

    }
}











