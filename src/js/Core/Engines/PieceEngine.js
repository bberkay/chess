class PieceEngine{
    /**
     * Create ID for piece(between 1000 and 9999)
     * @returns {int}
     */
    createPieceID() {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (Global.getIdList().includes(id))
            this.createPieceID();
        else
            Global.addIdList(id);

        return id
    }

    /**
     * @private
     * Calculate Bishop Playable Squares/Path
     * @param {int} square_id Square ID of the bishop
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfBishop(square_id) {
        return JSONConverter.jsonPathToArrayPath((this.#filterPlayableSquares(square_id, RouteEngine.calcBishopPath(square_id))));
    }

    /**
     * @private
     * Calculate Rook Playable Squares/Path
     * @param {int} square_id Square ID of the rook
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfRook(square_id) {
        let playable_squares = JSONConverter.jsonPathToArrayPath(this.#filterPlayableSquares(square_id, RouteEngine.calcRookPath(square_id)));

        // Castling
        if(GameManager.canShortCastling())
            playable_squares.push(square_id == 64 || square_id == 57 ? 61 : 5);
        if(GameManager.canLongCastling())
            playable_squares.push(square_id == 64 || square_id == 57 ? 61 : 5);

        return playable_squares;
    }

    /**
     * @private
     * Calculate Queen Playable Squares/Path
     * @param {int} square_id Square ID of the queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen(square_id) {
        return JSONConverter.jsonPathToArrayPath(this.#filterPlayableSquares(square_id, RouteEngine.calcQueenPath(square_id)));
    }

    /**
     * @private
     * Calculate King Playable Squares/Path
     * @param {int} square_id Square ID of the king
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing(square_id) {
        let playable_squares = [];
        let squares = JSONConverter.jsonPathToArrayPath(RouteEngine.calcKingPath(square_id));
        
        let king = BoardManager.getPlayerKing();

        squares.forEach(square => {
            if(!GameManager.isCheck(square))
                playable_squares.push(square);
        });

        // Castling
        if(GameManager.canShortCastling())
            playable_squares.push(king.color == "white" ? 64 : 8);
        if(GameManager.canLongCastling())
            playable_squares.push(king.color == "white" ? 57 : 1);

        return playable_squares;
    }

    /**
     * @private
     * Calculate Pawn Playable Squares/Path
     * @param {int} square_id Square ID of the pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn(square_id) {
        // En Passant
        

        return this.#filterPlayableSquares(square_id, RouteEngine.calcPawnPath(square_id));
    }

    /**
     * @private
     * Calculate Knight Playable Squares/Path
     * @param {int} square_id Square ID of the knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight(square_id) {
        return this.#filterPlayableSquares(square_id, RouteEngine.calcKnightPath(square_id));
    }

    /**
     * @private
     * Get playable path to not to be check/avoid endangering the king
     * @param {int} square_id Square ID of current piece
     * @param {(JSON|Array<int>)} playable_squares Playable Squares of Target Piece
     * @returns {Array<int>}
     */
    #filterPlayableSquares(square_id, playable_squares = null) {
        let king = BoardManager.getPlayerKingSquareID();
        if(!king)
            return playable_squares;
            
        // get diagonal, row and column with calcqueenpath method
        let routes = RouteEngine.calcQueenPath(square_id);
        let king_guard_route = [];
        let enemy_types = [];
        let control = null;
        for (let i in routes) {
            // check last square on the route
            control = routes[i][routes[i].length - 1];

            // if player's king in guardable area
            if (i == "top-right" && control - 7 == king || i == "bottom-left" && control + 7 == king) {
                // king in top-right or bottom-left then playable paths are top-right and bottom-left
                king_guard_route = ["top-right", "bottom-left"];
                // dangerous enemies are queen and bishop
                enemy_types = ["queen", "bishop"];
            }
            else if (i == "top-left" && control - 9 == king || i == "bottom-right" && control + 9 == king) {
                // king in top-right or bottom-left then playable paths are top-left and bottom-right
                king_guard_route = ["top-left", "bottom-right"];
                // dangerous enemies are queen and bishop
                enemy_types = ["queen", "bishop"];
            }
            else if (i == "top" && control - 8 == king || i == "bottom" && control + 8 == king) {
                // king in top or bottom then playable paths are top and bottom
                king_guard_route = ["top", "bottom"];
                // dangerous enemies rook and queen
                enemy_types = ["rook", "queen"];
            }
            else if (i == "left" && control - 1 == king || i == "right" && control + 1 == king) {
                // king in left or right then playable paths are left and right
                king_guard_route = ["left", "right"];
                // dangerous enemies rook and queen
                enemy_types = ["rook", "queen"];
            }
        }

        // if correct enemy in king guard route then delete other squares that not in king guard route
        if (king_guard_route.length > 0) {
            king_guard_route.forEach(path => {
                routes[path].filter(item => { // traverse king guard route/playable paths squares
                    if (BoardManager.isSquareHasPiece(item, BoardManager.getEnemyColor(), enemy_types)) { // if target square has any "enemy_types" enemy
                        if (Array.isArray(playable_squares)) {
                            // if playable squares if array(this control for knight) delete squares that not in king guard squares
                            playable_squares = playable_squares.filter(square => { !king_guard_route.includes(square) })
                        } else {
                            // if playable squares is json(this control for all pieces except pawn and knight) delete squares that not in king guard squares
                            for (let t in playable_squares) {
                                if (!king_guard_route.includes(t)) {
                                    delete playable_squares[t];
                                }
                            }
                        }
                    }
                });
            })
        }

        return playable_squares;
    }

    /**
     * Get playable squares of piece
     * @param {string} piece_type Piece Type
     * @param {int} square_id Square ID of piece
     */
    getPlayableSquaresOfPiece(piece_type, square_id){
        switch (piece_type) {
            case "rook":
                return this.#getPlayableSquaresOfRook(square_id);
            case "bishop":
                return this.#getPlayableSquaresOfBishop(square_id);
            case "pawn":
                return this.#getPlayableSquaresOfPawn(square_id);
            case "king":
                return this.#getPlayableSquaresOfKing(square_id);
            case "queen":
                return this.#getPlayableSquaresOfQueen(square_id);
            case "knight":
                return this.#getPlayableSquaresOfKnight(square_id);
            default:
                break;
        }
    }
}