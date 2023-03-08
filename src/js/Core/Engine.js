class Engine{
    /**
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
     * @private
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     * @param {JSON} json_path JSON Path to convert
     * @returns {Array<int>}
     */
    #jsonPathToArrayPath(json_path) {
        let array_path = [];
        for (let i in json_path) {
            for(let j in json_path[i]){
                array_path.push(json_path[i][j]);
            }
        }
        return array_path;
    }

    /**
     * Calculate Bishop Playable Squares/Path
     * @param {int} square_id Square ID of the bishop
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfBishop(square_id, piece_sensivity){
        let squares = this.#calcBishopPath(square_id, piece_sensivity);

        return this.#jsonPathToArrayPath(squares);
    }

    /**
     * Calculate Rook Playable Squares/Path
     * @param {int} square_id Square ID of the rook
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfRook(square_id, piece_sensivity){
        let squares = this.#calcRookPath(square_id, piece_sensivity);

        return this.#jsonPathToArrayPath(squares);
    }

    /**
     * Calculate Queen Playable Squares/Path
     * @param {int} square_id Square ID of the queen
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfQueen(square_id, piece_sensivity){
        let squares = this.#calcQueenPath(square_id, piece_sensivity);

        return this.#jsonPathToArrayPath(squares);
    }

    /**
     * Calculate King Playable Squares/Path
     * @param {int} square_id Square ID of the king
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfKing(square_id, piece_sensivity){
        let squares = this.#calcKingPath(square_id, piece_sensivity);

        return this.#jsonPathToArrayPath(squares);
    }
           
    /**
     * Calculate Pawn Playable Squares/Path
     * @param {int} square_id Square ID of the pawn
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfPawn(square_id, piece_sensivity){
        let squares = this.#calcPawnPath(square_id, piece_sensivity);

        return this.#jsonPathToArrayPath(squares);
    }

    /**
     * Calculate Knight Playable Squares/Path
     * @param {int} square_id Square ID of the knight
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getPlayableSquaresOfKnight(square_id, piece_sensivity){
        let squares = this.#calcKnightPath(square_id, piece_sensivity);
    }

    /**
     * @private
     * Calculate Bishop Path
     * @param {int} square_id Square ID of the bishop
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    #calcBishopPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of diagonal
            ...this.#calcPlayableDiagonalSquares({ square_id: square_id, piece_sensivity: piece_sensivity })
        }
    }

    /**
     * @private
     * Calculate Rook Path
     * @param {int} square_id Square ID of the rook
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    #calcRookPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column and row
            ...this.#calcPlayableColumnSquares({ square_id: square_id, piece_sensivity: piece_sensivity }),
            ...this.#calcPlayableRowSquares({ square_id: square_id, piece_sensivity: piece_sensivity }),
        }
    }

    /**
     * @private
     * Calculate Queen Path
     * @param {int} square_id Square ID of the queen
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    #calcQueenPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...this.#calcPlayableColumnSquares({ square_id: square_id, piece_sensivity: piece_sensivity }),
            ...this.#calcPlayableRowSquares({ square_id: square_id, piece_sensivity: piece_sensivity }),
            ...this.#calcPlayableDiagonalSquares({ square_id: square_id, piece_sensivity: piece_sensivity })
        }
    }

    /**
     * Calculate Pawn Path
     * @private
     * @param {int} square_id Square ID of the pawn
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    #calcPawnPath(square_id) {
        let limit = 0;
        let route = "";
        let row_of_pawn = this.#calcRowOfSquare(square_id);

        if (gl_current_move === "black") {
            limit = row_of_pawn === 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = ["top"]; // black goes top
        }
        else if (gl_current_move === "white") {
            limit = row_of_pawn === 2 ? 2 : 1;
            route = ["bottom"]; // white goes bottom
        }

        // get first [limit] square of [route] column
        let playable_squares = this.#calcPlayableColumnSquares({ square_id: square_id, distance_limit: limit, route_path: route })[route];

        // get first diagonal squares
        let diagonal_control = this.#calcPlayableDiagonalSquares({ square_id: square_id, distance_limit: 1, route_path: route })[route];

        // is first diagonal squares has enemy piece then add playable squares
        diagonal_control.filter(item => {
            if (GameController.isSquareHasPiece(item, gl_current_move === "white" ? "black" : "white"))
                playable_squares.push(item);
        })

        return playable_squares;
    }

    /**
     * @private
     * Calculate Knight Path
     * @param {int} square_id Square ID of the knight
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    #calcKnightPath(square_id, piece_sensivity = true) {
        // get 2 squares of column
        let column = this.#jsonPathToArrayPath(this.#calcPlayableColumnSquares({ square_id: square_id, distance_limit: 2, piece_sensivity: piece_sensivity })).sort();
        column = column.filter(item => { return square_id === item - 16 || square_id === item + 16});
        // get 2 squares of row
        let row = this.#jsonPathToArrayPath(this.#calcPlayableRowSquares({ square_id: square_id, distance_limit: 2, piece_sensivity: piece_sensivity })).sort();
        row = row.filter(item => { return square_id === item - 2 || square_id === item + 2});
        // get first square of left side and right side at end of the column 
        let column_sides = [];
        column.forEach(item => { column_sides.push(this.#jsonPathToArrayPath(this.#calcPlayableRowSquares({square_id:item, distance_limit:1, piece_sensivity:piece_sensivity}))) })
        // get first square of top side and bottom side at end of the row
        let row_sides = [];
        row.forEach(item => { row_sides.push(this.#jsonPathToArrayPath(this.#calcPlayableColumnSquares({square_id:item, distance_limit:1, piece_sensivity:piece_sensivity}))) });

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
     * @private
     * Calculate King Path
     * @param {int} square_id Square ID of the king
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    #calcKingPath(square_id, piece_sensivity) {
        return {
            // get first square of column, row and diagonal
            ...this.#calcPlayableColumnSquares({ square_id: square_id, piece_sensivity: piece_sensivity, distance_limit: 1 }),
            ...this.#calcPlayableRowSquares({ square_id: square_id, piece_sensivity: piece_sensivity, distance_limit: 1 }),
            ...this.#calcPlayableDiagonalSquares({ square_id: square_id, piece_sensivity: piece_sensivity, distance_limit: 1 })
        }
    }

    
    /**
     * @deprecated
     * Get playable path to not to be check/avoid endangering the king
     * @param {JSON} playable_squares Playable Squares of Target Piece
     * @example {"top":[4,6,7], "top-right":[3,2,1]} 
     * @returns {JSON} {"top":[2,3,4], "bottom":[5,6,7]}
     */
    #filterPlayableSquares(playable_squares) {
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
                        if (i == "top" && target_square_for_king_control + 8 === king_square_id || i == "bottom" && target_square_for_king_control - 8 == king_square_id)
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
    #calcPlayableColumnSquares({ square_id, distance_limit = null, piece_sensivity = true }) {
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
    #calcPlayableRowSquares({ square_id, distance_limit = null, piece_sensivity = true }) {
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
    #calcPlayableDiagonalSquares({ square_id, distance_limit = null, piece_sensivity = true }) {
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
            }
            else if (GameController.isSquareHasPiece(target_square_id, gl_current_move === "white" ? "black" : "white")) {
                squares.push(target_square_id);
                squares.push("break");
                return squares;
            }
            else
                squares.push(target_square_id);
        }
        else // if piece sensivity is false then no need control
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
    isCheck(get_dangerous_path_squares = false) {
        // Array<int>
        let dangerous_paths = [];

        const square_id = GameController.getEnemyKingSquareID();
        const enemy_color = gl_current_move === "white" ? "black" : "white";

        // Control for Enemy Bishop and Queen
        const diagonal_control = this.#jsonPathToArrayPath(this.#calcBishopPath(square_id));
        let l = diagonal_control.length;
        for(let i = 0; i<l; i++){
            if(GameController.isSquareHasPiece(diagonal_control[i], enemy_color, ["queen", "bishop"])){
                if(get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(diagonal_control);
                else
                    return true;
            }
        }

        // Control for Enemy Rook and Queen
        const row_control = this.#jsonPathToArrayPath(this.#calcRookPath(square_id));
        l = row_control.length;
        for(let i = 0; i<l; i++){
            if(GameController.isSquareHasPiece(row_control[i], enemy_color, ["queen", "rook"])){
                if(get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(diagonal_control);
                else
                    return true;
            }
        }

       // Control for Enemy Knight
        const knight_control = this.#calcKnightPath(square_id);
        l = knight_control.length;
        for(let i = 0; i<l; i++){
            if(GameController.isSquareHasPiece(knight_control[i], enemy_color, ["knight"])){
                if(get_dangerous_path_squares)
                    dangerous_paths = dangerous_paths.concat(diagonal_control);
                else
                    return true;
            }
        }

        return dangerous_paths.length !== 0 ? dangerous_paths : false;
    }

    /**
    * Delete unplayable squares of playable squares for keep king safe
    * @param {Array<int>} playable_squares Playable Squares of current piece
    * @returns {Array<int>}
    */
    filterPlayableSquares(playable_squares) {
        // TODO: Sıra burada ama mevcut sistem de knight patlıyor gibi duruyor
    }
}