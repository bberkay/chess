export class Locator{
    /**
     * This class contains static methods that are used to calculate the row and column of a square.
     */

    /**
     * Calculates the row of a square
     * @example getRow(64), return 8
     * @example getRow(15), return 2
     */
    static getRow(squareID: number): number
    {
        return Math.ceil(squareID / 8);
    }

    /**
     * Calculates the column of a square
     * @example getColumn(64), return 8
     * @example getColumn(15), return 7
     */
    static getColumn(squareID: number): number
    {
        return squareID % 8 === 0 ? 8 : squareID % 8;
    }
}