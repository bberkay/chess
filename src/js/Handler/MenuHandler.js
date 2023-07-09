class MenuHandler{
        
    /*
     * Menu variables
     */
    static is_piece_id_list_shown = false; // Is piece id list shown ?

    /**
     * @static
     * Show/Visible ID of the squares
     * @returns {void}
     */
    static toggleSquareIdList(){
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
     * Show/Visible Global Squares 
     * @returns {void}
     */
    static togglePieceIdList(){
        let squares = document.getElementsByClassName("square");
        for (let square of squares) {
            let identity = Global.getSquare(parseInt(square.id)); // find real piece in global squares
            if(identity["id"]){ // if square has piece
                if(!this.is_piece_id_list_shown){ // Add square to real piece info
                    square.innerHTML +=  "<div class = 'piece-info-container'><div class = 'piece-info'>" + identity["id"] + "</div><div class = 'piece-info'>" + identity["type"] + "</div><div class = 'piece-info'>" + identity["color"] + "</div></div>";     
                }
                else{ // remove real piece info from square
                    let info = document.getElementsByClassName("piece-info-container");
                    for(let element of info){
                        element.remove();
                    }
                }
            }
        }

        this.is_piece_id_list_shown = !this.is_piece_id_list_shown;
    }

    /**
     * @static
     * Delete Piece With Form
     * @returns {void}
     */
    static deletePieceWithForm(){
        let chess = new Chess(); // Singleton Chess Object

        let square = document.querySelector('input[name="form-input-delete"]').value;

        if(MenuValidator.isValueSquare(square, "square-error"))
            chess.destroyPiece(Converter.convertSquareToSquareID(square));
        else if(MenuValidator.isValueSquareId(square, "square-error"))
            chess.destroyPiece(parseInt(square));

        // Update current game
        Cache.set(CacheLayer.Game,"gl_squares", Global.getSquares());
    }
      
    /**
     * @static
     * Create Piece With Form
     * @returns {void}
     */
    static createPieceWithForm(){
        let chess = new Chess(); // Singleton Chess Object

        let color = document.querySelector('input[name="form-color"]:checked').value.toLowerCase();
        let piece = document.querySelector('input[name="form-piece"]:checked').value.toLowerCase();
        let square = document.querySelector('input[name="form-input-create"]').value;

        if(MenuValidator.isValueSquare(square, "square-error"))
            chess.createPiece(piece, color, Converter.convertSquareToSquareID(square));
        else if(MenuValidator.isValueSquareId(square, "square-error"))
            chess.createPiece(piece, color, parseInt(square));

        // Update current game
        Cache.set(CacheLayer.Game, "gl_squares", Global.getSquares());
    }

    /**
     * @static
     * Start Empty Game
     * @returns {void}
     */
    static startEmptyGame(){
        let chess = new Chess(); // Singleton Chess Object

        if(Alert.showConfirm("Wait, are you sure you want to start a empty game ?"))
            chess.startCustomGame();
    }

    /**
     * @static
     * Start Standard Game
     * @returns {void}
     */
    static startStandardGame(){
        let chess = new Chess(); // Singleton Chess Object

        if(Alert.showConfirm("Wait, are you sure you want to start a standard game ?"))
            chess.startStandardGame();
    }

    /**
     * @static
     * Start From Position
     * @param {StartPosition|Array<JSON>} position
     * @returns {void}
     */
    static startFromPosition(position){
        let chess = new Chess(); // Singleton Chess Object

        if(Alert.showConfirm("Wait, are you sure you want to start a custom game ?"))
            chess.startCustomGame(position);
    }

    /**
     * @static
     * Start Game With Form
     * @returns {void}
     */
    static startGameWithForm(){
        let chess = new Chess(); // Singleton Chess Object

        chess.startGame();
    }
}