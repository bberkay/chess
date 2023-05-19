class JSONConverter{
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
     * @returns {JSON}
     */
    static reverseJSON(json_object){
        var swapped_array = {};
        for(var key in json_object){
            swapped_array[json_object[key]] = key;
        }
        return swapped_array;
    }
}