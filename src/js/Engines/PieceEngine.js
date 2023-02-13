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
            let path = [];

            // Top of Column
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

            if(route_path && route_path.includes("top"))
                playable_squares["top"] = path;
            else
                squares = squares.concat(path);
        }

        if (route_path == null || route_path.includes("bottom")) {
            let counter = 1;
            let path = [];

            // Bottom of Column
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

            if(route_path && route_path.includes("bottom"))
                playable_squares["bottom"] = path;
            else
                squares = squares.concat(path);
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
            let path = [];

            // Right of Square
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
            if(route_path && route_path.includes("right"))
                playable_squares["right"] = path;
            else
                squares = squares.concat(path);
        }

        if (route_path == null || route_path.includes("left")) {
            let counter = 1;
            let path = [];

            // Left of Square
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
            if(route_path && route_path.includes("left"))
                playable_squares["left"] = path;
            else
                squares = squares.concat(path);
        }

        return route_path ? playable_squares : squares;
    }

    /**
     * Get Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(Array<string>|null)} route_path Specific route path("bottom", "top", "left", "right", bottom-right", "bottom-left", "top-left", "top-right")
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example {"left": [9, 18, 27, 36, 54, 63], "right":[24, 31, 38, 52, 59]} If square id is 45
     * @returns {(Array<int>|JSON)}
     */
    getDiagonalSquaresOfSquare({ square_id, distance_limit = null, route_path = null, piece_sensivity = true }) {
        let playable_squares = {};
        let squares = [];
        let counter = 1;
        const current_square_id = square_id;
        
        // Top Left Diagonal of Piece
        if (route_path == null || route_path.includes("top") || route_path.includes("top-left") || route_path.includes("left")) {
            let path = [];
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
            if(route_path && route_path.includes("top"))
                playable_squares["top"] = path;
            else if(route_path && route_path.includes("top-left"))
                playable_squares["top-left"] = path;
            else if(route_path && route_path.includes("left"))
                playable_squares["left"] = path;
            else
                squares = squares.concat(path);

        }

        // Left Bottom Diagonal of Piece
        if (route_path == null || route_path.includes("bottom") || route_path.includes("bottom-left") || route_path.includes("right")) {
            let path = [];
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
            if(route_path && route_path.includes("bottom"))
                playable_squares["bottom"] = path;
            else if(route_path && route_path.includes("bottom-left"))
                playable_squares["bottom-left"] = path;
            else if(route_path && route_path.includes("right"))
                playable_squares["right"] = path;
            else
                squares = squares.concat(path);
        }

        // Top Right Diagonal of Piece
        if (route_path == null || route_path.includes("top") || route_path.includes("top-right") || route_path.includes("right")) {
            let path = [];
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
            if(route_path && route_path.includes("top"))
                playable_squares["top"] = playable_squares["top"].concat(path);
            else if(route_path && route_path.includes("top-right"))
                playable_squares["top-right"] = path;
            else if(route_path && route_path.includes("right"))
                playable_squares["right"] = playable_squares["right"].concat(path);
            else
                squares = squares.concat(path);
        }

        // Bottom Right Diagonal of Piece
        if (route_path == null || route_path.includes("bottom") || route_path.includes("bottom-right") || route_path.includes("left")) {
            let path = [];
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
            if(route_path && route_path.includes("bottom"))
                playable_squares["bottom"] = playable_squares["bottom"].concat(path);
            else if(route_path && route_path.includes("bottom-right"))
                playable_squares["bottom-right"] = path;
            else if(route_path && route_path.includes("left"))
                playable_squares["left"] = playable_squares["left"].concat(path);
            else
                squares = squares.concat(path);
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
     * @param {string} get_squares_dangerous_path Get squares of the dangerous path
     * @returns {(Array<int>|boolean)}
     */
    isSquareInDanger(square_id, enemy_color, get_dangerous_path_squares = false) {  
        // Array<int> 
        let dangerous_paths = [];
        
        // Bishop and Queen - Diagonal
        const diagonal = this.getDiagonalSquaresOfSquare({square_id:square_id, route_path:["top-left", "top-right", "bottom-right", "bottom-left"]});
        for(let i in diagonal){
            if(GameController.isSquareHasEnemy(diagonal[i].slice(-1)[0], enemy_color, ["queen", "bishop"])){
                if(get_dangerous_path_squares){
                    if(i == "top-left" || i == "bottom-right")
                        dangerous_paths = dangerous_paths.concat(diagonal["top-left"].concat(diagonal["bottom-right"]));
                    else if(i == "top-right" || i == "bottom-left")
                        dangerous_paths = dangerous_paths.concat(diagonal["top-right"].concat(diagonal["bottom-left"]));
                }
                else
                    return true;
            }
        }


        // Rook and Queen - Row
        const row = this.getRowSquaresOfSquare({square_id:square_id, route_path:["right", "left"]}); 
        for(let i in row){
            if(GameController.isSquareHasEnemy(row[i].slice(-1)[0], enemy_color, ["queen", "rook"])){
                if(get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(row["right"].concat(row["left"]));
                else
                    return true;
            }
        }

        // Rook and Queen - Column
        const column = this.getColumnSquaresOfSquare({square_id:square_id, route_path:["top", "bottom"]}); 
        for(let i in column){
            if(GameController.isSquareHasEnemy(column[i].slice(-1)[0], enemy_color, ["queen", "rook"])){
                if(get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(column["top"].concat(column["bottom"]));
                else
                    return true;
            }
        }

        /*
        // TODO: Knight, Pawn ve king de hesaplanacak.
        */
        return dangerous_paths ? dangerous_paths : false;
    }

}











