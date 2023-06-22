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
        // Clear Cache
        Cache.clear();
        
        // Set Current Move and Count
        Global.setCurrentMove("white");
        Global.setMoveCount(1);

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

        // Add to cache current game
        Cache.set("current-game", Global.getSquares());
    }

    /**
    * Custom Game Creator For Tests
    * @param {Array<JSON>} pieces Custom Pieces
    * @example [{"color":Color.white, "piece":PieceType.pawn, "square":Square.e2}, ...]
    * @returns {void}
    */
    startCustomGame(pieces = null) {
        // Clear Cache
        Cache.clear();

        // Set Current Move and Count
        Global.setCurrentMove("white");
        Global.setMoveCount(1);

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

        // Add to cache current game
        Cache.set("current-game", Global.getSquares());
    }
    
    /**
     * Start Game From Cache
     * @returns {void}
     */
    startGameFromCache(){
        let squares = Cache.get("current-game");

        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i, squares[i]);

        // Create Board
        this.#board.createBoard();

        // Create Pieces
        for (let i = 1; i < 65; i++){
            const temp = squares[i];
            Global.setSquare(i, 0);

            if(squares[i] != 0)
                this.createPiece(temp.type, temp.color, i);
        }

        // Set status
        Global.setCurrentMove(Cache.get("current-move") || Color.White);
        Global.setMoveCount(Cache.get("move-count") || 0);
        let checked_player = Cache.get("checked-player");
        if(checked_player){
            Global.setCheckedPlayer(checked_player);            
            this.#board.addEffectToSquare(checked_player == Color.White ? Storage.get("white-king").getSquareId() : Storage.get("black-king").getSquareId(), SquareEffect.Checked);
        }
        GameManager.controlEnPassantAfterMove();
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
            Storage.set(color + "-king", piece);
        else if(piece_type == PieceType.Pawn)
            Global.addEnPassant(piece.id, EnPassantStatus.NotReady);

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
                this.#changeTurn();
                break;
            case SquareClickMode.Castling:
                this.#castling(square_id);
                this.#changeTurn();
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
        if(piece.color != Global.getCurrentMove())
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
        
        // Add selected effect to selected piece
        this.#board.addEffectToSquare(this.#selected_piece.getSquareId(), SquareEffect.Selected);

        // Get playable squares of selected piece 
        if(!Cache.find("playable_squares", this.#selected_piece.id)){ // If playable squares not in cache
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
    #movePiece(target_square_id, piece=null){
        piece = piece == null ? this.#selected_piece : piece;
        
        if(piece.type == PieceType.Rook || piece.type == PieceType.King)
            piece.is_moved = true;

        // Refresh board
        this.#board.refreshBoard();

        // If castling move
        if(BoardManager.isSquareHasPiece(target_square_id, Color.White, [PieceType.Rook]))
            this.#castling(target_square_id);
        else{
            this.#board.movePieceOnBoard(piece, target_square_id);

            // Move Piece To Target Position 
            const old_square_id = piece.getSquareId();
            Global.setSquare(target_square_id, piece);
            Global.setSquare(old_square_id, 0);        
        }
    }

    /**
     * @private
     * Destroy piece by square id
     * @param {int} square_id 
     * @returns {void}
     */
    destroyPiece(square_id){
        // Remove Piece From Global Squares
        Global.setSquare(square_id, 0);

        // Remove Piece From Board
        this.#board.destroyPieceOnBoard(square_id);
    }

    /**
     * @private
     * Castling
     * @param {int} square_id Square id of rook
     * @returns {void}
     */
    #castling(square_id){
        let target_square_id;

        // Find castling type and player's king
        let castling_type = square_id % 8 == 0 ? CastlingType.Short : CastlingType.Long;
        let player_king = Storage.get(Global.getCurrentMove() + "-king");
        
        // Move King(if castling type is short then move king to 1 square to the left of rook else move king to 2 square to the right of rook)
        target_square_id = castling_type == CastlingType.Short ? square_id - 1 : square_id + 2;
        this.#movePiece(target_square_id, player_king);

        // Move Rook(if castling type is short then move rook to 2 square left of himself else move rook to 3 square right of himself)
        target_square_id = castling_type == CastlingType.Short ? square_id - 2 : square_id + 3;
        this.#movePiece(target_square_id, BoardManager.getPieceBySquareId(square_id));
    }

    /**
     * @private
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
    */ 
    #controlCheck(){
        // If moved piece is king then don't control check
        if(Storage.get("last-moved-piece").type === PieceType.King){
            Global.setCheckedPlayer(null); // set checked status to null
            this.#board.removeEffectOfAllSquares(SquareEffect.Checked); 
            return;
        }

        // Set checked player and give effect the checked king
        if(GameManager.isCheck()){
            Global.setCheckedPlayer(Global.getCurrentMove());
            this.#board.addEffectToSquare(Storage.get(Global.getCurrentMove() + "-king").getSquareId(), SquareEffect.Checked);
        }else{
            Global.setCheckedPlayer(null);
            this.#board.removeEffectOfAllSquares(SquareEffect.Checked); 
        }
    }

    /**
     * @private
     * End turn step by step: Control en passant, control castling, control check, clear current select, clear playable squares from cache, set next move, increase move count
     * @returns {void}
     */
    #changeTurn() {
        // Update current game in cache
        Cache.set("current-game", Global.getSquares());

        // Set last moved piece
        Storage.set("last-moved-piece", this.#selected_piece);

        // Clear current select
        this.#clearSelect();

        // Clear playable_squares from cache
        Cache.clear("playable_squares");

        // Set New Turn(change current player)
        Global.setNextMove();

        // Increase Move Count
        Global.increaseMoveCount();

        // Control en passant after move
        GameManager.controlEnPassantAfterMove();

        // Control castling after move
        //GameManager.controlCastlingAfterMove();     

        // Control check for player
        //this.#controlCheck();
    }
}