class Chess{
    /**
     * @constructor
     */
    constructor() {
        this.board = new Board();
        this.playable_squares = [];
        this.selected_piece = null;
    }

    /**
    * Start Game
    * @returns {void}
    */
    startGame() {
        this.board.createBoard();
        this.board.createPiecesAtStartPosition();
    }

    /**
    * Custom Game Creator For Tests
    * @param {Array<JSON>} pieces Custom Pieces
    * @example [{"color":Color.white, "piece":Type.pawn, "square":Square.e2}, ...]
    * @returns {void}
    */
    startCustomGame(pieces) {
        this.board.createBoard();
        pieces.forEach(item => {
            this.board.createPiece(item["color"], item["piece"], item["square"]);
        });
    }

    /**
     * Get Clicked Square
     * @param {int} square_id Square ID of the clicked square
     * @returns {void}
     */
    clickSquare(square_id) {
        let clicked_square = GameController.getPieceBySquareID(square_id);

        // Select - unselect piece and control short-long rook
        if(clicked_square && clicked_square.color == gl_current_move){
            if(clicked_square === this.selected_piece)
                this.#unselectPiece();
            else{
                // If selected piece is king or rook and clicked square is king or rook, but not the same as selected piece, start castling operation
                if(this.selected_piece && ["rook", "king"].includes(this.selected_piece.type) && ["rook", "king"].includes(clicked_square.type) && this.selected_piece.type != clicked_square.type)
                    this.#castling(GameController.getSquareIDByPiece(clicked_square.type == "rook" ? clicked_square : this.selected_piece));
                else
                    this.#selectPiece(clicked_square)
            }
        }
        // Move piece and control check then end turn
        else if(this.selected_piece && this.playable_squares.includes(square_id)){
            this.#movePiece(square_id);

            // If moved piece is king then clear checked effect(is checked or not)
            if(this.selected_piece.type == "king")
                this.board.clearCheckedEffect();
            
            // End turn and control check then clear current selected piece
            this.#endTurn();
            this.#controlCheck();
            this.#unselectPiece();
        }
        // Clear board
        else if(!clicked_square){
            this.board.refreshBoard();
            this.#unselectPiece();
        }

    }

    /**
     * @private
     * Select Piece
     * @param {Piece} piece
     * @returns {void}
    */
    #selectPiece(piece){
        // Unselect the previous selected piece.
        if(this.selected_piece)
            this.#unselectPiece();

        // If player is checked then player only select king 
        if(gl_checked_player === gl_current_move && piece.type !== "king")
            this.selected_piece = null;
        else{
            this.selected_piece = piece;
            this.board.setSelectedEffect(this.selected_piece);
        }
        
        // Show Playable Squares
        if(this.selected_piece){
            this.board.refreshBoard();

            // Get playable squares of selected piece
            this.playable_squares = this.selected_piece.getPlayableSquaresOfPiece();   

            if(this.selected_piece.type == "king" || this.selected_piece.type == "rook"){
                let rook_castling = false;
                if(GameStatus.canLongCastling(this.selected_piece)){
                    if(this.selected_piece.type == "king")
                        this.playable_squares.push(gl_current_move === "white" ? 57 : 1);
                    else
                        rook_castling = true;
                }
                if(GameStatus.canShortCastling(this.selected_piece)){
                    if(this.selected_piece.type == "king")
                        this.playable_squares.push(gl_current_move === "white" ? 64 : 8);
                    else
                        rook_castling = true;
                }

                if(rook_castling){
                    this.playable_squares.push(gl_current_move === "white" ? 61 : 5);
                }
            }

            // Show playable squares of selected piece
            this.board.showPlayableSquares(this.playable_squares);
        }

    }

    /**
     * @private
     * Unselect Piece
     * @returns {void}
     */
    #unselectPiece(){
        this.board.clearSelectedEffect(this.selected_piece);
        this.board.refreshBoard();
        this.selected_piece = null;
        this.playable_squares = [];
    }

    /**
     * @private
     * Move piece to playable square
     * @param {int} square_id Square ID of the Target Square to move
     * @param {Piece} piece Optional piece information(default selected piece)
     * @returns {void}
     */
    #movePiece(square_id, piece=null){
        this.board.clearSelectedEffect(piece == null ? this.selected_piece : piece);
        this.board.refreshBoard();
        this.board.movePiece(piece == null ? this.selected_piece : piece, square_id);
    }

    /**
     * @private
     * Castling
     * @param {int} square_id Square ID of rook
     * @returns {void}
     */
    #castling(square_id){
        let castling_type = square_id % 8 == 0 ? "short" : "long";
        if(gl_castling_control[gl_current_move + "-" + castling_type])
            return;
        else{
            let player_king = GameController.getPlayerKing();
            if(castling_type == "short"){ 
                // If castling type short and square id is 64 then for white, else for black(square id is 8)
                if(square_id == 64){
                    // TODO: kral 63 e gidecek ve kale yok olacak.
                }else{ 
                    // TODO: kral 7 ye gidecek ve kale yok olacak.
                }
            }else{
                // If castling type long and square id is 57 then for white, else for black(square id is 1)
                if(square_id == 57){
                    // TODO: kral 59 a gidecek ve kale yok olacak.
                }else{
                    // TODO: kral 3 e gidecek ve kale yok olacak.
                }
            }
        }
    }

    /**
     * @private
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
     */ 
    #controlCheck(){
        // If moved piece is king then don't control check
        if(this.selected_piece.type !== "king")
            return;
            
        const player_king = GameController.getPlayerKing();

        // Set checked player and give effect the checked king
        if(GameStatus.isCheck()){
            gl_checked_player = player_king.color;
            this.board.setCheckedEffect();
        }
    }

    
    /**
     * @private
     * Change Current Move and Increase Move Count
     * @returns {void}
     */
    #endTurn() {
        // Set New Turn 
        if(gl_current_move === "white")
            gl_current_move = "black";
        else if(gl_current_move === "black")
            gl_current_move = "white";

        // Increase Move Count
        gl_move_count++;
    }

}
