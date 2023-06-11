class Converter{
    /**
     * @static 
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     * @param {JSON} json_path JSON Path to convert
     * @returns {Array<int>}
     */
    static jsonPathToArrayPath(json_path){
        let array_path = [];
        for (let i in json_path) {
            for (let j in json_path[i]) {
                array_path.push(json_path[i][j]);
            }
        }
        return array_path;
    }

    /**
     * @static
     * Swap value to key
     * @param {JSON} json_object 
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is {3:"top", 4:"top", 5:"top", 8:"bottom", 9:"bottom", 10:"bottom"}
     * @returns {JSON}
     */
    static reverseJSON(json_object){
        var swapped_array = {};
        for(var key in json_object){
            swapped_array[json_object[key]] = key;
        }
        return swapped_array;
    }


    /**
     * @static
     * Convert square to square_id
     * @param {string} square 
     * @example a1 -> 57, a2 -> 49, h8 -> 8
     * @returns {int} 
     */
    static convertSquareToSquareID(square){
        let first_character_catalog = {'a':1, 'b':2, 'c':3, 'd':4, 'e':5, 'f':6, 'g':7, 'h':8};
        let square_id = first_character_catalog[square.charAt(0)];
        
        for(let i = 8; i > square.charAt(1); i--){
            square_id += 8;
        }

        return square_id;
    }

}