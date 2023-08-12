export class Locator{
    /**
     * This class contains static methods that are used to calculate the row and column of a square.
     */

    // FIXME: Burada bir yanlışlık yapılmış ve ters yazılmış bu sebeple path calculator'da hata oluşursa buraya bakılabilir.

    /**
     * Calculates the row of a square
     * @example getRow(64), return 8
     * @example getRow(15), return 2
     */
    static getRow(squareID: number): number
    {
        return squareID % 8 === 0 ? 8 : squareID % 8;
    }

    /**
     * Calculates the column of a square
     * @example getColumn(8), return 1
     * @example getColumn(9), return 2
     */
    static getColumn(squareID: number): number
    {
        return Math.ceil(squareID / 8);
    }
}