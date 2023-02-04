class Chess {
    /**
     * @constructor
     */
    constructor() {
        this.board = new BoardEngine();
        this.engine = new PieceEngine();
        this.current_piece = null;
        this.current_playable_squares = null;
        this.check_limitation = null;
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
    * @example [{"color":"black", "piece":"pawn", "square":29}, {"color":"white", "piece":"queen", "square":12}]
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
     * @param {Element} square Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    selectSquare(square) {
        let piece;
        if(GameEngine.isSquareHas(square.id)){
            // Control Pieces and Squares for security
            this.board.refreshBoard();
            piece = GameEngine.getPieceBySquareID(parseInt(square.id)); // get clicked piece

            // if player is checked then can't select any piece except king
            if(gl_checked_player == gl_current_move && piece.type != "king")
                piece = null;
        }
        
        // Select Piece Control
        if (piece && this.current_piece != piece && piece.color == gl_current_move) { 
            this.board.refreshBoard();
            this.current_piece = piece;

            // Get playable squares of clicked piece
            this.current_playable_squares = this.current_piece.getPlayableSquaresOfPiece();

            // Show playable squares of clicked piece
            this.board.showPlayableSquares(this.current_playable_squares);
        } else {
            // Piece Move Control
            if (this.current_piece && this.current_piece != piece && this.current_playable_squares.includes(parseInt(square.id)) && this.current_piece != null) {
                // move piece
                this.board.movePieceOnBoard(this.current_piece, square.id);
                this.isCheck();
                this.endTurn();
            } else {
                this.current_piece = null;
                this.board.refreshBoard();
            }
        }
    }

    /**
     * Is enemy player checked after move?
     * @returns {void}
     */
    isCheck(){
        // Get enemy king
        const enemy_king = gl_current_move == "white" ? gl_black_king : gl_white_king;
        const enemy_king_square_id = GameEngine.getSquareIDByPiece(enemy_king);

        // Set checked player and give effect the checked king
        if(this.engine.isSquareUnplayable(enemy_king_square_id)){
            gl_checked_player = enemy_king.color;
            this.board.setEffectOfSquareID(enemy_king_square_id, "checked");
        }
    }

    /**
     * Change Current Move and Increase Move Count
     * @returns {void}
     */
    endTurn() {
        // Clear Table and Selected Piece
        this.board.refreshBoard();
        this.current_piece = null;

        // Set New Turn 
        if(gl_current_move == "white")
            gl_current_move = "black";
        else if(gl_current_move == "black")
            gl_current_move = "white";

        // Increase Move Count
        gl_move_count++;
    }

}
