import { Piece, Square, Path, MoveRoute } from "../../../Types.ts";
import { Locator } from "../../Utils/Locator.ts";
import { BoardManager } from "../../../Managers/BoardManager.ts";

export class PathCalculator {
    /**
     * This class calculates the path and distance of the given square.
     * Also piece sensitivity can be set to true or false (true means,
     * finish the calculation if the enemy piece is in the target square).
     *
     * Example: pathCalculator.getDiagonalSquares(Square.e5, 2, true);
     * Scenarios:
     * 1. If there is no enemy piece in any diagonal path, return:
     * {
     *  bottomRight: [Square.f4, Square.g3],
     *  topRight: [Square.f6, Square.g7],
     *  topLeft: [Square.d6, Square.c7],
     *  bottomLeft: [Square.d4, Square.c3]
     * }
     * 2. If Square.f6 and Square.d6 have enemy piece, return:
     * {
     *  bottomRight: [Square.f4, Square.g3],
     *  topRight: [Square.f6],
     *  topLeft: [Square.d6, Square.c7],
     *  bottomLeft: [Square.d6]
     * }
     * ...
     */

    /**
     * This function returns the diagonal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/PathCalculator.ts
     */
    public getDiagonalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {
        /**
         * Step is used to set the next square of the given square. For example, if step is -7 and
         * given square is Square.e5(29), then next square is Square.f4(22), next next square is
         * Square.g3(15) etc.
         * @see For more information, please check the Square enum.
         */
        return {
            [MoveRoute.BottomRight]: this.traverseInPath(square, 9, distanceLimit, pieceSensitivity),
            [MoveRoute.TopRight]: this.traverseInPath(square, -7, distanceLimit, pieceSensitivity),
            [MoveRoute.TopLeft]: this.traverseInPath(square, -9, distanceLimit, pieceSensitivity),
            [MoveRoute.BottomLeft]: this.traverseInPath(square, 7, distanceLimit, pieceSensitivity),
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/PathCalculator.ts
     */
    public getHorizontalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {
        /**
         * Step is used to set the next square of the given square. For example, if step is 1 and
         * given square is Square.e5(29), then next square is Square.f5(30), next next square is
         * Square.g5(31) etc.
         * @see For more information, please check the Square enum.
         */
        return {
            [MoveRoute.Right]: this.traverseInPath(square, 1, distanceLimit, pieceSensitivity),
            [MoveRoute.Left]: this.traverseInPath(square, -1, distanceLimit, pieceSensitivity),
        };
    }

    /**
     * This function returns the vertical squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/PathCalculator.ts
     */
    public getVerticalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {

        /**
         * Step is used to set the next square of the given square. For example, if step is 8 and
         * given square is Square.e5(29), then next square is Square.e6(37), next next square is
         * Square.e7(45) etc.
         * @see For more information, please check the Square enum.
         */
        return {
            [MoveRoute.Bottom]: this.traverseInPath(square, 8, distanceLimit, pieceSensitivity),
            [MoveRoute.Top]: this.traverseInPath(square, -8, distanceLimit, pieceSensitivity),
        };
    }


    /**
     * Traverse in the given path(by given starter square and step for direction) and return the squares.
     * For more information, please check the class description.
     * @See src/Engine/Core/PathCalculator.ts
     */
    private traverseInPath(square: Square, step: number, distanceLimit: number | null, pieceSensitivity: boolean | null): Array<Square>
    {
        // This variable is used to check if the edge is changed.
        // For more information, please check the isEdgeChanged function.
        let prevRow: number = Locator.getRow(square);
        let prevColumn: number = Locator.getColumn(square);

        /**
         * This function checks if the edge is changed or not. For example,
         * If the given square is Square.h3(48) and step is 1, then the next square
         * is Square.a2(49). In this case, the edge is changed.
         */
        function isEdgeChanged(square: Square): boolean
        {
            // Get the current row and column of the square.
            let currentRow = Locator.getRow(square);
            let currentColumn = Locator.getColumn(square);

            // If the previous row and column is far away from the current row and column, then the edge is changed.
            if(prevRow > currentRow + 1 || prevRow < currentRow - 1 || prevColumn > currentColumn + 1 || prevColumn < currentColumn - 1)
                return true;

            // Update the previous row and column.
            prevRow = currentRow;
            prevColumn = currentColumn;

            return false;
        }

        let squares: Array<Square> = [];

        // If piece sensitivity is true, then get the piece of the given square(for color).
        const piece: Piece | null = pieceSensitivity ? BoardManager.getPiece(square) : null;

        // This variable is used to count the steps for the distance limit.
        let stepCounter = 0;

        while((square + step) <= 64 && (square + step) >= 1){
            // Set the next square. For example, if step is 1 and given square is Square.e5(29),
            // then next square is Square.f5(30). Also, We are doing this operation before the
            // push operation because we don't want to add the given square itself to the array.
            square += step;

            // If distance limit is reached or the square is on the edge of the board or
            // if piece sensitivity is true AND if square has a piece, then break the loop.
            if(distanceLimit == stepCounter || isEdgeChanged(square))
                break;

            // If piece sensitivity is false OR piece sensitivity true AND
            // if square has enemy's piece then add the square to the array.
            if(!pieceSensitivity || (pieceSensitivity && !BoardManager.hasPiece(square, piece!.getColor())))
                squares.push(square);

            // If piece sensitivity is true AND if square has a piece(enemy or player), then break the loop.
            // Because we can't go further.
            if(pieceSensitivity && BoardManager.hasPiece(square))
                break;

            // Increase the step counter.
            stepCounter++;
        }

        return squares;
    }
}