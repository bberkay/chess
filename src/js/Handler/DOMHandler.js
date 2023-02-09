class DOMHandler{
     /**
     * Get Clicked Square From DOM
     * @param {Element} square Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static clickSquare(e){
        chess.playPiece(e.id);
    }    
}