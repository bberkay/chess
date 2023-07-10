class RouteEngine {
    /**
     * Singleton Instance
     */
    constructor() {
        if (!RouteEngine.instance)
            RouteEngine.instance = this;
        
        return RouteEngine.instance;
    }

    /**
     * Calculate Column Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensitivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"top":[5,13,21], "bottom":[37,45,53,61]}
     * @returns {JSON}
     */
    calcPlayableColumnSquares({ square_id, distance_limit = null, piece_sensitivity = true }) {
        let playable_squares = {};
        let counter, path;

        // Top of Column
        counter = 1;
        path = [];

        for (let i = square_id - 8; i > 0; i -= 8) {
            if (distance_limit && counter > distance_limit)
                break;

            path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
            if (path.includes("break")) { // delete "break" from path
                path.pop();
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
            path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
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
     * @param {boolean} piece_sensitivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"left":[25, 26, 27, 28], "right":[30, 31, 32]}
     * @returns {JSON}
     */
    calcPlayableRowSquares({ square_id, distance_limit = null, piece_sensitivity = true }) {
        let playable_squares = {};
        let row = Calculator.calcRowOfSquare(square_id);
        let path, counter;

        // Right of Square
        counter = 1;
        path = [];

        for (let i = square_id + 1; i <= row * 8; i++) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
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
            path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
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
     * @param {boolean} piece_sensitivity To avoid tripping over other pieces.
     * @example If square id is 29 then result will be {"top-left": [2, 11, 20], "bottom-right":[38, 47, 56], "top-right": [8, 15, 22], "bottom-left":[36, 43, 50, 57]}
     * @returns {JSON}
     */
    calcPlayableDiagonalSquares({ square_id, distance_limit = null, piece_sensitivity = true }) {
        let playable_squares = {};
        let path, counter;

        // Top Left Diagonal of Piece
        path = [];
        counter = 1;

        if (Calculator.calcColumnOfSquare(square_id) !== 1) { // if piece not on the far left
            for (let i = square_id - 9; i > 0; i -= 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
                if (path.includes("break")) { // delete "break" from path
                    path.pop();
                    break;
                }

                if(i % 8 == 0 || i % 8 == 1) // if square reach the edges of the board
                    break;

                counter += 1;
            }
        }
        playable_squares["top-left"] = path;

        // Left Bottom Diagonal of Piece
        path = [];
        counter = 1;

        if (Calculator.calcColumnOfSquare(square_id) !== 1) {
            for (let i = square_id + 7; i < 65; i += 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }

                if(i % 8 == 0 || i % 8 == 1)
                    break;

                counter += 1;
            }
        }
        playable_squares["bottom-left"] = path;

        // Top Right Diagonal of Piece
        path = [];
        counter = 1;

        if (Calculator.calcColumnOfSquare(square_id) !== 8) { // if piece not on the far right
            for (let i = square_id - 7; i > 0; i -= 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }

                if(i % 8 == 0 || i % 8 == 1)
                    break;

                counter += 1;
            }
        }
        playable_squares["top-right"] = path;

        // Bottom Right Diagonal of Piece
        path = [];
        counter = 1;
        if (Calculator.calcColumnOfSquare(square_id) !== 8) {
            for (let i = square_id + 9; i < 65; i += 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensitivity));
                if (path.includes("break")) {
                    path.pop();
                    break;
                }

                if(i % 8 == 0 || i % 8 == 1)
                    break;

                counter += 1;
            }
        }
        playable_squares["bottom-right"] = path;

        return playable_squares;
    }

    /**
     * Calculate Playable Path
     * @param {int} target_square_id Square ID of square to check
     * @param {boolean} piece_sensitivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    #calcPlayablePath(target_square_id, piece_sensitivity = true) {
        let squares = [];

        // if piece sensitivity is true then calculate every piece on the path
        if (piece_sensitivity) {
            if (BoardManager.isSquareHasPiece(target_square_id, Global.getCurrentMove())) {
                squares.push("break");
                return squares;
            } else if (BoardManager.isSquareHasPiece(target_square_id, Global.getEnemyColor())) {
                squares.push(target_square_id);
                squares.push("break");
                return squares;
            } else
                squares.push(target_square_id);
        } else // if piece sensitivity is false then no need control
            squares.push(target_square_id);

        
        return squares;
    }
}