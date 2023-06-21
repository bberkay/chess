class PathEngine{
    /**
     * @static
     * Calculate Bishop Path
     * @param {int} square_id Square ID of the bishop
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    static calcBishopPath(square_id, piece_sensivity = true) {
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        return {
            // get all squares of diagonal
            ...route_engine.calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
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
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        return {
            // get all squares of column and row
            ...route_engine.calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...route_engine.calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
        }
    }

    /**
     * Calculate Queen Path
     * @param {int} square_id Square ID of the queen
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {JSON}
     */
    static calcQueenPath(square_id, piece_sensivity = true) {
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        return {
            // get all squares of column, row and diagonal(UNLIMITED POWEEEER!!!)
            ...route_engine.calcPlayableColumnSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...route_engine.calcPlayableRowSquares({square_id: square_id, piece_sensivity: piece_sensivity}),
            ...route_engine.calcPlayableDiagonalSquares({square_id: square_id, piece_sensivity: piece_sensivity})
        }
    }

    /**
     * Calculate Pawn Path
     * @param {int} square_id Square ID of the pawn
     * @returns {JSON}
     */
    static calcPawnPath(square_id) {
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        let limit = 0;
        let route = "";
        let row_of_pawn = route_engine.calcRowOfSquare(square_id);

        let color_of_pawn = BoardManager.getPieceBySquareId(square_id).color;
        if (color_of_pawn === Color.White) {
            limit = row_of_pawn === 7 ? 2 : 1;  // if black pawn is start position then 2 square limit else 1
            route = [Route.Top]; // black goes top
        } else if (color_of_pawn === Color.Black) {
            limit = row_of_pawn === 2 ? 2 : 1;
            route = [Route.Bottom]; // white goes bottom
        }

        // get first [limit] square of [route] column
        let playable_squares = route_engine.calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: limit,
        })[route];
        
        // Remove if squares has any piece
        playable_squares = playable_squares.filter(square => { return Global.getSquare(square) == 0});

        // get first diagonal squares
        let diagonal_control = route_engine.calcPlayableDiagonalSquares({
            square_id: square_id,
            distance_limit: 1,
        });

        // is first diagonal squares has enemy piece then add playable squares
        if (BoardManager.isSquareHasPiece(diagonal_control[route+"-"+Route.Left][0], Global.getEnemyColor()))
            playable_squares.push(diagonal_control[route+"-"+Route.Left][0]);

        if (BoardManager.isSquareHasPiece(diagonal_control[route+"-"+Route.Right][0], Global.getEnemyColor()))
            playable_squares.push(diagonal_control[route+"-"+Route.Right][0]);

        return playable_squares;
    }

    /**
     * Calculate Knight Path
     * @param {int} square_id Square ID of the knight
     * @param {boolean} piece_sensivity To avoid tripping over other pieces.
     * @returns {Array<int>}
     */
    static calcKnightPath(square_id, piece_sensivity = true) {
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        // get 2 squares of column
        let column = Converter.jsonPathToArrayPath(route_engine.calcPlayableColumnSquares({
            square_id: square_id,
            distance_limit: 2,
            piece_sensivity: false
        })).sort();
        column = column.filter(item => {
            return square_id === item - 16 || square_id === item + 16
        });

        // get 2 squares of row
        let row = Converter.jsonPathToArrayPath(route_engine.calcPlayableRowSquares({
            square_id: square_id,
            distance_limit: 2,
            piece_sensivity: false
        })).sort();
        row = row.filter(item => {
            return square_id === item - 2 || square_id === item + 2
        });

        // get first square of left side and right side at end of the column 
        let column_sides = [];
        column.forEach(item => {
            column_sides.push(Converter.jsonPathToArrayPath(route_engine.calcPlayableRowSquares({
                square_id: item,
                distance_limit: 1,
                piece_sensivity: false
            })))
        })

        // get first square of top side and bottom side at end of the row
        let row_sides = [];
        row.forEach(item => {
            row_sides.push(Converter.jsonPathToArrayPath(route_engine.calcPlayableColumnSquares({
                square_id: item,
                distance_limit: 1,
                piece_sensivity: false
            })))
        });

        // concat all playable squares
        let playable_squares = [];
        column_sides.concat(row_sides).forEach(item => {
            item.forEach(square => {
                if(!BoardManager.isSquareHasPiece(square, Global.getCurrentMove()))
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
        const route_engine = new RouteEngine(); // singleton instance, all route engine in this class will be the same

        return {
            // get first square of column, row and diagonal
            ...route_engine.calcPlayableColumnSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...route_engine.calcPlayableRowSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            }),
            ...route_engine.calcPlayableDiagonalSquares({
                square_id: square_id,
                piece_sensivity: true,
                distance_limit: 1
            })
        }
    }
}