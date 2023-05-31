class DOMHandler{
     /**
      * @static
     * Get Clicked Square From DOM
     * @param {Element} square Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static clickSquare(e){
        chess.clickSquare(parseInt(e.id));
    }    

    /**
     * @static
     * Show ID of the squares
     * @returns {void}
     */
    static toggleSquareID(){
        let squares = document.querySelectorAll(".square");
        if(!squares[0].innerHTML.includes("1")){
            for(let i = 0; i<64;i++){
                squares[i].innerHTML += "<span class = 'square-id'>" + (i + 1).toString() + "</span>";
            }
        }else{
            for(let i = 0; i<64;i++){
                squares[i].innerHTML = squares[i].innerHTML.replace('<span class="square-id">' + (i + 1).toString() + '</span>', "");
            }
        }
    }

    /**
     * @static
     * Start New Game 
     * @returns {void}
     */
    static startNewGame(){
        chess.startGame();
    }

    /**
     * @static
     * Start Game without Pieces
     * @returns {void}
     */
    static startEmptyGame(){
        chess.startCustomGame();
    }

    /**
     * @static
     * Control square position in input 
     * @returns {boolean}
     */
    static controlSquareInput(input_name){
        let square = document.querySelector('input[name=' + input_name + ']').value;
        let error = document.getElementById("square-error");
        error.innerText = "";

        if(parseInt(square) && square > 64 || square < 0){
            error.innerText = "Must be less than 65 and greater than 0";
            return false;
        }
        else if(square.length > 2 || square.charAt(0) > 'h' || square.charAt(1) > 9 || square.charAt(1) < 1 || square.charAt(0) > 9 || square.charAt(0) < 1){
            error.innerText = "The first character must be less than i, the second character must be greater than 0 and less than 9";
            return false;
        }

        return true;
    }

    /**
     * @static
     * Convert square to square_id
     * @param {string} square 
     * @example a1 -> 57, a2 -> 49, h8 -> 8
     * @returns {int} 
     */
    static convertToSquareID(square){
        if(parseInt(square))
            return square;

        let first_character_catalog = {'a':1, 'b':2, 'c':3, 'd':4, 'e':5, 'f':6, 'g':7, 'h':8};
        let result = first_character_catalog[square.charAt(0)];
        for(let i = 8; i > square.charAt(1); i--){
            result += 8;
        }

        return result;
    }

    /**
     * @static
     * Delete Piece
     * @returns {void}
     */
    static deletePiece(){
        let square = document.querySelector('input[name="form-square-delete"]').value;

        if(DOMHandler.controlSquareInput("form-square-delete")){
            chess.destroyPiece(DOMHandler.convertToSquareID(square));
        }
    }
      
    /**
     * @static
     * Create Piece
     * @returns {void}
     */
    static createPiece(){
        let color = document.querySelector('input[name="form-color"]:checked').value.toLowerCase();
        let piece = document.querySelector('input[name="form-piece"]:checked').value.toLowerCase();
        let square = document.querySelector('input[name="form-square-create"]').value;

        if(DOMHandler.controlSquareInput("form-square-create")){
            chess.createPiece(color, piece, DOMHandler.convertToSquareID(square));
        }

    }

    /**
     * @static
     * Show Global Squares 
     * @returns {void}
     */
    static toggleBackend(){
        let squares = document.getElementsByClassName("square");
        for (let item of squares) {
            let identity = gl_squares[parseInt(item.id)]; // find real piece in global squares
            if(identity["id"]){ // if square has piece
                if(!gl_show_backend_status){ // Add square to real piece info
                    item.innerHTML +=  "<div class = 'piece-info-container'><div class = 'piece-info'>" + identity["id"] + "</div><div class = 'piece-info'>" + identity["type"] + "</div><div class = 'piece-info'>" + identity["color"] + "</div></div>";     
                }
                else{ // remove real piece info from square
                    let info = document.getElementsByClassName("piece-info-container");
                    for(let info_item of info){
                        info_item.remove();
                    }
                }
            }
        }
        gl_show_backend_status = !gl_show_backend_status;
    }
}