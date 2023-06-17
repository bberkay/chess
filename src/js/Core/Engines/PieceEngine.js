class PieceEngine{
    /**
     * Create ID for piece(between 1000 and 9999)
     * @returns {int}
     */
    createPieceId() {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (Global.getIdList().includes(id))
            this.createPieceId();
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
        // FIXME: En passant status testleri bitirildikten sonra aksiyon yapılacak.

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
        let king = Cache.get(Global.getCurrentMove() + "-king");
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
            if (i == Route.TopRight && control - 7 == king || i == Route.BottomLeft && control + 7 == king) {
                // king in top-right or bottom-left then playable paths are top-right and bottom-left
                king_guard_route = [Route.TopRight, Route.BottomLeft];
                // dangerous enemies are queen and bishop
                enemy_types = [Type.Queen, Type.Bishop];
            }
            else if (i == Route.TopLeft && control - 9 == king || i == Route.BottomRight && control + 9 == king) {
                // king in top-right or bottom-left then playable paths are top-left and bottom-right
                king_guard_route = [Route.TopLeft, Route.BottomRight];
                // dangerous enemies are queen and bishop
                enemy_types = [Type.Queen, Type.Bishop];
            }
            else if (i == Route.Top && control - 8 == king || i == Route.Bottom && control + 8 == king) {
                // king in top or bottom then playable paths are top and bottom
                king_guard_route = [Route.Top, Route.Bottom];
                // dangerous enemies rook and queen
                enemy_types = [Type.Rook, Type.Queen];
            }
            else if (i == Route.Left && control - 1 == king || i == Route.Right && control + 1 == king) {
                // king in left or right then playable paths are left and right
                king_guard_route = [Route.Left, Route.Right];
                // dangerous enemies rook and queen
                enemy_types = [Type.Rook, Type.Queen];
            }
        }

        // if correct enemy in king guard route then delete other squares that not in king guard route
        if (king_guard_route.length > 0) {
            king_guard_route.forEach(path => {
                routes[path].filter(item => { // traverse king guard route/playable paths squares
                    if (BoardManager.isSquareHasPiece(item, Global.getEnemyColor(), enemy_types)) { // if target square has any "enemy_types" enemy
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
            case Type.Rook:
                return this.#getPlayableSquaresOfRook(square_id);
            case Type.Bishop:
                return this.#getPlayableSquaresOfBishop(square_id);
            case Type.Pawn:
                return this.#getPlayableSquaresOfPawn(square_id);
            case Type.King:
                return this.#getPlayableSquaresOfKing(square_id);
            case Type.Queen:
                return this.#getPlayableSquaresOfQueen(square_id);
            case Type.Knight:
                return this.#getPlayableSquaresOfKnight(square_id);
            default:
                break;
        }
    }
}