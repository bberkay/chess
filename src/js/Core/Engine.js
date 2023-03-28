class Engine {
    /**
     * @public 
     * Create ID for piece(between 1000 and 9999)
     * @returns {int}
     */
    createPieceID() {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (gl_id_list.includes(id))
            this.createPieceID();
        else
            gl_id_list.push(id);

        return id
    }

    /**
     * @public 
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     * @param {JSON} json_path JSON Path to convert
     * @returns {Array<int>}
     */
    jsonPathToArrayPath(json_path) {
        let array_path = [];
        for (let i in json_path) {
            for (let j in json_path[i]) {
                array_path.push(json_path[i][j]);
            }
        }
        return array_path;
    }

    /**
     * @public 
     * Calculate Bishop Path
     * @param {int} square_id Square ID of the bishop
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    calcBishopPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of diagonal
            ...this.#calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
        }
    }

    /**
     * @public 
     * Calculate Rook Path
     * @param {int} square_id Square ID of the rook
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    calcRookPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column and row
            ...this.#calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.#calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
        }
    }

    /**
     * @public 
     * Calculate Queen Path
     * @param {int} square_id Square ID of the queen
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    calcQueenPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...this.#calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.#calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.#calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
        }
    }

    /**
     * @public 
     * Calculate Pawn Path
     * @param {int} square_id Square ID of the pawn
     * @returns {JSON}
     */
    calcPawnPath(square_id) {
        let limit = 0;
        let route = "";
        let row_of_pawn = this.#calcRowOfSquare(square_id);

        if (gl_current_move === "black") {
            limit = row_of_pawn === 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = ["top"]; // black goes top
        } else if (gl_current_move === "white") {
            limit = row_of_pawn === 2 ? 2 : 1;
            route = ["bottom"]; // white goes bottom
        }

        // get first [limit] square of [route] column
        let playable_squares = this.#calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: limit,
            route_path: route
        })[route];

        // get first diagonal squares
        let diagonal_control = this.#calcPlayableDiagonalSquares({
            square_id: square_id,
            distance_limit: 1,
            route_path: route
        })[route];

        // is first diagonal squares has enemy piece then add playable squares
        if(diagonal_control){
            diagonal_control.filter(item => {
                if (GameController.isSquareHasPiece(item, GameController.getEnemyColor()))
                    playable_squares.push(item);
            })
        }

        return playable_squares;
    }

    /**
     * @public 
     * Calculate Knight Path
     * @param {int} square_id Square ID of the knight
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    calcKnightPath(square_id, piece_sensivity = true) {
        // get 2 squares of column
        let column = this.jsonPathToArrayPath(this.#calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: 2,
            piece_sensivity: piece_sensivity
        })).sort();
        column = column.filter(item => {
            return square_id === item - 16 || square_id === item + 16
        });
        // get 2 squares of row
        let row = this.jsonPathToArrayPath(this.#calcPlayableRowSquares({
            square_id: square_id,
            distance_limit: 2,
            piece_sensivity: piece_sensivity
        })).sort();
        row = row.filter(item => {
            return square_id === item - 2 || square_id === item + 2
        });
        // get first square of left side and right side at end of the column 
        let column_sides = [];
        column.forEach(item => {
            column_sides.push(this.jsonPathToArrayPath(this.#calcPlayableRowSquares({
                square_id: item,
                distance_limit: 1,
                piece_sensivity: piece_sensivity
            })))
        })
        // get first square of top side and bottom side at end of the row
        let row_sides = [];
        row.forEach(item => {
            row_sides.push(this.jsonPathToArrayPath(this.#calcPlayableColumnSquares({
                square_id: item,
                distance_limit: 1,
                piece_sensivity: piece_sensivity
            })))
        });

        // concat all playable squares
        let playable_squares = [];
        column_sides.concat(row_sides).forEach(item => {
            item.forEach(square => {
                playable_squares.push(square);
            })
        })

        return playable_squares;
    }

    /**
     * @public 
     * Calculate King Path
     * @param {int} square_id Square ID of the king
     * @returns {JSON}
     */
    calcKingPath(square_id) {
        return {
            // get first square of column, row and diagonal
            ...this.#calcPlayableColumnSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...this.#calcPlayableRowSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...this.#calcPlayableDiagonalSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            })
        }
    }


    /**
     * @private
     * Calculate Column of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    #calcColumnOfSquare(square_id) {
        return square_id % 8 === 0 ? 8 : square_id % 8;
    }

    /**
     * @private
     * Calculate Row of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    #calcRowOfSquare(square_id) {
        return Math.ceil(square_id / 8);
    }

    /**
     * @private
     * Calculate Column Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"top":[5,13,21], "bottom":[37,45,53,61]}
     * @returns {JSON}
     */
    #calcPlayableColumnSquares({square_id, distance_limit = null, piece_sensivity = true}) {
        let playable_squares = {};
        let counter, path;

        // Top of Column
        counter = 1;
        path = [];

        for (let i = square_id - 8; i > 0; i -= 8) {
            if (distance_limit && counter > distance_limit)
                break;

            path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
            path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
     * @private
     * Calculate Row Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example if square id is 29 then result will be {"left":[25, 26, 27, 28], "right":[30, 31, 32]}
     * @returns {JSON}
     */
    #calcPlayableRowSquares({square_id, distance_limit = null, piece_sensivity = true}) {
        let playable_squares = {};
        let row = this.#calcRowOfSquare(square_id);
        let path, counter;

        // Right of Square
        counter = 1;
        path = [];

        for (let i = square_id + 1; i <= row * 8; i++) {
            if (distance_limit && counter > distance_limit)
                break;
            path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
            path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
     * @private
     * Calculate Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @example If square id is 29 then result will be {"top-left": [2, 11, 20], "bottom-right":[38, 47, 56], "top-right": [8, 15, 22], "bottom-left":[36, 43, 50, 57]}
     * @returns {JSON}
     */
    #calcPlayableDiagonalSquares({square_id, distance_limit = null, piece_sensivity = true}) {
        let playable_squares = {};
        let path, counter;

        // Top Left Diagonal of Piece
        path = [];
        counter = 1;

        if (this.#calcColumnOfSquare(square_id) !== 1) { // if piece not on the far left
            for (let i = square_id - 9; i > 0; i -= 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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

        if (this.#calcColumnOfSquare(square_id) !== 1) {
            for (let i = square_id + 7; i < 65; i += 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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

        if (this.#calcColumnOfSquare(square_id) !== 8) { // if piece not on the far right
            for (let i = square_id - 7; i > 0; i -= 7) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
        if (this.#calcColumnOfSquare(square_id) !== 8) {
            for (let i = square_id + 9; i < 65; i += 9) {
                if (distance_limit && counter > distance_limit)
                    break;

                path = path.concat(this.#calcPlayablePath(i, piece_sensivity));
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
     * @private
     * Calculate Playable Path
     * @param {int} target_square_id Square ID of square to check
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    #calcPlayablePath(target_square_id, piece_sensivity = true) {
        let squares = [];

        // if piece sensivity is true then calculate every piece on the path
        if (piece_sensivity) {
            if (GameController.isSquareHasPiece(target_square_id, gl_current_move)) {
                squares.push("break");
                return squares;
            } else if (GameController.isSquareHasPiece(target_square_id, GameController.getEnemyColor())) {
                squares.push(target_square_id);
                squares.push("break");
                return squares;
            } else
                squares.push(target_square_id);
        } else // if piece sensivity is false then no need control
            squares.push(target_square_id);

        // if square reach the edges of the board
        if (this.#calcColumnOfSquare(target_square_id) === 8 || this.#calcColumnOfSquare(target_square_id) === 1)
            squares.push("break");

        return squares;
    }

    /**
     * Is Check ?
     * @returns {(Array<int>|boolean)}
     */
    isCheck() {
        /**
         * Set Operation that connected to Path
         * @param {string} current_path_direction
         * @param {(function|JSON)} operations
         * @example Find dangerous enemies to the current path direction
         * @return {any}
         */
        function getPathConnection(current_path_direction, ...operations) {
            // If operations is json(if operations length is 1, the type is json) then return bottom-right, top-left, ..., etc. squares
            // If operations is not json then return dangerous enemies
            let func_operation_control = operations.length > 1;

            // If path is top-left, bottom-right ...
            // then dangerous enemies are queen and bishop(if operations is functions)
            // then return top-left and bottom-right or top-right and bottom-left of squares that came from operations(if operations is json)
            if (current_path_direction === "top-left" || current_path_direction === "bottom-right")
                return func_operation_control ? operations[0]() : operations[0]["top-left"].concat(operations[0]["bottom-right"]);
            else if (current_path_direction === "top-right" || current_path_direction === "bottom-left")
                return func_operation_control ? operations[0]() : operations[0]["top-right"].concat(operations[0]["bottom-left"]);
            // If path is left, right ...
            // then dangerous enemies are queen and rook(if operations is functions)
            // then return left and right or top and bottom of squares that came from operations(if operations is json)
            else if (current_path_direction === "left" || current_path_direction === "right")
                return func_operation_control ? operations[1]() : operations[0]["left"].concat(operations[0]["right"]);
            else if (current_path_direction === "top" || current_path_direction === "bottom")
                return func_operation_control ? operations[1]() : operations[0]["top"].concat(operations[0]["bottom"]);
        }

        // Array<int>
        let dangerous_squares = [];

        const square_id = GameController.getPlayerKingSquareID();
        const enemy_color = GameController.getEnemyColor();

        // Control for Enemy Bishop, Queen, Rook
        const diagonal_row_column_path = this.calcQueenPath(square_id); // Get all path
        let l = 0;
        for (let i in diagonal_row_column_path) {
            l = diagonal_row_column_path[i].length;
            for (let j = 0; j < l; j++) {
                let enemy_types = [];
                // Set enemy types by path(example, if i is bottom-left then control bishop at the bottom-left and top-right)
                enemy_types = getPathConnection(i,
                    () => enemy_types.concat(enemy_types.includes("queen") ? ["bishop"] : ["queen", "bishop"]),
                    () => enemy_types.concat(enemy_types.includes("queen") ? ["rook"] : ["queen", "rook"]))

                // If current square has an any dangerous enemy then player's "checked" and return true or dangerous squares
                let res = GameController.isSquareHasPiece(diagonal_row_column_path[i][j], enemy_color, enemy_types);
                if (res)
                    dangerous_squares = getPathConnection(i, diagonal_row_column_path);
            }
        }


        // Control for Enemy Knight
        const knight_control = this.calcKnightPath(square_id);
        l = knight_control.length;
        for (let i = 0; i < l; i++) {
            if (GameController.isSquareHasPiece(knight_control[i], enemy_color, ["knight"]))
                dangerous_squares = gl_current_dangerous_squares.concat(knight_control);
        }

        return dangerous_squares.length !== 0;
    }
    
}