class MoveEngine{
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
        return Converter.jsonPathToArrayPath((this.#filterPlayableSquares(square_id, PathEngine.calcBishopPath(square_id))));
    }

    /**
     * @private
     * Calculate Rook Playable Squares/Path
     * @param {int} square_id Square ID of the rook
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfRook(square_id) {
        /*
        TODO: Castling with rook
        let playable_squares = Converter.jsonPathToArrayPath(this.#filterPlayableSquares(square_id, PathEngine.calcRookPath(square_id)));

        // Add Castling
        if((GameManager.isShortCastlingAvailable() && square_id == 64 || square_id == 8) || (GameManager.isLongCastlingAvailable() && square_id == 57 || square_id == 1))
            playable_squares.push(Global.getCurrentMove() == Color.White ? 61 : 5);
        
        return playable_squares;
        */

        return Converter.jsonPathToArrayPath(this.#filterPlayableSquares(square_id, PathEngine.calcRookPath(square_id)));
    }

    /**
     * @private
     * Calculate Queen Playable Squares/Path
     * @param {int} square_id Square ID of the queen
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfQueen(square_id) {
        return Converter.jsonPathToArrayPath(this.#filterPlayableSquares(square_id, PathEngine.calcQueenPath(square_id)));
    }

    /**
     * @private
     * Calculate King Playable Squares/Path
     * @param {int} square_id Square ID of the king
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKing(square_id) {
        let playable_squares = [];
        let squares = Converter.jsonPathToArrayPath(PathEngine.calcKingPath(square_id));

        squares.forEach(square => {
            if(!GameManager.isCheck(square))
                playable_squares.push(square);
        });

        // Add Castling
        if(GameManager.isShortCastlingAvailable())
            playable_squares.push(Global.getCurrentMove() === Color.White ? 64 : 8);
        if(GameManager.isLongCastlingAvailable())
            playable_squares.push(Global.getCurrentMove() === Color.White ? 57 : 1);  

        return playable_squares;
    }

    /**
     * @private
     * Calculate Pawn Playable Squares/Path
     * @param {int} square_id Square ID of the pawn
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfPawn(square_id) {
        let canEnPassant = false;
        let piece = BoardManager.getPieceBySquareId(square_id);
        let playable_squares = this.#filterPlayableSquares(square_id, PathEngine.calcPawnPath(square_id));

        // Add En Passant
        if(GameManager.canPawnDoLeftEnPassant(square_id)){
            playable_squares.push(piece.color == Color.White ? square_id - 9 : square_id + 7);
            canEnPassant = true;
        }
        if(GameManager.canPawnDoRightEnPassant(square_id)){
            playable_squares.push(piece.color == Color.White ? square_id - 7 : square_id + 9);
            canEnPassant = true;
        }

        // Add piece to disabled en passant list(For disable en passant after move)
        if(canEnPassant)
            Global.addDisabledEnPassant(piece.id);


        return playable_squares;
    }

    /**
     * @private
     * Calculate Knight Playable Squares/Path
     * @param {int} square_id Square ID of the knight
     * @returns {Array<int>}
     */
    #getPlayableSquaresOfKnight(square_id) {
        return this.#filterPlayableSquares(square_id, PathEngine.calcKnightPath(square_id));
    }

    /**
     * @private
     * Get playable path to not to be check/avoid endangering the king
     * @param {int} square_id Square ID of current piece
     * @param {(JSON|Array<int>)} playable_squares Playable Squares of Target Piece
     * @returns {Array<int>}
     */
    #filterPlayableSquares(square_id, playable_squares = null) {
        let king = Storage.get(Global.getCurrentMove() + "-king");
        if(!king)
            return playable_squares;
            
        // get diagonal, row and column with calcqueenpath method
        let routes = PathEngine.calcQueenPath(square_id);
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
                enemy_types = [PieceType.Queen, PieceType.Bishop];
            }
            else if (i == Route.TopLeft && control - 9 == king || i == Route.BottomRight && control + 9 == king) {
                // king in top-right or bottom-left then playable paths are top-left and bottom-right
                king_guard_route = [Route.TopLeft, Route.BottomRight];
                // dangerous enemies are queen and bishop
                enemy_types = [PieceType.Queen, PieceType.Bishop];
            }
            else if (i == Route.Top && control - 8 == king || i == Route.Bottom && control + 8 == king) {
                // king in top or bottom then playable paths are top and bottom
                king_guard_route = [Route.Top, Route.Bottom];
                // dangerous enemies rook and queen
                enemy_types = [PieceType.Rook, PieceType.Queen];
            }
            else if (i == Route.Left && control - 1 == king || i == Route.Right && control + 1 == king) {
                // king in left or right then playable paths are left and right
                king_guard_route = [Route.Left, Route.Right];
                // dangerous enemies rook and queen
                enemy_types = [PieceType.Rook, PieceType.Queen];
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
            case PieceType.Rook:
                return this.#getPlayableSquaresOfRook(square_id);
            case PieceType.Bishop:
                return this.#getPlayableSquaresOfBishop(square_id);
            case PieceType.Pawn:
                return this.#getPlayableSquaresOfPawn(square_id);
            case PieceType.King:
                return this.#getPlayableSquaresOfKing(square_id);
            case PieceType.Queen:
                return this.#getPlayableSquaresOfQueen(square_id);
            case PieceType.Knight:
                return this.#getPlayableSquaresOfKnight(square_id);
            default:
                break;
        }
    }
}