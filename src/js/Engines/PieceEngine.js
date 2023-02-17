class PieceEngine {
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
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"top":[5,13,21], "bottom":[37,45,53,61]} 
     * @returns {JSON}
     */
    getColumnSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
        let playable_squares = {};
        const current_square_id = square_id;
        let counter, path;

        // Top of Column
        counter = 1;
        path = [];

        for (let i = square_id - 8; i > 0; i -= 8) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
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
            path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
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
     * Get Row Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"left":[25, 26, 27, 28], "right":[30, 31, 32]} 
     * @returns {JSON}
     */
    getRowSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
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
            path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
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
            path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity));
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
     * Get Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example If square id is 29 then result will be {"top-left": [2, 11, 20], "bottom-right":[38, 47, 56], "top-right": [8, 15, 22], "bottom-left":[36, 43, 50, 57]} 
     * @returns {JSON}
     */
    getDiagonalSquaresOfSquare({ square_id, distance_limit = null, piece_sensivity = true }) {
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

                path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
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

                path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
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

                path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
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

                path = path.concat(this.#getPlayableSquares(current_square_id, i, piece_sensivity, true));
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

}











