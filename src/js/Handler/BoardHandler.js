class BoardHandler{        
    /**
     * @static
     * Get Clicked Square From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @param {SquareClickMode} move_type Mode of the clicked square
     * @returns {void}
     */
    static clickSquare(e, move_type){
        let chess = new Chess(); // Singleton Chess Object

        chess.makeMove(parseInt(e.id), move_type);
    }    

    /**
     * @static
     * Select Promotion Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static selectPromotion(e){
        let chess = new Chess(); // Singleton Chess Object

        chess.doPromote(e.getAttribute("data-piece"));
    }    
}