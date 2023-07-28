class Calculator{
    /**
     * This class contains static methods that are used to calculate the row and column of a square. 
     */

    /**
     * Calculates the row of a square
     * @example input is 64 and output is 8, input is 15 and output is 2
     */
    static calcColumnOfSquare(squareID: number): number
    {
        return squareID % 8 === 0 ? 8 : squareID % 8;
    }

    /**
     * Calculates the column of a square
     * @example input is 64 and output is 8, input is 8 and output is 1
     */
    static calcRowOfSquare(squareID: number): number
    {
        return Math.ceil(squareID / 8);
    }
}