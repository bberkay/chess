class Engine {
    /**
     * Get Playable Squares of the Piece
     * @param {Piece} piece Piece Object
     * @returns {Array<int>}
     */
    getPlayableSquares(piece) {
        return piece.getPlayableSquares();
    }

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
     * @param {(boolean|string)} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getColumnSquaresOfSquare({square_id, distance_limit = null, route_path = null, piece_sensivity = true}) {
        let squares = [];

        if (route_path == null || route_path == "top") {
            let counter = 0;

            // Top of Column
            for (let i = square_id; i > 0; i -= 8) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity));
                if(squares.includes("break")){
                    squares.pop(); // delete "break" from squares
                    break;
                }
                counter += 1;
            }
        }

        if (route_path == null || route_path == "bottom") {
            let counter = 0;

            // Bottom of Column
            for (let i = square_id; i < 65; i += 8) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity));
                if(squares.includes("break")){
                    squares.pop();
                    break;
                }
                counter += 1;
            }
        }

        return squares;
    }

    /**
     * Get Row Squares List of Square
     * @param {int} square_id Square ID of the active piece
     * @param {(string|null)} route_path Specific route path only "left" or "right"(or null for both)
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {(boolean|string)} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getRowSquaresOfSquare({square_id, distance_limit = null, route_path = null, piece_sensivity = true}) {
        let squares = [];
        let row = this.getRowOfSquare(square_id);

        if (route_path == null || route_path == "right") {
            let counter = 0;

            // Right of Square
            for (let i = square_id; i <= row * 8; i++) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity));
                if(squares.includes("break")){
                    squares.pop(); // delete "break" from squares
                    break;
                }
                counter += 1;
            }
        }

        if (route_path == null || route_path == "left") {
            let counter = 0;

            // Left of Square
            for (let i = square_id; i >= (row * 8) - 7; i--) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity));
                if(squares.includes("break")){
                    squares.pop(); 
                    break;
                }
                counter += 1;
            }
        }

        return squares;
    }

    /**
     * Get Diagonal Squares List of Piece
     * @param {int} square_id Square ID of the active piece
     * @param {(string|null)} route_path Specific route path only "top" or "bottom"(or null for both)
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {(boolean|string)} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    getDiagonalSquaresOfSquare({square_id, distance_limit = null, route_path = null, piece_sensivity = true}) {
        let squares = [];

        if (route_path == null || route_path == "top") {
            let counter = 0;
            // Top Left Diagonal of Piece
            for (let i = square_id; i > 0; i -= 9) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity, "left"));
                if(squares.includes("break")){
                    squares.pop(); // delete "break" from squares
                    break;
                }
                counter += 1;
            }

            counter = 0;
            // Top Right Diagonal of Piece
            for (let i = square_id; i > 0; i -= 7) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity, "right"));
                if(squares.includes("break")){
                    squares.pop();
                    break;
                }
                counter += 1;
            }
        }

        if (route_path == null || route_path == "bottom") {
            let counter = 0;
            // Bottom Right Diagonal of Piece
            for (let i = square_id; i < 65; i += 9) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity, "right"));
                if(squares.includes("break")){
                    squares.pop();
                    break;
                }
                counter += 1;
            }

            counter = 0;
            // Left Bottom Diagonal of Piece
            for (let i = square_id; i < 65; i += 7) {
                squares = squares.concat(this.#checkPath(i, square_id, distance_limit, counter, piece_sensivity, "left"));
                if(squares.includes("break")){
                    squares.pop();
                    break;
                }
                counter += 1;
            }
        }
        return squares;
    }

    /**
     * Get Column Squares List of Square
     * @param {int} square Target Square(loop element, example 'i')
     * @param {int} square_id Square ID of the active piece
     * @param {(int|null)} distance_limit Move away at most [distance_limit] squares from square.
     * @param {int} counter Current count of the loop for check distance limit
     * @param {(boolean|string)} piece_sensivity To avoid tripping over other pieces.
     * @param {(string|boolean)} diagonal Is path diagonal then give the direction "left" or "right"
     * @returns {Array<int>}
     */
    #checkPath(square, square_id, distance_limit, counter, piece_sensivity, diagonal = false){
        let squares = [];
        // If target square and current square is same then not push square to squares 
        if (square != square_id && piece_sensivity) { 
            // if piece sensivity is true then calculate every piece on the path
            let square_type = isSquareHas(square);
            // Stop if any piece on the path and piece doesn't have to ability to jump(of course this control because of knight).                     
            if (square_type == "enemy") { 
                let piece = getPieceBySquareID(square); 
                squares.push(square);
                if(piece.type != piece_sensivity)
                    squares.push("break");
                return squares;
            }
            else if(square_type == "friend")
                return squares;
            else
                squares.push(square);
        }
        else if(square != square_id && !piece_sensivity) // if piece sensivity is false add all squares to squares list
            squares.push(square);

        // FIXME Diagonal de iken piece sensivity kontrolü yapılabilir ancak bug var mı yok mu emin değiliz o yüzden bunu daha sonradan test ederiz(veya test zamanı).
        // Stop if diagonal arrives at the [diagonal] of the board
        if(diagonal){
            if (this.getColumnOfSquare(square) == 8 || this.getColumnOfSquare(square) == 1){ 
                squares.push("break"); 
                return squares;
            } 
        }

        // Stop if limit has reached.
        if (distance_limit == counter) { 
            if (!piece_sensivity)
                squares.push(square); // Last square before the limit
            squares.push("break");
            return squares;
        }

       
        return squares;
    }
}