class MenuHandler{
        
    /*
     * Menu variables
     */
    is_piece_id_list_shown = false; // Is piece id list shown ?
    is_en_passant_status_shown = false; // Is en passant status shown ?

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
        // If en passant status is shown then hide it
        if(this.is_en_passant_status_shown)
            this.toggleEnPassantStatus();
        
        let squares = document.getElementsByClassName("square");
        for (let square of squares) {
            let identity = Global.getSquare(parseInt(item.id)); // find real piece in global squares
            if(identity["id"]){ // if square has piece
                if(!this.is_piece_id_list_shown){ // Add square to real piece info
                    item.innerHTML +=  "<div class = 'piece-info-container'><div class = 'piece-info'>" + identity["id"] + "</div><div class = 'piece-info'>" + identity["type"] + "</div><div class = 'piece-info'>" + identity["color"] + "</div></div>";     
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
     * Show/Visible En Passant Status
     * @returns {void}
     */
    static toggleEnPassantStatus(){
        // If piece id list is shown then hide it
        if(this.is_piece_id_list_shown)
            this.togglePieceID();

        let squares = document.getElementsByClassName("square");
        for(let square of squares){
            let status = Global.getEnPassantOfPawn(Global.getSquare(parseInt(square.id)).id); // find en passant status of piece in square
            if(status != undefined){
                if(!gl_show_en_passant_status){ // Add info to square
                    square.innerHTML +=  "<div class = 'en-passant-container'><div class = 'en-passant-info' value='" + status + "'>" + status + "</div></div>";     
                }
                else{ // remove info from square
                    let info = document.getElementsByClassName("en-passant-container");
                    for(let element of info){
                        element.remove();
                    }
                }
            }
        }
                
        this.is_en_passant_status_shown = !this.is_en_passant_status_shown;
    }

    /**
     * @static
     * Delete Piece With Form
     * @returns {void}
     */
    static deletePieceWithForm(){
        let square = document.querySelector('input[name="form-square-delete"]').value;

        if(DOMHandler.controlSquareInput(MenuOperation.DeletePiece)){
            chess.destroyPiece(Converter.convertSquareToSquareID(square));
        }
    }
      
    /**
     * @static
     * Create Piece With Form
     * @returns {void}
     */
    static createPieceWithForm(){
        let color = document.querySelector('input[name="form-color"]:checked').value.toLowerCase();
        let piece = document.querySelector('input[name="form-piece"]:checked').value.toLowerCase();
        let square = document.querySelector('input[name="form-square-create"]').value;

        if(DomValidator.validateInput(MenuOperation.CreatePiece)){
            chess.createPiece(color, piece, Converter.convertSquareToSquareID(square));
        }

    }

}