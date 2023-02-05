class BoardEngine{
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
        const board_chars = "abcdefgh"; // Board Bottom Characters
        let square_color = "white"; // Board Start Squares Color
        let board_numbers = 8; // Board Right Numbers
        let board_chars_count = 0; // For loop, not too important

        for (let i = 1; i <= 64; i++) {
            GameController.setGlobalSquare(i, 0);
            let square = document.createElement('div');
            square.classList.add('square');
            square.setAttribute("id", i); // Square position
            square.setAttribute("onclick", "DOMHandler.clickSquare(this)");
            square.innerHTML = i; // STUB -> Show Square ID

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
        piece.setAttribute("data-color", color); // For image of piece   
        let piece_obj = new Piece(GameController.createPieceID(), piece_type, color);

        // Set white and black king
        if(piece_type == "king" && color == "white")
            gl_white_king = piece_obj;
        else if(piece_type == "king" && color == "black")
            gl_black_king = piece_obj;
            
        GameController.setGlobalSquare(target_square_id, piece_obj); // Add square list for position information
        GameController.setGlobalPiece(piece_obj.id, piece_obj); // Add pieces list
        target_square.appendChild(piece); // Add piece to target square
    }
    
    /**
    * Clear/Refresh Board 
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
            squares[i].classList.remove("clicked-effect");
            squares[i].classList.remove("playable-effect");
            squares[i].classList.remove("killable-effect");
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
            // If the square contains enemy piece then the square is "killable-piece"
            if (GameController.isSquareHas(playable_squares[i]) == "enemy")
                this.setEffectOfSquareID(playable_squares[i], "killable")
            else // If the square not contains piece then the square is "playable-square"
                this.setEffectOfSquareID(playable_squares[i], "playable")
        }
    }

    /**
    * Move Piece To Selected Square
    * @async
    * @param {Piece} piece Piece of the target to move
    * @param {int} target_square Piece target square
    * @returns {void}
    */
    async movePiece(piece, target_square) {
        let piece_id = GameController.getSquareIDByPiece(piece);
        GameController.changePiecePosition(piece_id, target_square);
        
        // Remove piece from his square(and checked effect if exist)
        piece_id = document.getElementsByClassName("square")[piece_id - 1];
        piece_id.removeChild(piece_id.lastElementChild);
        piece_id.classList.remove("checked-effect");

        // Remove enemy from target square
        let target_piece = document.getElementById(target_square);
        if (target_piece.lastElementChild)
            target_piece.removeChild(target_piece.lastElementChild);

        await new Promise(r => setTimeout(r, 75));

        // Move piece to target square
        piece_id = document.createElement("div");
        piece_id.setAttribute("data-color", piece.color);
        piece_id.setAttribute("data-piece", piece.type);
        piece_id.classList.add("piece");
        target_piece.appendChild(piece_id);
    }
 
    /**
     * Set effect of the square
     * @param {int} square_id Square to be effected
     * @param {string} effect_type "playable", "killable", "checked"
     * @returns {void}
     */
    setEffectOfSquareID(square_id, effect_type){
        document.getElementById(square_id).classList.add(effect_type + "-effect");
    }
}