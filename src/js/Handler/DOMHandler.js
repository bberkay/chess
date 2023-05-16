class DOMHandler{
     /**
     * Get Clicked Square From DOM
     * @param {Element} square Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static clickSquare(e){
        chess.clickSquare(parseInt(e.id));
    }    

    /**
     * Show Square ID of the squares
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
}