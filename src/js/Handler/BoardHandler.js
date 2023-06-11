class BoardHandler{    
    /**
     * @static
     * Get Clicked Square From DOM
     * @param {Element} square Element of the clicked square('this' object comes from DOM)
     * @returns {void}
     */
    static clickSquare(e){
        // Validate
        Validator.validateSquare({square_id:parseInt(e.id)});
        
        // Define Move
        this.defineMove(parseInt(e.id));
    }    


    /**
     * @static
     * Define player's move
     * @param {int} square_id
     * @returns {void}
     */
    static defineMove(square_id){

    }

}