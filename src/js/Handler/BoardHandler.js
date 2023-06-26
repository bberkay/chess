class BoardHandler{
    static #chessInstance = null;

    static {
        this.#chessInstance = new Chess(); // Singleton Chess Object
    }

    /**
     * @static
     * Is Any Popup Open? (like Promotion Screen, Checkmate Screen, etc.)
     * @param {string|null} exception Exception Popup Name
     * @returns {boolean}
     */
    static isAnyPopupOpen(exception = null){
        return (Storage.get("promotion-screen") && exception !== "promotion-screen");
    }

    /**
     * @static
     * Click Board From DOM (Clear Select)
     * @returns {void}
     */
    static clickBoard(){
        if(this.isAnyPopupOpen())
            return;

        this.#chessInstance.clearSelect();
    }

    /**
     * @static
     * Select Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static selectPiece(e){
        if(this.isAnyPopupOpen())
            return;

        this.#chessInstance.selectPiece(parseInt(e.id));
    }

    /**
     * @static
     * Play Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static playPiece(e){
        if(this.isAnyPopupOpen())
            return;

        this.#chessInstance.playPiece(parseInt(e.id));
    }

    /**
     * @static
     * Select Promotion Piece From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static selectPromotion(e){
        if(this.isAnyPopupOpen("promotion-screen"))
            return;

        this.#chessInstance.doPromote(parseInt(e.id), e.querySelector(".promotion-option").getAttribute("data-piece"));
    }    
}