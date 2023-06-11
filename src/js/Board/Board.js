class Board{
    #chessboard; // Chessboard Element
    #square_color; // Square Color
    #board_numbers; // Board Numbers
    #board_chars_count; // Board Characters Count
    #board_chars; // Board Characters
    
    /** 
     * Constructor
    */
    constructor() {
        this.#chessboard = document.getElementById("chessboard");
        this.#square_color = "white";
        this.#board_numbers = 8;
        this.#board_chars_count = 0;
        this.#board_chars = "abcdefgh";
    }

    /**
     * @public
     * Setup Board
     * @returns {void}
     */
    setup(){
        this.#createBoard();

        for(let i in Global.getSquares()){
            this.createPieceOnBoard(Global.getSquare(parseInt(i)), parseInt(i));
        }
    }

    /**
     * Create Chessboard
     * @returns {void}
     */
    #createBoard() {
        // First clear board
        this.clearBoard();

        // Create board
        for (let i = 1; i <= 64; i++) {
            let square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute("id", i); // Square position
            square.setAttribute("onclick", "DOMHandler.clickSquare(this)");

            if (i % 8 == 0) { // Create Board Numbers
                square.innerHTML += "<span class = 'number'>" + this.#board_numbers + "</span>";
                this.#board_numbers--;
            }

            if (i > 56 && i < 65) { // Create Board Characters
                square.innerHTML += "<span class = 'chars'>" + board_chars.charAt(this.#board_chars_count) + "</span>";
                this.#board_chars_count++;
            }

            // Set Squares Color
            if (i % 8 != 1)
                this.#square_color = this.#square_color == Type.Black ? Type.White : Type.Black;
                
            // Add square color
            square.classList.add("square-" + square_color);

            this.chessboard.appendChild(square);
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
            square_id = piece.getSquareID();
        
        // First clear square
        this.clearSquare(square_id); 

        // Find target square element
        const target_square = document.getElementById(square_id); 

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
        let piece_id = document.getElementById(square_id);
        let piece_obj = piece_id.querySelector(".piece");
        if(piece_obj)
            piece_id.removeChild(piece_obj);

        // Remove enemy from target square
        let target_piece = document.getElementById(target_square);
        piece_obj = target_piece.querySelector(".piece");
        if (piece_obj)
            target_piece.removeChild(piece_obj);

        await new Promise(r => setTimeout(r, 75));

        // Move piece to target square
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
        let target_piece = document.getElementById(square_id);
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
        if(pieces.length == 0) // If there is no piece on the board then
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
            // Control Squares and piece ID for changing on DOM(Security measures). If any id change after the start then set its id to its position
            if (squares[i].id != i + 1)
                squares[i].id = i + 1;

            // Clear effects on the squares
            //squares[i].classList.remove(Effects.checked);
            this.removeEffectOfSquare(squares[i].id, [Effect.Playable, Effect.Killable]);
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
            if (BoardManager.isSquareHasPiece(playable_squares[i], enemy_color))
                this.addEffectToSquare(playable_squares[i], Effect.killable)
            else
                this.addEffectToSquare(playable_squares[i], Effect.playable)
        }
    }

    /**
     * Add effect to the square
     * @param {int} square_id Square to be effected
     * @param {(playable|killable|checked)} effect
     * @returns {void}
     */
    addEffectToSquare(square_id, effect){
        /* STUB: Validate
        if(effect != this.#Effects.playable && effect != this.#Effects.killable && effect != this.#Effects.checked)
            throw new Error("Invalid effect type");*/

        document.getElementById(square_id.toString()).classList.add(effect);
    }

    /**
     * Remove effect of the square
     * @param {int} square_id Square of the effect to be removed
     * @param {(playable|killable|checked|null|Array<Effect>)} effect If null then remove all effects
     * @returns {void}
     */
    removeEffectOfSquare(square_id, effect=null){
        if(effect == null)
            document.getElementById(square_id.toString()).classList.remove(Effect.playable, Effect.killable, Effect.checked);
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
}