class Chess{
    #board; // Board
    #playable_squares; // Playable squares of the clicked piece
    #selected_piece; // Selected piece

    /**
     * @constructor
     */
    constructor() {
        if (!Chess.instance){
            this.#board = new Board();
            this.#playable_squares = [];
            this.#selected_piece = null;

            // Singleton instance
            Chess.instance = this;    
        }

        return Chess.instance;
    }

    /**
    * Start Game
    * @returns {void}
    */
    startStandartGame() {
        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i, 0);

        // Create Board
        this.#board.createBoard();

        // Create Pieces
        for (let i = 1; i <= 32; i++) {
            let square_id = i <= 16 ? i : i + 32; // Position of the piece on the board

            if (square_id == 1 || square_id == 8 || square_id == 57 || square_id == 64) // Rook
                this.createPiece(PieceType.Rook, square_id < 57 ? Color.Black : Color.White, square_id);
            else if (square_id == 2 || square_id == 7 || square_id == 58 || square_id == 63) // Knight
                this.createPiece(PieceType.Knight, square_id < 58 ? Color.Black : Color.White, square_id);
            else if (square_id == 3 || square_id == 6 || square_id == 59 || square_id == 62)// Bishop
                this.createPiece(PieceType.Bishop, square_id < 58 ? Color.Black : Color.White, square_id);
            else if (square_id == 4 || square_id == 60) // Queen 
                this.createPiece(PieceType.Queen, square_id < 60 ? Color.Black : Color.White, square_id);
            else if (square_id == 5 || square_id == 61) // King
                this.createPiece(PieceType.King, square_id < 61 ? Color.Black : Color.White, square_id);            
            else if (square_id >= 9 && square_id < 17 || square_id > 48 && square_id < 57) // Pawn 
                this.createPiece(PieceType.Pawn, square_id < 48 ? Color.Black : Color.White, square_id);
        }
    }

    /**
    * Custom Game Creator For Tests
    * @param {Array<JSON>} pieces Custom Pieces
    * @example [{"color":Color.white, "piece":PieceType.pawn, "square":Square.e2}, ...]
    * @returns {void}
    */
    startCustomGame(pieces = null) {
        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i, 0);

        // Create Board
        this.#board.createBoard();

        // Create Pieces
        if(pieces){ 
            pieces.forEach(item => {
                this.createPiece(item["piece"], item["color"],  item["square"]);
            });
        }
    }
    
    /**
     * Create Piece
     * @param {string} piece_type Type of the piece
     * @param {string} color Color of the piece
     * @param {int} target_square_id Target square id of the piece
     * @returns {void}
     */
    createPiece(piece_type, color, target_square_id){
        // FIXME: Bir den fazla şah olamaz. Validate edilecek.

        let piece = new Piece(piece_type, color, target_square_id);
        if(piece_type == PieceType.King)
            Cache.set(color + "-king", piece);

        // Create piece on board
        this.#board.createPieceOnBoard(piece, target_square_id);
    }

    /**
     * @public
     * Make move
     * @param {int} square_id Square ID of the clicked square
     * @param {SquareClickMode} move_type Move Type
     * @returns {void}
     */
    makeMove(square_id, move_type){
        // Make move according to move type
        switch(move_type){
            case SquareClickMode.ClickSquare:
                this.#clearSelect();
                break;
            case SquareClickMode.SelectPiece:
                this.#selectPiece(BoardManager.getPieceBySquareId(square_id));
                break;
            case SquareClickMode.MovePiece:
                this.#movePiece(square_id);
                this.#endTurn();
                break;
            case SquareClickMode.Castling:
                this.#castling(square_id);
                this.#endTurn();
                break;
            default:
                break;
        }
    }

    /**
     * @private
     * Select Piece
     * @param {Piece} piece
     * @returns {void}
    */
    #selectPiece(piece){
        // If selected piece is not current move's piece or player is checked and selected piece is not king then return
        if(piece.color != Global.getCurrentMove() || Global.getCheckedPlayer() == Global.getCurrentMove() && piece.type !== "king")
            return;

        // If clicked piece is selected piece then unselect piece
        if(this.#selected_piece == piece){
            this.#clearSelect();
            return;
        }

        // Clear board
        this.#board.refreshBoard();

        // Set selected piece
        this.#selected_piece = piece;
        
        // If selected piece is king then control castling
        if(this.#selected_piece.type === PieceType.King || this.#selected_piece.type === PieceType.Rook){
            if(GameManager.isShortCastlingAvailable()){
                if(this.#selected_piece.type === PieceType.King)
                    this.#board.changeSquareClickMode(this.#selected_piece.color === Color.White ? 8 : 64, SquareClickMode.Castling); // Change square click mode for castling
                else
                    this.#board.changeSquareClickMode(this.#selected_piece.color === Color.White ? 5 : 61, SquareClickMode.Castling); // Change square click mode for castling
            }
            if(GameManager.isLongCastlingAvailable()){  
                if(this.#selected_piece.type === PieceType.King)
                    this.#board.changeSquareClickMode(this.#selected_piece.color === Color.White ? 1 : 57, SquareClickMode.Castling); // Change square click mode for castling
                else
                    this.#board.changeSquareClickMode(this.#selected_piece.color === Color.White ? 5 : 61, SquareClickMode.Castling); // Change square click mode for castling
            }
        }
        
        this.#board.addEffectToSquare(this.#selected_piece.getSquareId(), SquareEffect.Selected);

        // Get playable squares of selected piece 
        if(!Cache.get(this.#selected_piece.id)){ // If playable squares not in cache
            this.#playable_squares = this.#selected_piece.getPlayableSquares();   

            // Add playable squares to cache
            Cache.add("playable_squares", {[this.#selected_piece.id]:this.#playable_squares});
        }
        else{ // If playable squares in cache
            this.#playable_squares = Cache.get("playable_squares")[this.#selected_piece.id];
        } 
        
        // Show playable squares of selected piece
        this.#board.showPlayableSquaresOnBoard(this.#playable_squares);
    }

    /**
     * @private
     * Clear selected piece
     * @returns {void}
     */
    #clearSelect(){
        this.#board.refreshBoard();
        this.#selected_piece = null;
        this.#playable_squares = [];
    }

    /**
     * @private
     * Move piece to playable square
     * @param {int} target_square_id Square ID of the Target Square that piece will be moved
     * @param {Piece} piece Optional piece information(default selected piece)
     * @returns {void}
     */
    #movePiece(target_square_id, _piece=null){
        let piece = _piece == null ? this.#selected_piece : _piece;
        
        // Move Piece On Board
        this.#board.refreshBoard();
        this.#board.movePieceOnBoard(piece, target_square_id);

        // Move Piece To Target Position 
        const old_square_id = piece.getSquareId();
        Global.setSquare(target_square_id, piece);
        Global.setSquare(old_square_id, 0);        
    }

    /**
     * @private
     * Destroy piece by square id
     * @param {int} square_id 
     * @returns {void}
     */
    #destroyPiece(square_id){
        // Remove Piece From Global Squares
        Global.setSquare(square_id, 0);

        // Remove Piece From Board
        this.#board.destroyPieceOnBoard(square_id);
    }

    /**
     * @private
     * Castling
     * @param {int} square_id Square ID of rook
     * @returns {void}
     */
    #castling(square_id){
        let castling_type = square_id % 8 == 0 ? CastlingPieceType.Short : CastlingPieceType.Long;
        let player_king = BoardManager.getPlayerKing();
        if(castling_type == CastlingPieceType.Short){ 
            // If castling type short and square id is 64 then for white, else for black(square id is 8)
            if(square_id == 64){
                // White King goes to 59(c1) and white short rook(h1, 64) goes to 62(f1)
                this.#movePiece(63, player_king);
                this.#movePiece(62, BoardManager.getPieceBySquareID(64));
                Global.setCastling(CastlingPieceType.WhiteShort, false);
            }else if(square_id == 8){ 
                // White King goes to 59(c1) and black short rook(h8, 8) goes to 6(f8)
                this.#movePiece(7, player_king);
                this.#movePiece(6, BoardManager.getPieceBySquareID(8));
                Global.setCastling(CastlingPieceType.BlackShort, false);
            }
        }else{
            // If castling type long and square id is 57 then for white, else for black(square id is 1)
            if(square_id == 57){ 
                // White King goes to 59(c1) and white long rook(a1, 57) goes to 60(d1)
                this.#movePiece(59, player_king);
                this.#movePiece(60, BoardManager.getPieceBySquareID(57));
                Global.setCastling(CastlingPieceType.WhiteLong, false);
            }else if(square_id == 1){
                // Black King goes to 3(c8) and black long rook(a8, 1) goes to 4(d8)
                this.#movePiece(3, player_king);
                this.#movePiece(4, BoardManager.getPieceBySquareID(1));
                Global.setCastling(CastlingPieceType.BlackLong, false);
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
        if(this.#selected_piece.type === PieceType.King){
            this.#board.removeEffectOfSquare(this.#selected_piece.getSquareId(), SquareEffect.Checked); 
            Global.setCheckedPlayer(null); // set checked status to null
            return;
        }
            
        const player_king = Cache.get(Global.getCurrentMove() + "-king")[0]; // Get king of current player

        // Set checked player and give effect the checked king
        if(GameManager.isCheck()){
            Global.setCheckedPlayer(player_king.color);
            this.#board.addEffectToSquare(player_king.getSquareId(), SquareEffect.Checked);
        }
    }
    
    /**
     * @private
     * End turn step by step: Control en passant, set next move, increase move count, control check and clear current select, clear playable squares from the cache
     * @returns {void}
     */
    #endTurn() {
        // Control en passant
        GameManager.isEnPassantAvailable();

        // Control castling
        GameManager.isCastlingAvailable();

        // Set New Turn 
        Global.setNextMove();

        // Increase Move Count
        Global.increaseMoveCount();

        // Control check
        this.#controlCheck();

        // Clear current select
        this.#clearSelect();

        // Clear playable_squares from cache
        Cache.clear("playable_squares");
    }
}
