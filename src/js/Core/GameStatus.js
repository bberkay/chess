class GameStatus{
    /**
     * @static
     * Is Check ?
     * @returns {boolean}
     */
    static isCheck() {
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
        const diagonal_row_column_path = RouteEngine.calcQueenPath(square_id); // Get all path
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
        const knight_control = RouteEngine.calcKnightPath(square_id);
        l = knight_control.length;
        for (let i = 0; i < l; i++) {
            if (GameController.isSquareHasPiece(knight_control[i], enemy_color, ["knight"]))
                dangerous_squares = gl_current_dangerous_squares.concat(knight_control);
        }

        return dangerous_squares.length !== 0;
    }
}