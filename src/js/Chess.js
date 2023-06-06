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
    startStandartGame() {
        for (let i = 1; i <= 32; i++) {
            let square_id = i <= 16 ? i : i + 32; // Position of the piece on the board

            if (square_id == 1 || square_id == 8 || square_id == 57 || square_id == 64) // Rook
                this.createPiece(Type.Rook, square_id < 57 ? Color.White : Color.Black, square_id);
            else if (square_id == 2 || square_id == 7 || square_id == 58 || square_id == 63) // Knight
                this.createPiece(Type.Knight, square_id < 58 ? Color.White : Color.Black, square_id);
            else if (square_id == 3 || square_id == 6 || square_id == 59 || square_id == 62)// Bishop
                this.createPiece(Type.Bishop, square_id < 58 ? Color.White : Color.Black, square_id);
            else if (square_id == 4 || square_id == 60) // Queen 
                this.createPiece(Type.Queen, square_id < 60 ? Color.White : Color.Black, square_id);
            else if (square_id == 5 || square_id == 61) // King
                this.createPiece(Type.King, square_id < 61 ? Color.White : Color.Black, square_id);            
            else if (square_id >= 9 && square_id < 17 || square_id > 48 && square_id < 57) // Pawn 
                this.createPiece(Type.Pawn, square_id < 48 ? Color.White : Color.Black, square_id);
        }
        this.board.setupBoard();
    }

    /**
    * Custom Game Creator For Tests
    * @param {Array<JSON>} pieces Custom Pieces
    * @example [{"color":Color.white, "piece":Type.pawn, "square":Square.e2}, ...]
    * @returns {void}
    */
    startCustomGame(pieces = null) {
        if(pieces){ 
            pieces.forEach(item => {
                this.createPiece(item["piece"], item["color"],  item["square"]);
            });
        }
        this.board.setupBoard();
    }

    /**
     * Create Piece
     * @param {string} piece_type Type of the piece
     * @param {string} color Color of the piece
     * @param {int} target_square_id Target square id of the piece
     * @returns {void}
     */
    createPiece(piece_type, color, target_square_id){
        new Piece(piece_type, color, target_square_id);
    }

    /**
     * Define Player's Move
     * @param {int} square_id Square ID of the clicked square
     * @returns {void}
     */
    defineMove(square_id) {
        let clicked_square = BoardManager.getPieceBySquareID(square_id);
        let is_castling_move = this.#isCastlingMove(clicked_square);

        // Select - unselect piece
        if(clicked_square && clicked_square.color == Global.getCurrentMove() && !is_castling_move){
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
                GameManager.changeCastlingStatus(this.selected_piece.type, this.selected_piece.color);
            }

            // End turn and control check then clear current selected piece
            this.#controlEnPassant();
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
        if(Global.getCheckedPlayer() === Global.getCurrentMove() && piece.type !== "king")
            this.selected_piece = null;
        else{
            this.selected_piece = piece;
            this.board.setSelectedEffect(this.selected_piece);
        }
        
        // Show Playable Squares
        if(this.selected_piece){
            this.board.refreshBoard();

            // Get playable squares of selected piece
            this.playable_squares = this.selected_piece.getPlayableSquares();   

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
    #movePiece(square_id, _piece=null){
        let piece = _piece == null ? this.selected_piece : _piece;
        
        // Move Piece To Target Position 
        const old_square_id = piece.getSquareID();
        BoardManager.setSquare(square_id, piece);
        BoardManager.setSquare(old_square_id, 0);

        // Move Piece On Board
        this.board.clearSelectedEffect(piece);
        this.board.refreshBoard();
        this.board.movePieceOnBoard(square_id, piece);
    }

    /**
     * @private
     * Destroy piece by square id
     * @param {int} square_id 
     * @returns {void}
     */
    destroyPiece(square_id){
        BoardManager.setSquare(square_id, 0);
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
            square_id = BoardManager.getSquareIDByPiece(this.selected_piece) 

        let castling_type = square_id % 8 == 0 ? "short" : "long";
        let player_king = BoardManager.getPlayerKing();
        if(castling_type == "short"){ 
            // If castling type short and square id is 64 then for white, else for black(square id is 8)
            if(square_id == 64){
                // White King goes to 59(c1) and white short rook(h1, 64) goes to 62(f1)
                this.#movePiece(63, player_king);
                this.#movePiece(62, BoardManager.getPieceBySquareID(64));
                Global.setCastling("white-short", false);
            }else if(square_id == 8){ 
                // White King goes to 59(c1) and black short rook(h8, 8) goes to 6(f8)
                this.#movePiece(7, player_king);
                this.#movePiece(6, BoardManager.getPieceBySquareID(8));
                Global.setCastling("black-short", false);
            }
        }else{
            // If castling type long and square id is 57 then for white, else for black(square id is 1)
            if(square_id == 57){ 
                // White King goes to 59(c1) and white long rook(a1, 57) goes to 60(d1)
                this.#movePiece(59, player_king);
                this.#movePiece(60, BoardManager.getPieceBySquareID(57));
                Global.setCastling("white-long", false);
            }else if(square_id == 1){
                // Black King goes to 3(c8) and black long rook(a8, 1) goes to 4(d8)
                this.#movePiece(3, player_king);
                this.#movePiece(4, BoardManager.getPieceBySquareID(1));
                Global.setCastling("black-long", false);
            }
        }
    }
    
    /**
     * @private
     * Control En Passant
     * @returns {void}
     */
    #controlEnPassant(){
        // find all pawns
        let pawns = BoardManager.getActivePiecesWithFilter("pawn", Global.getCurrentMove());
        for(let pawn of pawns){
            // find square id of pawn
            let square_id = BoardManager.getSquareIDByPiece(pawn);
            // if pawn is white and row number is 4 then pawn can do en passant, if pawn is black and row number is 5 then pawn can do en passant
            if(pawn.color == "white" && 40 >= parseInt(square_id) && parseInt(square_id) >= 33 || pawn.color == "black" && 32 >= parseInt(square_id) && parseInt(square_id) >= 25)
                gl_en_passant_control[pawn.id] = true;
            else if(gl_en_passant_control[pawn.id] == true || gl_en_passant_control[pawn.id] == false) // if pawn can do en passant already then can't do anymore or has already false then continue its status
                gl_en_passant_control[pawn.id] = false;
            else// if pawn is white and has not yet reached row number 4 then not-ready, if pawn is black and has not reached yet row number 5 then not-ready
                gl_en_passant_control[pawn.id] = "not-ready";
        }
    }

    /**
     * @private
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
     */ 
    #controlCheck(){
        // If moved piece is king then don't control check
        if(this.selected_piece.type === "king"){
            this.board.clearCheckedEffect();
            gl_checked_player = null; // set checked status to null
            return;
        }
            
        const player_king = BoardManager.getPlayerKing();

        // Set checked player and give effect the checked king
        if(GameManager.isCheck()){
            gl_checked_player = player_king.color;
            this.board.setCheckedEffect();
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
        if(this.selected_piece && ["rook", "king"].includes(this.selected_piece.type) && ["rook", "king"].includes(clicked_piece.type) && this.selected_piece.type != clicked_piece.type)
            return true;
        
        return false;
    }
    
    /**
     * @private
     * Change Current Move and Increase Move Count
     * @returns {void}
     */
    #endTurn() {
        // Set New Turn 
        Global.setNextMove();

        // Increase Move Count
        Global.increaseMoveCount();
    }

}
