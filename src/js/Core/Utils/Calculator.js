class Calculator{
    /**
     * @static
     * Calculate Column of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    static calcColumnOfSquare(square_id) {
        return square_id % 8 === 0 ? 8 : square_id % 8;
    }

    /**
     * @static
     * Calculate Row of Square
     * @param {int} square_id Square ID of the active piece
     * @returns {int}
     */
    static calcRowOfSquare(square_id) {
        return Math.ceil(square_id / 8);
    }
}