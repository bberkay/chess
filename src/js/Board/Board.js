class Board{
    /**
     * Singleton Instance
     */
    constructor(){
        if (!Board.instance){
            // Singleton instance
            Board.instance = this;    
        }

        return Board.instance;
    }
    
    /**
     * Create Chessboard
     * @returns {void}
     */
    createBoard() {
        if(document.getElementById("chessboard") != null) // If chessboard already created then remove it
            document.getElementById("chessboard").innerHTML = "";

        let chessboard = document.getElementById("chessboard"); // Chessboard Element
        let square_color = Color.White; // Square Color
        let board_numbers = 8; // Board Numbers
        let board_chars_count = 0; // Board Characters Count
        let board_chars = "abcdefgh"; // Board Characters

        // Create board
        for (let i = 1; i <= 64; i++) {
            let square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute("id", i); // Square position
            this.changeSquareClickMode(square, SquareClickMode.ClickBoard); // Change square click mode

            if (i % 8 == 0) { // Create Board Numbers
                square.innerHTML += "<span class = 'number'>" + board_numbers + "</span>";
                board_numbers--;
            }

            if (i > 56 && i < 65) { // Create Board Characters
                square.innerHTML += "<span class = 'chars'>" + board_chars.charAt(board_chars_count) + "</span>";
                board_chars_count++;
            }

            // Set Squares Color
            if (i % 8 != 1)
                square_color = square_color == Color.Black ? Color.White : Color.Black;
                
            // Add square color
            square.classList.add("square-" + square_color);

            chessboard.appendChild(square);
        }
    }
    
    /**
    * Create Piece at Any Position on the Board
    * @param {Piece} piece Piece of the target to create
    * @param {int|null} square_id Square ID of piece. If null then piece will be search in global squares then get its square id
    * @returns {void}
    */
    createPieceOnBoard(piece, square_id=null) {
        // Find square id of piece
        if (square_id == null)
            square_id = piece.getSquareId();
        
        // First clear square
        this.destroyPieceOnBoard(square_id); 

        // Find target square element and change square to select piece mode
        const target_square = document.getElementById(square_id); 
        this.changeSquareClickMode(target_square, SquareClickMode.SelectPiece); // Change square click mode

        // Create piece element
        let piece_ele = document.createElement("div");
        piece_ele.classList.add("piece");
        piece_ele.setAttribute("data-piece", piece.type);
        piece_ele.setAttribute("data-color", piece.color); 

        // Add piece to target square
        target_square.appendChild(piece_ele); 
    }
    
    /**
    * Move Piece To Selected Square
    * @async
    * @param {Piece} piece Piece of the target to move
    * @param {int} target_square Square ID of target square
    * @returns {void}
    */
    async movePieceOnBoard(piece, target_square) {
        // Remove piece from his square
        let piece_id = document.getElementById(piece.getSquareId());
        let piece_obj = piece_id.querySelector(".piece");
        if(piece_obj)
            piece_id.removeChild(piece_obj);

        // Remove enemy from target square and change square to click square mode
        let target_piece = document.getElementById(target_square);
        this.changeSquareClickMode(target_piece, SquareClickMode.ClickBoard); // Change square click mode

        piece_obj = target_piece.querySelector(".piece");
        if (piece_obj)
            target_piece.removeChild(piece_obj);

        await new Promise(r => setTimeout(r, 75));

        // Move piece to target square and change square to select piece mode
        this.changeSquareClickMode(target_piece, SquareClickMode.SelectPiece); // Change square click mode
        let piece_element = document.createElement("div");
        piece_element.setAttribute("data-color", piece.color);
        piece_element.setAttribute("data-piece", piece.type);
        piece_element.classList.add("piece");
        target_piece.appendChild(piece_element);
    }
    
    /**
     * Remove Piece on the Board
     * @param {int} square_id 
     * @returns {void}
     */
    destroyPieceOnBoard(square_id){
        // Remove piece from his square
        let target_piece = document.getElementById(square_id.toString());
        let piece_obj = target_piece.querySelector(".piece");
        if(piece_obj)
            target_piece.removeChild(piece_obj);

        // Remove effects from square
        this.removeEffectOfSquare(square_id);
    }

    /**
     * Remove All Pieces on the Board
     * @returns {void}
     */
    destroyPiecesOnBoard(){
        let pieces = document.getElementsByClassName("piece");
        if(pieces.length === 0) // If there is no piece on the board then
            return;

        let l = pieces.length;
        for (let i = 0; i < l; i++) {
            pieces[i].remove();
        }
    }

    /**
     * Refresh Board(Remove effects)
     * @returns {void}
     */
    refreshBoard() {
        let squares = document.querySelectorAll(".square");
        let l = squares.length;
        for (let i = 0; i < l; i++) {
            let id = parseInt(squares[i].id);

            // Control Squares and piece ID for changing on DOM(Security measures). If any id change after the start then set its id to its position
            if (id !== i + 1)
                squares[i].id = (i+1).toString();

            // Clear effects on the squares
            this.removeEffectOfSquare(id, [SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Selected]);
            if(!BoardManager.getPieceBySquareId(id)) // If square click mode is move piece then change it to click square
                this.changeSquareClickMode(squares[i], SquareClickMode.ClickBoard); // Change square click mode
            else
                this.changeSquareClickMode(squares[i], SquareClickMode.SelectPiece); // Change square click mode
        }
    }   

    /**
     * Show Playable Squares of the Clicked Piece
     * @param {Array<int>} playable_squares Playable squares of the clicked piece
     * @returns {void}
     */
    showPlayableSquaresOnBoard(playable_squares) {
        let l = playable_squares.length;
        let enemy_color = Global.getEnemyColor();
        for (let i = 0; i < l; i++) {
            // If square has enemy piece then add killable effect to square and change square to kill enemy mode
            if (BoardManager.isSquareHasPiece(playable_squares[i], enemy_color)){
                this.addEffectToSquare(playable_squares[i], SquareEffect.Killable)
                this.changeSquareClickMode(playable_squares[i], SquareClickMode.PlayPiece) // Change square click mode
            }
            // Else add playable effect to square and change square to move piece mode
            else{
                this.addEffectToSquare(playable_squares[i], SquareEffect.Playable)
                this.changeSquareClickMode(playable_squares[i], SquareClickMode.PlayPiece) // Change square click mode
            }
        }
    }

    /**
     * @public
     * Show Promotion Options
     * @param {int} square_id Square of the promotion options to be shown
     * @returns {void}
     */
    showPromotionScreen(square_id){
        // Disable all squares on the board
        for(let i = 1; i <= 64; i++){
            this.addEffectToSquare(i, SquareEffect.Disabled);
        }

        const PROMOTION_OPTIONS = ["queen", "rook", "bishop", "knight"];
        const LENGTH_OF_PROMOTION_OPTIONS = PROMOTION_OPTIONS.length;

        let current_color = Global.getCurrentMove();

        // Hidden current pawn
        let pawnId = current_color === Color.White ? square_id + 8 : square_id - 8;
        document.getElementById(pawnId.toString()).querySelector(".piece").style.display = "none";


        // Add promotion options to board 
        for(let i = 0; i < LENGTH_OF_PROMOTION_OPTIONS; i++){
            let promotion_option = document.createElement("div");
            promotion_option.classList.add("piece");
            promotion_option.classList.add("promotion-option");
            promotion_option.setAttribute("data-piece", PROMOTION_OPTIONS[i]);
            promotion_option.setAttribute("data-color", current_color);

            // If current color is white then add promotion option to square below the pawn else add promotion option to square above the pawn
            let targetSquareId = current_color === Color.White ? square_id + (i * 8) : square_id - (i * 8);

            // Create promotion on the board and change square click mode
            let targetSquareObj = document.getElementById(targetSquareId.toString());
            this.removeEffectOfSquare(targetSquareId, SquareEffect.Disabled);
            this.changeSquareClickMode(targetSquareObj, SquareClickMode.SelectPromotion);
            targetSquareObj.appendChild(promotion_option);
        }
    }

    /**
     * @public
     * Disable Promotion Screen
     * @returns {void}
     */
    disablePromotionScreen(){
        let promotionOptions = document.querySelectorAll(".promotion-option");
        let l = promotionOptions.length;
        for(let i = 0; i < l; i++){
            promotionOptions[i].remove();
        }

        // Enable all squares on the board
        for(let i = 1; i <= 64; i++)
            this.removeEffectOfSquare(i, SquareEffect.Disabled);
    }

    /**
     * Show Start Screen
     * @returns {void}
     */
    showStartScreen(){
        // Disable all squares on the board
        for(let i = 1; i <= 64; i++){
            this.addEffectToSquare(i, SquareEffect.Disabled);
        }

        // Show start screen
        document.getElementById("start-game-btn").setAttribute("type", "button");
    }

    /**
     * Close Start Screen
     * @returns {void}
     */
    closeStartScreen(){
        // Enable all squares on the board
        for(let i = 1; i <= 64; i++){
            this.removeEffectOfSquare(i, SquareEffect.Disabled);
        }

        // Hide start screen
        document.getElementById("start-game-btn").setAttribute("type", "hidden");
    }

    /**
     * Show Finish Screen
     * @param {FinalStatus} final_status
     * @param {Color} winner_color
     * @returns {void}
     */
    showFinishScreen(final_status, winner_color){
        if(final_status === FinalStatus.Checkmate){
            document.getElementById("finish-screen-text").innerHTML = winner_color + " wins by checkmate";
        }
        else if(final_status === FinalStatus.Stalemate){
            document.getElementById("finish-screen-text").innerHTML = "Stalemate";
        }
    }

    /**
     * Add effect to the square
     * @param {int} square_id Square to be effected
     * @param {SquareEffect} effect
     * @returns {void}
     */
    addEffectToSquare(square_id, effect){
        document.getElementById(square_id.toString()).classList.add(effect);
    }

    /**
     * Remove effect of the square
     * @param {int} square_id Square of the effect to be removed
     * @param {SquareEffect|null|Array<SquareEffect>} effect If null then remove all effects
     * @returns {void}
     */
    removeEffectOfSquare(square_id, effect=null){
        if(effect == null)
            document.getElementById(square_id.toString()).classList.remove(SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Checked);
        else{
            if(Array.isArray(effect)){
                let l = effect.length;
                for(let i = 0; i < l; i++){
                    document.getElementById(square_id.toString()).classList.remove(effect[i]);
                }
            }else{
                document.getElementById(square_id.toString()).classList.remove(effect);
            }
        }
    }

    /**
     * Remove effect of all squares
     * @param {(SquareEffect|Array<SquareEffect>)} effect
     * @returns {void}
     */
    removeEffectOfAllSquares(effect){
        let squares = document.querySelectorAll(".square");
        let l = squares.length;
        for(let i = 0; i < l; i++){
            this.removeEffectOfSquare(parseInt(squares[i].id), effect);
        }
    }

    /**
     * Change Square Mode/Function
     * @param {(Array<int>|Array<Element>|int|Element)} square_id_or_element Square ID or Element of the square to be changed
     * @param {SquareClickMode} mode Mode
     */
    changeSquareClickMode(square_id_or_element, mode){
        if(Array.isArray(square_id_or_element)){
            let l = square_id_or_element.length;
            for(let i = 0; i < l; i++){
                if(typeof square_id_or_element[i] == "number")
                    document.getElementById(square_id_or_element[i].toString()).setAttribute("onclick", `BoardHandler.${mode}(this)`);
                else
                    square_id_or_element[i].setAttribute("onclick", `BoardHandler.${mode}(this)`);
            }
        }else{
            this.changeSquareClickMode([square_id_or_element], mode);
        }
    }
}