class MenuValidator{  
    /**
     * @static
     * Input must be (1-64)
     * @param {string} val Value of input
     * @param {string|null} error_id Error element id
     * @returns {boolean|string} true or error message
     */
    static isValueSquareId(val, error_id=null){
        if(parseInt(val) && val > 64 || val < 1){
            if(error_id)
                document.getElementById(error_id).innerHTML = "Must be less than 65 and greater than 0";
            return "Must be less than 65 and greater than 0";
        }
        return true;
    }

    /**
     * @static
     * Input must be (a1-h8)
     * @param {string} val Value of input
     * @param {string|null} error_id Error element id
     * @returns {boolean|string} true or error message
     */
    static isValueSquare(val, error_id=null){
        if(!["a", "b", "c", "d", "e", "f", "g", "h"].includes(val.charAt(0)) || val.charAt(1) > 8 || val.charAt(1) < 1){
            if(error_id)
                document.getElementById(error_id).innerHTML = "First character must be a-h and second character must be 1-8";
            return "First character must be a-h and second character must be 1-8";
        }

        return true;
    }
}