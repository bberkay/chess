class Converter{
    /**
     * This class is used to convert data from one type to another.
     */

    /**
     * Convert JSON Path to ArrayList Path
     * @example input is {"top":[3,4,5], "bottom":[8,9,10]} and output is [3,4,5,8,9,10]
     */
    static convertJSONPathToArrayPath(jsonPath: JSON): Array<number>{
        let arrayPath: Array<number> = [];

        for(let i in jsonPath){
            arrayPath = arrayPath.concat(jsonPath[i]);
        }

        return arrayPath;
    }

    /**
     * Convert square to squareID
     * @example input is "a1" and output is 57, input is "h8" and output is 8 (you can see the squareID table in the "../Enums.ts" file)
     */
    static convertSquareToSquareID(square:string){
        let squareID: number = 1;

        let file = square[0];
        let rank = square[1];

        squareID += (file.charCodeAt(0) - 97);
        squareID += (8 - parseInt(rank)) * 8;

        return squareID;
    }
}