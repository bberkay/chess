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

        // Create Board
        this.#board.createBoard();

        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i, 0);   

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
        this.#saveGameToCache();
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

        // Create Board
        this.#board.createBoard();

        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i, 0);

        // Create Pieces
        if(pieces){ 
            pieces.forEach(item => {
                this.createPiece(item["piece"], item["color"],  item["square"]);
            });
        }

        // Add to cache current game
        this.#saveGameToCache();
    }
    
    /**
     * Start Game From Cache
     * @returns {void}
     */
    startGameFromCache(){
        let squares = Cache.get("current-game");

        // Create Board
        this.#board.createBoard();

        // Create Pieces
        for (let i = 1; i < 65; i++){
            let square = squares[i];
            Global.setSquare(i, 0);

            if(square != 0)
                this.createPiece(square.type, square.color, i, square.id);
        }

        // Set Current Move
        Global.setCurrentMove(Cache.get("current-move") || Color.White);

        // Set Move Count
        Global.setMoveCount(Cache.get("move-count") || 0);

        // Set Checked Player
        let checked_player = Cache.get("checked-player");
        if(checked_player){
            Global.setCheckedPlayer(checked_player);            
            this.#board.addEffectToSquare(checked_player == Color.White ? Storage.get("white-king").getSquareId() : Storage.get("black-king").getSquareId(), SquareEffect.Checked);
        }
    }

    /**
     * @private
     * Save Game To Cache
     * @returns {void}
     */
    #saveGameToCache(){
        let squares = Global.getSquares();
        let cacheData = {};

        // Save Current Game
        for (let square in squares) {
            let content = squares[square];
            cacheData[square] = content == 0 ? 0 : { id: content.id, type: content.type, color: content.color };
        }

        Cache.set("current-game", cacheData);
    }

    /**
     * Create Piece
     * @param {string} piece_type Type of the piece
     * @param {string} color Color of the piece
     * @param {int} target_square_id Target square id of the piece
     * @param {int} id ID of the piece
     * @returns {void}
     */
    createPiece(piece_type, color, target_square_id, id=null){
        // FIXME: Bir den fazla şah olamaz. Validate edilecek.

        let piece = new Piece(piece_type, color, target_square_id, id);

        if(piece_type == PieceType.King)
            Storage.set(color + "-king", piece);

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
        let cache_playable_squares = Cache.get("playable_squares");

        // If playable squares not in cache
        if(!cache_playable_squares || cache_playable_squares[this.#selected_piece.id] === undefined){ 
            this.#playable_squares = this.#selected_piece.getPlayableSquares();   

            // Add playable squares to cache
            Cache.add("playable_squares", {[this.#selected_piece.id]:this.#playable_squares});
        }
        // If playable squares in cache
        else{ 
            this.#playable_squares = cache_playable_squares[this.#selected_piece.id];
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
        piece.increaseMoveCount();

        // Refresh board
        this.#board.refreshBoard();

        // If castling move
        if(BoardManager.isSquareHasPiece(target_square_id, Color.White, PieceType.Rook))
            this.#doCastling(target_square_id, BoardManager.getPieceBySquareId(target_square_id));
        // If en passant move
        else if(piece.type == PieceType.Pawn && !BoardManager.getPieceBySquareId(target_square_id) && (target_square_id != piece.getSquareId() + 8 && target_square_id != piece.getSquareId() - 8))
            this.#doEnPassant(target_square_id, piece);

        // Move piece on the board
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
     * @param {Piece} rook Rook piece
     * @returns {void}
     */
    #doCastling(square_id, rook){
        let target_square_id;

        // Find castling type and player's king
        let castling_type = square_id % 8 == 0 ? CastlingType.Short : CastlingType.Long;
        let player_king = Storage.get(Global.getCurrentMove() + "-king");
        
        // Move King(if castling type is short then move king to 1 square to the left of rook else move king to 2 square to the right of rook)
        target_square_id = castling_type == CastlingType.Short ? square_id - 1 : square_id + 2;
        this.#movePiece(target_square_id, player_king);

        // Move Rook(if castling type is short then move rook to 2 square left of himself else move rook to 3 square right of himself)
        target_square_id = castling_type == CastlingType.Short ? square_id - 2 : square_id + 3;
        this.#movePiece(target_square_id, rook);
    }

    /**
     * @private
     * En Passant
     * @param {int} square_id Square id of pawn
     * @param {Piece} pawn Pawn piece
     * @returns {void}
     */
    #doEnPassant(square_id, pawn){
        this.destroyPiece(square_id + (pawn.color === Color.White ? 8 : -8));
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

        // Control castling after move
        //GameManager.controlCastlingAfterMove();     

        // Control check for player
        //this.#controlCheck();
    }
}