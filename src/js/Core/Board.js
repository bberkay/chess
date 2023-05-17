class Board{
    /**
     * @enum {string}
     */
    #Effects = { 
        checked:"checked-effect", 
        killable:"killable-effect", 
        playable:"playable-effect",
        selected:"selected-effect"
    }

    /** 
     * Constructor
    */
    constructor() {
        this.chessboard = document.getElementById("chessboard");
    }

    /**
     * Create Chessboard
     * @returns {void}
     */
    createBoard() {
        const board_chars = "abcdefgh";
        let square_color = "white"
        let board_numbers = 8;
        let board_chars_count = 0;

        for (let i = 1; i <= 64; i++) {
            let square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute("id", i); // Square position
            square.setAttribute("onclick", "DOMHandler.clickSquare(this)");

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
                square_color = square_color == "black" ? square_color = "white" : square_color = "black";
            square.classList.add("square-" + square_color);

            this.chessboard.appendChild(square);
        }
    }

    /** 
    * Create Chess Pieces at Their Start Positions
    * @returns {void}
    */
    createPiecesAtStartPosition() {
        for (let i = 1; i <= 32; i++) {
            let square_id = i <= 16 ? i : i + 32;

            if (square_id == 1 || square_id == 8 || square_id == 57 || square_id == 64) // Rook
                this.createPiece(square_id < 57 ? "white" : "black", "rook", square_id);
            else if (square_id == 2 || square_id == 7 || square_id == 58 || square_id == 63) // Knight
                this.createPiece(square_id < 58 ? "white" : "black", "knight", square_id);
            else if (square_id == 3 || square_id == 6 || square_id == 59 || square_id == 62)// Bishop
                this.createPiece(square_id < 58 ? "white" : "black", "bishop", square_id);
            else if (square_id == 4 || square_id == 60) // Queen 
                this.createPiece(square_id < 60 ? "white" : "black", "queen", square_id);
            else if (square_id == 5 || square_id == 61) // King
                this.createPiece(square_id < 61 ? "white" : "black", "king", square_id);            
            else if (square_id >= 9 && square_id < 17 || square_id > 48 && square_id < 57) // Pawn 
                this.createPiece(square_id < 48 ? "white" : "black", "pawn", square_id);
        }
    }

    /**
    * Create Piece at Any Position on the Board
    * @param {string} color Piece color
    * @param {string} piece_type Piece Type
    * @param {int} target_square_id Target Square ID
    * @returns {void}
    */
    createPiece(color, piece_type, target_square_id) {
        const target_square = document.getElementById(target_square_id); // Find target square element
        const piece = document.createElement("div");
        piece.classList.add("piece");
        piece.setAttribute("data-piece", piece_type); // For image of piece
        piece.setAttribute("data-color", color); 
        new Piece(piece_type, color, target_square_id); // Create Piece[object]
        target_square.appendChild(piece); // Add piece to target square
    }
    
    /**
     * Clear/Refresh Board(Remove effects)
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
            //squares[i].classList.remove(this.#Effects.checked);
            squares[i].classList.remove(this.#Effects.playable);
            squares[i].classList.remove(this.#Effects.killable);
        }
    }

    /**
     * Show Playable Squares of the Clicked Piece
     * @param {Array<int>} playable_squares Element of the clicked square
     * @returns {void}
     */
    showPlayableSquares(playable_squares) {
        let l = playable_squares.length;
        for (let i = 0; i < l; i++) {
            if (GameController.isSquareHasPiece(playable_squares[i], GameController.getEnemyColor()))
                this.setEffectOfSquare(playable_squares[i], this.#Effects.killable)
            else
                this.setEffectOfSquare(playable_squares[i], this.#Effects.playable)
        }
    }

    /**
    * Move Piece To Selected Square
    * @async
    * @param {Piece} piece Piece of the target to move
    * @param {int} target_square Square ID of target square
    * @returns {void}
    */
    async movePiece(piece, target_square) {
        // Change Piece Position 
        let square_id = GameController.getSquareIDByPiece(piece);
        GameController.changeSquare(target_square, piece);
        GameController.changeSquare(square_id, 0);

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
     * Destroy piece by square id
     * @param {int} square_id 
     * @returns {void}
     */
    destroyPiece(square_id){
        // Remove enemy from dom
        let target_piece = document.getElementById(square_id);
        let piece_obj = target_piece.querySelector(".piece");
        if(piece_obj)
            target_piece.removeChild(piece_obj);

        // Remove enemy from game
        GameController.changeSquare(square_id, 0);
    }

    /**
     * Set effect of the square
     * @param {int} square_id Square to be effected
     * @param {(playable|killable|checked)} effect
     * @returns {void}
     */
    setEffectOfSquare(square_id, effect){
        document.getElementById(square_id.toString()).classList.add(effect);
    }

    /**
     * Clear effect of the square
     * @param {int} square_id Square to be effected
     * @param {(playable|killable|checked)} effect
     * @returns {void}
     */
    clearEffectOfSquare(square_id, effect){
        document.getElementById(square_id.toString()).classList.remove(effect);
    }

    /**
     * Set checked effect of player's king
     * @returns {void}
     */
    setCheckedEffect(){
        this.setEffectOfSquare(GameController.getPlayerKingSquareID(), this.#Effects.checked);
    }

    /**
     * Set selected effect of selected piece
     * @param {Piece} selected_piece
     * @returns {void}
     */
    setSelectedEffect(selected_piece){
        this.setEffectOfSquare(GameController.getSquareIDByPiece(selected_piece), this.#Effects.selected);
    }

    /**
     * Clear selected effect of selected piece
     * @param {Piece} selected_piece
     * @returns {void}
     */
    clearSelectedEffect(selected_piece){
        this.clearEffectOfSquare(GameController.getSquareIDByPiece(selected_piece), this.#Effects.selected);
    }

    /**
     * Clear checked effect of selected piece
     * @returns {void}
     */
    clearCheckedEffect(){
        try{
            document.querySelector(".checked-effect").classList.remove(this.#Effects.checked);
        }catch{}
    }
}