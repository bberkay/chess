class PathConverter{
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
}