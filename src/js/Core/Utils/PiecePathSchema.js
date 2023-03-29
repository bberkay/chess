class PiecePathSchema extends PathEngine{
    /**
     * @static
     * Calculate Bishop Path
     * @param {int} square_id Square ID of the bishop
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    static calcBishopPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of diagonal
            ...this.calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
        }
    }

     /**
     * @static 
     * Calculate Rook Path
     * @param {int} square_id Square ID of the rook
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    static calcRookPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column and row
            ...this.calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
        }
    }

    /**
     * @static 
     * Calculate Queen Path
     * @param {int} square_id Square ID of the queen
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    static calcQueenPath(square_id, piece_sensivity = true) {
        return {
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...this.calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...this.calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
        }
    }

    /**
     * @static 
     * Calculate Pawn Path
     * @param {int} square_id Square ID of the pawn
     * @returns {JSON}
     */
    static calcPawnPath(square_id) {
        let limit = 0;
        let route = "";
        let row_of_pawn = this.calcRowOfSquare(square_id);

        if (gl_current_move === "black") {
            limit = row_of_pawn === 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = ["top"]; // black goes top
        } else if (gl_current_move === "white") {
            limit = row_of_pawn === 2 ? 2 : 1;
            route = ["bottom"]; // white goes bottom
        }

        // get first [limit] square of [route] column
        let playable_squares = this.calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: limit,
            route_path: route
        })[route];

        // get first diagonal squares
        let diagonal_control = this.calcPlayableDiagonalSquares({
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
     * @static 
     * Calculate Knight Path
     * @param {int} square_id Square ID of the knight
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    static calcKnightPath(square_id, piece_sensivity = true) {
        // get 2 squares of column
        let column = this.jsonPathToArrayPath(this.calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: 2,
            piece_sensivity: piece_sensivity
        })).sort();
        column = column.filter(item => {
            return square_id === item - 16 || square_id === item + 16
        });
        // get 2 squares of row
        let row = this.jsonPathToArrayPath(this.calcPlayableRowSquares({
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
            column_sides.push(this.jsonPathToArrayPath(this.calcPlayableRowSquares({
                square_id: item,
                distance_limit: 1,
                piece_sensivity: piece_sensivity
            })))
        })
        // get first square of top side and bottom side at end of the row
        let row_sides = [];
        row.forEach(item => {
            row_sides.push(this.jsonPathToArrayPath(this.calcPlayableColumnSquares({
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
     * @static 
     * Calculate King Path
     * @param {int} square_id Square ID of the king
     * @returns {JSON}
     */
    static calcKingPath(square_id) {
        return {
            // get first square of column, row and diagonal
            ...this.calcPlayableColumnSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...this.calcPlayableRowSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...this.calcPlayableDiagonalSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            })
        }
    }

}