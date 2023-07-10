class Chess{
    #board; // Board
    #playable_squares; // Playable squares of the clicked piece
    #selected_piece; // Selected piece
    #is_promoting; // Is on promotion
    #is_finished; // Is game finished
    #is_started; // Is game started
    #is_start_screen_opened; // Is start screen opened

    /**
     * @constructor
     */
    constructor() {
        if (!Chess.instance){
            this.#board = new Board();
            this.#playable_squares = [];
            this.#selected_piece = null;
            this.#is_promoting = false;
            this.#is_finished = false;
            this.#is_started = false;
            this.#is_start_screen_opened = false;

            // Singleton instance
            Chess.instance = this;
        }

        return Chess.instance;
    }

    /**
    * Start Game
    * @returns {void}
    */
    startStandardGame() {
        // Clear Cache, Storage and Session
        Cache.clear(CacheLayer.Game);
        Storage.clear();
        Global.reset();

        // Create Board
        this.#board.createBoard();

        // Create squares/backend
        for (let i = 1; i < 65; i++)
            Global.setSquare(i);

        // Find Squares
        const ROOK_SQUARES = [1, 8, 57, 64];
        const KNIGHT_SQUARES = [2, 7, 58, 63];
        const BISHOP_SQUARES = [3, 6, 59, 62];
        const QUEEN_SQUARES = [4, 60];
        const KING_SQUARES = [5, 61];

        // Create Pieces
        for (let i = 1; i <= 32; i++) {
            let square_id = i <= 16 ? i : i + 32; // Position of the piece on the board

            if (ROOK_SQUARES.includes(square_id)) // Rook
                this.createPiece(PieceType.Rook, square_id < 57 ? Color.Black : Color.White, square_id);
            else if (KNIGHT_SQUARES.includes(square_id)) // Knight
                this.createPiece(PieceType.Knight, square_id < 58 ? Color.Black : Color.White, square_id);
            else if (BISHOP_SQUARES.includes(square_id)) // Bishop
                this.createPiece(PieceType.Bishop, square_id < 58 ? Color.Black : Color.White, square_id);
            else if (QUEEN_SQUARES.includes(square_id)) // Queen
                this.createPiece(PieceType.Queen, square_id < 60 ? Color.Black : Color.White, square_id);
            else if (KING_SQUARES.includes(square_id)) // King
                this.createPiece(PieceType.King, square_id < 61 ? Color.Black : Color.White, square_id);
            else if (square_id >= 9 && square_id < 17 || square_id > 48 && square_id < 57) // Pawn, 9-16(1st row), 49-56(8th row)
                this.createPiece(PieceType.Pawn, square_id < 48 ? Color.Black : Color.White, square_id);
        }

        // Start Game
        this.startGame();

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
        // Clear Cache, Storage and Session
        Cache.clear(CacheLayer.Game);
        Storage.clear();
        Global.reset();

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

            // Start Game
            this.startGame();

        }else{
            this.#board.showStartScreen();
            this.#is_start_screen_opened = true;
        }

        // Add to cache current game
        this.#saveGameToCache();
    }

    /**
     * Start Game From Cache
     * @returns {void}
     */
    startGameFromCache(){
        // Clear Storage and session
        Storage.clear();
        Global.reset();

        let squares = Cache.get(CacheLayer.Game, "gl_squares");

        // Create Board
        this.#board.createBoard();

        // Create Pieces
        for (let i = 1; i < 65; i++){
            let square = squares[i];
            Global.setSquare(i, 0);

            if(square !== 0)
                this.createPiece(square.type, square.color, i, square.id);
        }

        // Set Playable Squares
        this.#playable_squares = Cache.get(CacheLayer.Game, "playable_squares") || [];

        // Set Current Move
        Global.setCurrentMove(Cache.get(CacheLayer.Game,"gl_current_move") || Color.White);

        // Set Move Count
        Global.setMoveCount(Cache.get(CacheLayer.Game,"gl_move_count") || 0);

        // Set Checked Player
        let checked_player = Cache.get(CacheLayer.Game,"gl_checked_player");
        if(checked_player){
            Global.setCheckedPlayer(checked_player);
            this.#board.addEffectToSquare(checked_player === Color.White ? Storage.get("white-king").getSquareId() : Storage.get("black-king").getSquareId(), SquareEffect.Checked);
        }

        // Start Game
        this.startGame();
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
            cacheData[square] = content === 0 ? 0 : { id: content.id, type: content.type, color: content.color };
        }

        Cache.set(CacheLayer.Game,"gl_squares", cacheData);
    }

    /**
     * Create Piece
     * @param {string} piece_type Type of the piece
     * @param {string} color Color of the piece
     * @param {int} target_square_id Target square id of the piece
     * @param {int|null} id ID of the piece
     * @returns {void}
     */
    createPiece(piece_type, color, target_square_id, id=null){
        // If piece is king and already created then return
        if(piece_type === PieceType.King){
            if(color === Color.White && Storage.get("white-king")){
                Alert.showAlert(AlertMessage.WhiteKingAlreadyCreated);
                return;
            }
            else if(color === Color.Black && Storage.get("black-king")){
                Alert.showAlert(AlertMessage.BlackKingAlreadyCreated);
                return;
            }
        }

        // Create piece
        let piece = new Piece(piece_type, color, target_square_id, id);

        if(piece_type === PieceType.King)
            Storage.set(color + "-king", piece);

        // Create piece on board
        this.#board.createPieceOnBoard(piece, target_square_id);

        // Burada cache e eklenebilir yaratılan taşlar.
    }

    /**
     * @private
     * Select Piece
     * @param {int} square_id Square id of the piece
     * @returns {void}
    */
    selectPiece(square_id){
        // Get piece
        let piece = BoardManager.getPieceBySquareId(square_id);

        // If selected piece is not current move's piece or player is checked and selected piece is not king then return, also if game is finished or player is on promoting screen then return
        if(piece.color !== Global.getCurrentMove() || this.#is_promoting || this.#is_finished || !this.#is_started)
            return;

        // If clicked piece is selected piece then unselect piece
        if(this.#selected_piece === piece){
            this.clearSelect();
            return;
        }

        // Clear board
        this.#board.refreshBoard();

        // Set selected piece
        this.#selected_piece = piece;

        // Add selected effect to selected piece
        this.#board.addEffectToSquare(this.#selected_piece.getSquareId(), SquareEffect.Selected);

        // Get playable squares of selected piece
        let cache_playable_squares = Cache.get(CacheLayer.Game, "playable_squares");

        // If playable squares not in cache
        if(!cache_playable_squares || cache_playable_squares[this.#selected_piece.id] === undefined){
            this.#playable_squares = this.#selected_piece.getPlayableSquares();

            // Add playable squares to cache
            Cache.add(CacheLayer.Game,"playable_squares", {[this.#selected_piece.id]:this.#playable_squares});
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
    clearSelect(){
        this.#board.refreshBoard();
        this.#selected_piece = null;
        this.#playable_squares = [];
    }

    /**
     * @private
     * Play piece
     * @param {int} target_square_id Square ID of the Target Square that piece will be moved
     * @returns {void}
     */
    playPiece(target_square_id){
        this.#selected_piece.increaseMoveCount();

        // Refresh board
        this.#board.refreshBoard();

        // Define and do special move like castling, en passant or promotion if move is not special then move piece to square
        if(!this.#checkAndDoSpecialMove(this.#selected_piece, target_square_id)){
            this.#movePiece(this.#selected_piece, target_square_id);
            this.#changeTurn();
        }
    }

    /**
     * @private
     * Move piece to square
     * @param {int} target_square_id Square ID of the Target Square that piece will be moved
     * @param {Piece} piece Piece that will be moved
     * @returns {void}
     */
    #movePiece(piece=this.#selected_piece, target_square_id){
        // Move piece on the board
        this.#board.movePieceOnBoard(piece, target_square_id);

        // Move Piece To Target Position
        const old_square_id = piece.getSquareId();
        Global.setSquare(target_square_id, piece);
        Global.setSquare(old_square_id, 0);
    }

    /**
     * @private
     * Define and do special move like castling, en passant or promotion
     * @param {Piece} piece Piece that will do special move
     * @param {int} target_square_id Square ID of the Target Square that piece will be moved
     * @returns {boolean}
     */
    #checkAndDoSpecialMove(piece, target_square_id){
        let pieceOfTargetSquareId = BoardManager.getPieceBySquareId(target_square_id);

        // If castling move
        if(BoardManager.isSquareHasPiece(target_square_id, Color.White, PieceType.Rook)){
            this.#doCastling(target_square_id, pieceOfTargetSquareId);
            return true;
        }

        // If en passant move
        else if(piece.type === PieceType.Pawn && !pieceOfTargetSquareId && (target_square_id !== piece.getSquareId() + 8 && target_square_id !== piece.getSquareId() - 8)){
            this.#doEnPassant(target_square_id, piece);
            return true;
        }

        // If promote move
        else if(piece.type === PieceType.Pawn && !pieceOfTargetSquareId && ((piece.color === Color.White && target_square_id < 9) || (piece.color === Color.Black && target_square_id > 56))){
            this.#is_promoting = true;
            Storage.set("promotion-screen", true);
            Storage.set("promote-piece", piece);
            this.#board.showPromotionScreen(target_square_id);
            return true;
        }

        return false;
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
        let castling_type = square_id % 8 === 0 ? CastlingType.Short : CastlingType.Long;
        let player_king = Storage.get(Global.getCurrentMove() + "-king");

        // Move King(if castling type is short then move king to 1 square to the left of rook else move king to 2 square to the right of rook)
        target_square_id = castling_type === CastlingType.Short ? square_id - 1 : square_id + 2;
        this.#movePiece(player_king, target_square_id);

        // Move Rook(if castling type is short then move rook to 2 square left of himself else move rook to 3 square right of himself)
        target_square_id = castling_type === CastlingType.Short ? square_id - 2 : square_id + 3;
        this.#movePiece(rook, target_square_id);

        this.#changeTurn();
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
        this.#movePiece(pawn, square_id);

        this.#changeTurn();
    }

    /**
     * @private
     * En Passant
     * @param {int} square_id Square id of pawn
     * @param {string} promotion_type Type of piece that pawn will be promoted
     * @returns {void}
     */
    doPromote(square_id, promotion_type){
        let columnOfSquareId = Calculator.calcColumnOfSquare(square_id);
        let current_color = Global.getCurrentMove();
        this.destroyPiece(Storage.get("promote-piece").getSquareId());

        // If promoted pawn is white then target square id is 1-8 else 57-64
        let targetSquareId = current_color === Color.White ? columnOfSquareId : columnOfSquareId + 56;

        this.createPiece(promotion_type, current_color, targetSquareId);
        this.#board.disablePromotionScreen();
        Storage.set("promotion-screen", false);
        this.#is_promoting = false;

        this.#changeTurn();
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
     * Is enemy player checked after move? If checked then set gl_checked_player to enemy player
     * @returns {void}
    */
    #controlCheck(){
        // If moved piece is king then don't control check
        if(Storage.get("last-moved-piece").type === PieceType.King)
        {
            Global.setCheckedPlayer(null); // set checked status to null
            this.#board.removeEffectOfAllSquares(SquareEffect.Checked);
            return;
        }

        // Set checked player and give effect the checked king
        if(GameManager.isCheck())
        {
            Global.setCheckedPlayer(Global.getCurrentMove());
            this.#board.addEffectToSquare(Storage.get(Global.getCurrentMove() + "-king").getSquareId(), SquareEffect.Checked);

            if(GameManager.isCheckmate()) // Is Checkmate?
                this.#finishGame(FinalStatus.Checkmate, Global.getEnemyColor());
        }
        else
        {
            Global.setCheckedPlayer(null);
            this.#board.removeEffectOfAllSquares(SquareEffect.Checked);

            // Is Stalemate?
            if(GameManager.isStalemate())
                this.#finishGame(FinalStatus.Stalemate);
        }
    }

    /**
     * @public
     * Start Game
     * @returns {void}
     */
    startGame(){
        if(Storage.get("white-king") && Storage.get("black-king")){
            this.#is_started = true;
            this.#is_finished = false;
            this.#board.closeStartScreen();
        }else{
            Alert.showAlert(AlertMessage.KingsNotCreated);
            if(!this.#is_start_screen_opened){
                this.#board.showStartScreen();
                this.#is_start_screen_opened = true;
            }
        }
    }

    /**
     * @private
     * Finish game
     * @param {FinalStatus} final_status
     * @param {Color} winner
     * @returns {void}
     */
    #finishGame(final_status, winner= null){
        this.#is_started = false;
        this.#is_finished = true;
        if(final_status === FinalStatus.Checkmate)
            Alert.showAlert(winner === Color.White ? AlertMessage.WhiteWin : AlertMessage.BlackWin);
        else if(final_status === FinalStatus.Stalemate)
            Alert.showAlert(AlertMessage.Stalemate);
    }

    /**
     * @private
     * End turn step by step: Control en passant, control castling, control check, clear current select, clear playable squares from cache, set next move, increase move count
     * @returns {void}
     */
    #changeTurn() {
        // Set last moved piece
        Storage.set("last-moved-piece", this.#selected_piece);

        // Clear current select
        this.clearSelect();

        // Clear playable_squares from cache
        Cache.remove(CacheLayer.Game, "playable_squares");

        // Set New Turn(change current player)
        Global.setNextMove();

        // Increase Move Count
        Global.increaseMoveCount();

        // Control castling after move
        GameManager.controlCastlingAfterMove();

        // Control check for player
        this.#controlCheck();

        // Update game in cache
        this.#saveGameToCache();
    }
}