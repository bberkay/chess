import {Square, MoveRoute, Route} from "../../../Types.ts";
import { DirectionCalculator } from "./DirectionCalculator.ts";
import { Converter } from "../../../Utils/Converter.ts";

export class RouteCalculator{
    /**
     * This class calculates the route of the given piece.
     *
     * Example: routeCalculator.getPawnRoute(Square.b2, Color.White);
     * Scenarios:
     * 1. First move of pawn, Square.b3 and Square.b4 are empty, Square.a4 or Square.c4
     * have no enemy piece, then return [Square.b3, Square.b4].
     * 3. Not first move of pawn, Square.b3 is empty, Square.b4 and Square.c3 has enemy piece,
     * then return [Square.b3, Square.c3].
     * ...
     *
     * Note: This function does not control check scenarios(it means, piece will not protect the king).
     * It only calculates the route. So, please use this class with MoveEngine class.
     */

    /**
     * @description This class contains column, row and diagonal path calculates methods for the given square.
     * @see src/Engine/Core/Calculator/RouteCalculator.ts
     */
    private directionCalculator: DirectionCalculator = new DirectionCalculator();

    /**
     * This function returns pawn route scheme(2 horizontal and 1 diagonal for each direction).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getPawnRoute(square: Square): Route
    {
        // Get first 2 vertical squares and first 1 diagonal squares.
        return {
            ...this.directionCalculator.getVerticalSquares(square, 2),
            ...this.directionCalculator.getDiagonalSquares(square, 1)
        }
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getKnightRoute(square: Square): Route
    {

        // Knight can't move to any direction, it can move only 2 horizontal and 1 vertical or 2 vertical and 1 horizontal.
        // So, we can't return Path type here.
        let route: { [MoveRoute.L]: Square[] } = { [MoveRoute.L]: [] };

        // Get the 2 horizontal and vertical squares.
        const firstPath = {
            ...this.directionCalculator.getVerticalSquares(square, 2, false),
            ...this.directionCalculator.getHorizontalSquares(square, 2, false)
        }

        /**
         * Now, get first squares of the firstPath's horizontal and vertical directions.
         * Example, if the firstPath is {MoveRoute.Bottom: [Square.b1, Square.b2], MoveRoute.Right: [Square.b2, Square.c2], ...},
         * then the route will be [Square.c2, Square.a2, Square.c3, Square.c1]. Square.c2, Square.a2 are right and left of
         * MoveRoute.Bottom squares and Square.c3, Square.c1 are top and bottom of MoveRoute.Right squares.
         */
        for (const path in firstPath) {
            if(firstPath[path as MoveRoute]!.length == 2){ // If the path has 2 squares
                if(path == MoveRoute.Bottom || path == MoveRoute.Top) // If the path is vertical, then get the horizontal squares of last square of the path.
                    route[MoveRoute.L] = Converter.convertRouteToSquareArray(this.directionCalculator.getHorizontalSquares(firstPath[path as MoveRoute]![1], 1)).concat(route[MoveRoute.L]);
                else // If the path is horizontal, then get the vertical squares of last square of the path.
                    route[MoveRoute.L] = Converter.convertRouteToSquareArray(this.directionCalculator.getVerticalSquares(firstPath[path as MoveRoute]![1], 1)).concat(route[MoveRoute.L]);
            }
        }

        return route;
    }

    /**
     * This function returns bishop route scheme(diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getBishopRoute(square: Square): Route
    {
        // Get the diagonal squares.
        return this.directionCalculator.getDiagonalSquares(square);
    }

    /**
     * This function returns rook route scheme(horizontal and vertical).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getRookRoute(square: Square): Route
    {
        // Get the horizontal and vertical squares.
        return {
            ...this.directionCalculator.getHorizontalSquares(square),
            ...this.directionCalculator.getVerticalSquares(square)
        };
    }

    /**
     * This function returns the rook and bishop route scheme(horizontal, vertical and diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getQueenRoute(square: Square): Route
    {
        // Get the horizontal, vertical and diagonal squares.
        return {
            ...this.directionCalculator.getHorizontalSquares(square),
            ...this.directionCalculator.getVerticalSquares(square),
            ...this.directionCalculator.getDiagonalSquares(square)
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getKingRoute(square: Square): Route
    {
        // Get the horizontal, vertical and diagonal squares but only one square away.
        return {
            ...this.directionCalculator.getHorizontalSquares(square, 1),
            ...this.directionCalculator.getVerticalSquares(square, 1),
            ...this.directionCalculator.getDiagonalSquares(square, 1)
        };
    }
}