class Chess{
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
    playPiece(square) {
        // FIXME: Daha OOP hale getirilecek.

        let piece;
        if(GameController.isSquareHasPiece(square.id)){
            piece = GameController.getPieceBySquareID(parseInt(square.id)); // get clicked piece

            // Castling Control
            if(this.current_piece == GameController.getKing({player:true}) && piece.type == "rook" && piece.color == gl_current_move){
                if(gl_castling_control[gl_current_move + "-short"] == null && square.id == 64 || square.id == 8){
                    // TODO: Kısa rok işlemleri
                }else if(gl_castling_control[gl_current_move + "-long"] == null && square.id == 57 || square.id == 1){
                    // TODO: Uzun rok işlemleri
                }
            }
            // Control Pieces and Squares for security
            this.board.refreshBoard();

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
                // Castling limitation is king or rook moved
                if(this.current_piece.type == "king"){
                    gl_castling_control[this.current_piece.color + "-long"] = false;
                    gl_castling_control[this.current_piece.color + "-short"] = false;
                }else if(this.current_piece.type == "rook"){
                    let rook_square_id = GameController.getSquareIDByPiece(this.current_piece);
                    if(rook_square_id == 64 || rook_square_id == 8)
                        gl_castling_control[this.current_piece.color + "-short"] = false;
                    else if(rook_square_id == 57 || rook_square_id == 1)
                        gl_castling_control[this.current_piece.color + "-long"] = false;
                }
                // move piece
                this.board.movePiece(this.current_piece, square.id);

                this.controlCheck();
                this.endTurn();
            } else {
                this.current_piece = null;
                this.board.refreshBoard();
            }
        }
    }

    /**
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
     */
    controlCheck(){
        const enemy_king = GameController.getKing({enemy:true});
        const enemy_king_square_id = GameController.getKingSquareID({enemy:true});

        // Set checked player and give effect the checked king
        if(this.engine.isSquareInDanger(enemy_king_square_id, gl_current_move)){
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
