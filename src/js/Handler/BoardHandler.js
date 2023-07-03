class BoardHandler{
    static #chessInstance = null;

    static {
        this.#chessInstance = new Chess(); // Singleton Chess Object
    }

    /**
     * @static
     * Click Board From DOM (Clear Select)
     * @returns {void}
     */
    static clickBoard(){
        this.#chessInstance.clearSelect();
    }

    /**
     * @static
     * Select Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static selectPiece(e){
        this.#chessInstance.selectPiece(parseInt(e.id));
    }

    /**
     * @static
     * Play Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static playPiece(e){
        this.#chessInstance.playPiece(parseInt(e.id));
    }

    /**
     * @static
     * Select Promotion Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static selectPromotion(e){
        this.#chessInstance.doPromote(parseInt(e.id), e.querySelector(".promotion-option").getAttribute("data-piece"));
    }    
}