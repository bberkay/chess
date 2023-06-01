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
    startCustomGame(pieces = null) {
        this.board.createBoard();
        if(pieces){
            pieces.forEach(item => {
                this.board.createPiece(item["color"], item["piece"], item["square"]);
            });
        }
    }

    /**
     * Create Piece
     * @returns {void}
     */
    createPiece(color, piece_type, target_square_id){
        this.board.createPiece(color, piece_type, target_square_id);
    }

    /**
     * Get Clicked Square
     * @param {int} square_id Square ID of the clicked square
     * @returns {void}
     */
    clickSquare(square_id) {
        let clicked_square = GameController.getPieceBySquareID(square_id);
        let is_castling_move = this.#isCastlingMove(clicked_square);

        // Select - unselect piece
        if(clicked_square && clicked_square.color == gl_current_move && !is_castling_move){
            if(clicked_square === this.selected_piece)
                this.#unselectPiece();
            else
                this.#selectPiece(clicked_square)
        }
        // Move Piece, Control Castling
        else if(this.selected_piece && this.playable_squares.includes(square_id)){
            if(is_castling_move) // Control is castling move
                this.#castling(square_id);
            else{
                this.#movePiece(square_id); // Move piece and control check then end turn

                // If moved piece king or rook then change castling status
                GameStatus.changeCastlingStatus(this.selected_piece.type, this.selected_piece.color);
            }

            // If moved piece is king then clear checked effect(is checked or not)
            if(this.selected_piece.type == "king"){
                this.board.clearCheckedEffect();
            }
            
            // End turn and control check then clear current selected piece
            this.#endTurn();
            this.#controlCheck();
            this.#unselectPiece();
        }
        // Clear board
        else if(!clicked_square){
            this.board.refreshBoard();
            if(this.selected_piece)
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
     * Destroy piece by square id
     * @param {int} square_id 
     * @returns {void}
     */
    destroyPiece(square_id){
        this.board.destroyPiece(square_id);
    }

    /**
     * @private
     * Castling
     * @param {int} square_id Square ID of rook
     * @returns {void}
     */
    #castling(square_id){
        // If first click is rook and second click is king 
        if(square_id == 61 || square_id == 5)
            square_id = GameController.getSquareIDByPiece(this.selected_piece) 

        let castling_type = square_id % 8 == 0 ? "short" : "long";
        let player_king = GameController.getPlayerKing();
        if(castling_type == "short"){ 
            // If castling type short and square id is 64 then for white, else for black(square id is 8)
            if(square_id == 64){
                // White King goes to 59(c1) and white short rook(h1, 64) goes to 62(f1)
                this.#movePiece(63, player_king);
                this.#movePiece(62, GameController.getPieceBySquareID(64));
                gl_castling_control["white-short"] = false;
            }else if(square_id == 8){ 
                // White King goes to 59(c1) and black short rook(h8, 8) goes to 6(f8)
                this.#movePiece(7, player_king);
                this.#movePiece(6, GameController.getPieceBySquareID(8));
                gl_castling_control["black-short"] = false;
            }
        }else{
            // If castling type long and square id is 57 then for white, else for black(square id is 1)
            if(square_id == 57){ 
                // White King goes to 59(c1) and white long rook(a1, 57) goes to 60(d1)
                this.#movePiece(59, player_king);
                this.#movePiece(60, GameController.getPieceBySquareID(57));
                gl_castling_control["white-long"] = false;
            }else if(square_id == 1){
                // Black King goes to 3(c8) and black long rook(a8, 1) goes to 4(d8)
                this.#movePiece(3, player_king);
                this.#movePiece(4, GameController.getPieceBySquareID(1));
                gl_castling_control["black-long"] = false;
            }
        }
    }

    /**
     * @private
     * Is Castling Move?
     * @param {int} clicked_piece Square ID of clicked square
     * @returns {boolean} 
     */
    #isCastlingMove(clicked_piece){
        // If selected piece is king or rook and clicked square is king or rook, but not the same as selected piece, start castling operation
        if(this.selected_piece && ["rook", "king"].includes(this.selected_piece.type) && ["rook", "king"].includes(clicked_piece.type) && this.selected_piece.type != clicked_piece.type){
            return true;
        }
        return false;
    }
    
    /**
     * @private
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
     */ 
    #controlCheck(){
        // If moved piece is king then don't control check
        if(this.selected_piece.type === "king")
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
