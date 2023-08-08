import {MoveRoute, Square} from "../../Enums";
import { Path } from "../../Types";
import {Calculator} from "../../Utils/Calculator.ts";
import {Game} from "../../Global/Game";
import {BoardNavigator} from "./BoardNavigator.ts";

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
    protected getDiagonalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {
        // step is used to set the next square of the given square. For example, if step is -7 and
        // given square is Square.e5(29), then next square is Square.f4(22), next next square is
        // Square.g3(15) etc.
        // For more information, please check the Square enum.
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
    protected getHorizontalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {
        // step is used to set the next square of the given square. For example, if step is 1 and
        // given square is Square.e5(29), then next square is Square.f5(30), next next square is
        // Square.g5(31) etc.
        // For more information, please check the Square enum.
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
    protected getVerticalSquares(square: Square, distanceLimit: number | null = null, pieceSensitivity: boolean | null = true): Path
    {
        // step is used to set the next square of the given square. For example, if step is 8 and
        // given square is Square.e5(29), then next square is Square.e6(37), next next square is
        // Square.e7(45) etc.
        // For more information, please check the Square enum.
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
        // Get the row and column of the given square.
        const rowOfSquare = Calculator.calculateRowOfSquare(square);
        const columnOfSquare = Calculator.calculateColumnOfSquare(square);

        /**
         * This function checks if the given row and column is on the edge of the board.
         */
        function isEdgeOfBoard(row: number, column: number): boolean
        {
            return row == 1 || row == 8 || column == 1 || column == 8;
        }

        let squares: Array<Square> = [];

        // If step is positive, it means we are going to the right or bottom.
        // If step is negative, it means we are going to the left or top.
        const limit = step < 0 ? 1 : 64;

        // This variable is used to count the steps for the distance limit.
        let stepCounter = 0;

        while(limit == square){
            // If piece sensitivity is false OR piece sensitivity true AND
            // if square has no player's piece then add the square to the array.
            if(!pieceSensitivity || (pieceSensitivity && !BoardNavigator.hasPiece(square, Game.getPlayerColor())))
                squares.push(square);

            // If distance limit is reached or the square is on the edge of the board or
            // if piece sensitivity is true AND if square has a piece, then break the loop.
            if(distanceLimit == stepCounter || isEdgeOfBoard(rowOfSquare, columnOfSquare) || (pieceSensitivity && BoardNavigator.hasPiece(square)))
                break;

            // Increase the step counter.
            stepCounter++;

            // If we are going to the right or bottom, increase the square by step.
            // If we are going to the left or top, decrease the square by step.
            square = limit == 64 ? square + step : square - step;
        }

        return squares;
    }
}