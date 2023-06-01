class GameStatus{
    /**
     * @static
     * Is Check ?
     * @param {int} square_id Is square(square_id) checked?
     * @returns {boolean}
     */
    static isCheck(square_id = null) {
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
        // Temp variables to undo changes on the board
        let temp_king_square_id;
        let temp_player_king;
        let temp_player_piece;
        let change_status = false;

        // If square_id is not null then control target id for check
        if(square_id){
            temp_king_square_id = GameController.getPlayerKingSquareID();
            temp_player_king = GameController.getPlayerKing();
            temp_player_piece = GameController.getPieceBySquareID(square_id);
            GameController.changeSquare(GameController.getPlayerKingSquareID(), 0);
            GameController.changeSquare(square_id, temp_player_king);
            change_status = true;
        }

        square_id = GameController.getPlayerKingSquareID();
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
                dangerous_squares = dangerous_squares.concat(knight_control);
        }

        if(change_status){
            GameController.changeSquare(square_id, temp_player_piece);
            GameController.changeSquare(temp_king_square_id, temp_player_king);
        }
        return dangerous_squares.length !== 0;
    }

    /**
     * @static
     * Is current player can long castling?
     * @returns {boolean}
     */
    static canLongCastling(){
        if(gl_castling_control[gl_current_move + "-long"] == false)
            return false;            

        // Find long rook square_id by player's color
        let long_rook = gl_current_move == "white" ? 57 : 1;

        // If between long rook and king is not empty or long rook is color not equal player's color or long rook is type not rook then return false
        if(gl_squares[long_rook + 1] != 0 || gl_squares[long_rook + 2] != 0 || gl_squares[long_rook + 3] != 0 || gl_squares[long_rook].color != gl_current_move || gl_squares[long_rook].type != "rook")
            return false;

        // Control check status of every squares between long rook and king
        if(this.isCheck() || this.isCheck(long_rook + 1) || this.isCheck(long_rook + 2) || this.isCheck(long_rook + 3))
            return false;

        return true;
    }

    /**
     * @static
     * Is current player can short castling?
     * @returns {boolean}
     */
    static canShortCastling(){
        if(gl_castling_control[gl_current_move + "-short"] == false)
            return false;

        // Find short rook square_id by player's color
        let short_rook = gl_current_move == "white" ? 64 : 8;

        // If between short rook and king is not empty or short rook is color not equal player's color or short rook is type not rook then return false
        if(gl_squares[short_rook - 1] != 0 || gl_squares[short_rook - 2] != 0 || gl_squares[short_rook].color != gl_current_move || gl_squares[short_rook].type != "rook")
            return false;
        
        // Control check status of every squares between short rook and king
        if(this.isCheck() || this.isCheck(short_rook - 1) || this.isCheck(short_rook - 2))
            return false;

        return true;
    }

    
    /**
     * @static
     * Control castling after move
     * @param {string} moved_piece_type Type of moved piece
     * @param {string} moved_piece_color Color of moved piece
     * @returns {void}
     */
    static changeCastlingStatus(moved_piece_type, moved_piece_color){
        // If king is moved then disable short and long castling
        if(moved_piece_type == "king"){
            gl_castling_control[gl_current_move + "-short"] = false;
            gl_castling_control[gl_current_move + "-long"] = false;
        }
        else if(moved_piece_type == "rook"){
            if(moved_piece_color == "white"){
                // If short rook(id=64) moved then disable white sort castling
                if(gl_squares[64] == 0 || gl_squares[64].color != "white" || gl_squares[64].type != "rook") 
                    gl_castling_control["white-short"] = false;
                // If long rook(id=57) moved then disable white long castling
                if(gl_squares[57] == 0 || gl_squares[57].color != "white" || gl_squares[57].type != "rook")
                    gl_castling_control["white-long"] = false;
            }else{
                // If short rook(id=8) moved then disable black short castling
                if(gl_squares[8] == 0 || gl_squares[8].color != "black" || gl_squares[8].type != "rook") 
                    gl_castling_control["black-short"] = false;
                // If long rook(id=1) moved then disable black long castling
                if(gl_squares[1] == 0 || gl_squares[1].color != "black" || gl_squares[1].type != "rook")
                    gl_castling_control["black-long"] = false;
            }
        }
    }
}