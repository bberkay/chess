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
        // Is player click any piece
        let square_piece_control;
        let square_playable_control = this.playable_squares.includes(square_id);
        if(gl_checked_player === gl_current_move)
            square_piece_control = GameController.isSquareHasPiece(square_id, gl_current_move === "white" ? "white" : "black", ["king"]);
        else
            square_piece_control = GameController.isSquareHasPiece(square_id);

        if(!this.selected_piece){
            // If clicked square has piece and selected_piece is null then operation is select piece
            this.#selectPiece(square_id);
        }
        else if(square_piece_control && this.selected_piece && GameController.getPieceBySquareID(square_id).color == gl_current_move){
            let clicked_piece = GameController.getPieceBySquareID(square_id);
            if(clicked_piece.color == gl_current_move && clicked_piece != this.selected_piece){
                // If player select another piece after select piece then unselect first selected piece and select new selected piece.
                this.#unselectPiece();
                this.#selectPiece(square_id);
            }else{
                // If clicked piece is already selected then unselect piece
                this.board.refreshBoard();
                this.#unselectPiece();
            }
        }
        else if(square_playable_control){
            // If clicked square has no piece but is playable then move
            this.#movePiece(square_id);
            this.board.refreshBoard();
            // If moved piece is king then clear checked effect(is checked or not)
            if(this.selected_piece.type == "king")
                this.board.clearCheckedEffect();
            this.#endTurn();
            // If moved piece is king then don't control check
            if(this.selected_piece.type !== "king")
                this.#controlCheck();
            this.#unselectPiece();
        }
        else{
            // If clicked piece is already selected then unselect piece
            this.board.refreshBoard();
            this.#unselectPiece();
        }
    }

    /**
    * @private
     * Select Piece
     * @param {int} square_id
     * @returns {void}
    */
    #selectPiece(square_id){
        let piece = GameController.getPieceBySquareID(square_id);       

        // Select Piece
        //if(gl_current_move === piece.color){
        if(gl_current_move){
            // If player is checked then player only select king 
            if(gl_checked_player === gl_current_move && piece.type !== "king")
                this.selected_piece = null;
            else{
                this.selected_piece = piece;
                this.board.setSelectedEffect(this.selected_piece);
            }
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
        this.selected_piece = null;
        this.playable_squares = [];
    }

    /**
     * @private
     * Move piece to playable square
     * @param {int} square_id Square ID of the Target Square to move
     * @returns {void}
     */
    #movePiece(square_id){
        this.board.clearSelectedEffect(this.selected_piece);
        this.board.movePiece(this.selected_piece, square_id);
    }

    /**
     * @private
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
     */ 
    #controlCheck(){
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
