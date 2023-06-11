class DomValidator{  
    /**
     * @static
     * Input must be (a1-h8) or (1-64)
     * @param {MenuOperation} input_name
     * @returns {boolean}
     */
    static validateInput(input_name){
        let characters = ["a", "b", "c", "d", "e", "f", "g", "h"];
        let square = document.querySelector('input[name=' + input_name + ']').value;
        let error = document.getElementById("square-error");
        error.innerText = "";

        if(parseInt(square) && square > 64 || square < 1){
            error.innerText = "Must be less than 65 and greater than 0";
            return false;
        }
        else if(!characters.includes(square.charAt(0)) || square.charAt(1) > 8 || square.charAt(1) < 1){
            error.innerText = "First character must be a-h and second character must be 1-8";
            return false;
        }

        return true;
    }
}