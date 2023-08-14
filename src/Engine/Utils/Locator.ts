import { Square } from "../../Types";

export class Locator{
    /**
     * This class contains static methods that are used to calculate the row and column of a square.
     */

    /**
     * Calculates the row of a square
     * @example getRow(64), return 8
     * @example getRow(Square.g7), return 2
     */
    static getRow(squareID: Square|number): number
    {
        return Math.ceil(squareID / 8);
    }

    /**
     * Calculates the column of a square
     * @example getColumn(64), return 8
     * @example getColumn(Square.g7), return 7
     */
    static getColumn(squareID: Square|number): number
    {
        return squareID % 8 === 0 ? 8 : squareID % 8;
    }
}