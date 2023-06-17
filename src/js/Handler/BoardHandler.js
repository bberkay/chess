class BoardHandler{        
    /**
     * @static
     * Get Clicked Square From DOM
     * @param {Element} e Element of the clicked square('this' object comes from DOM)
     * @param {SquareClickMode} move_type Mode of the clicked square
     * @returns {void}
     */
    static clickSquare(e, move_type){
        this.defineMove(parseInt(e.id), move_type);
    }    

    /**
     * @static
     * Define move
     * @param {int} square_id Square ID
     * @param {SquareClickMode} move_type Move Type
     * @returns {void}
     */
    static defineMove(square_id, move_type){
        let chess = new Chess(); // Singleton Chess Object

        switch(move_type){
            case SquareClickMode.ClickSquare:
                chess.clearSelect();
                break;
            case SquareClickMode.SelectPiece:
                chess.selectPiece(BoardManager.getPieceBySquareId(square_id));
                break;
            case SquareClickMode.MovePiece:
                chess.movePiece(square_id);
                break;
            default:
                break;
        }
    }
}