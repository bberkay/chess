import { Path, Square, MoveRoute } from "../../../Types.ts";
import { PathCalculator } from "./PathCalculator.ts";
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
    private pathCalculator: PathCalculator;

    /**
     * @description Constructor of the class.
     */
    constructor() {
        this.pathCalculator = new PathCalculator();
    }

    /**
     * This function returns pawn route scheme(2 horizontal and 1 diagonal for each direction).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getPawnRoute(square: Square): Path
    {
        // Get first 2 vertical squares and first 1 diagonal squares.
        return {
            ...this.pathCalculator.getVerticalSquares(square, 2),
            ...this.pathCalculator.getDiagonalSquares(square, 1)
        }
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getKnightRoute(square: Square): Array<Square>
    {

        // Knight can't move to any direction, it can move only 2 horizontal and 1 vertical or 2 vertical and 1 horizontal.
        // So, we can't return Path type here.
        let route: Array<Square> = [];

        // Get the 2 horizontal and vertical squares.
        const firstPath = {
            ...this.pathCalculator.getVerticalSquares(square, 2, false),
            ...this.pathCalculator.getHorizontalSquares(square, 2, false)
        }

        // Now, get first squares of the firstPath's horizontal and vertical directions.
        // Example, if the firstPath is {MoveRoute.Bottom: [Square.b1, Square.b2], MoveRoute.Right: [Square.b2, Square.c2], ...},
        // then the route will be [Square.c2, Square.a2, Square.c3, Square.c1]. Square.c2, Square.a2 are right and left of
        // MoveRoute.Bottom squares and Square.c3, Square.c1 are top and bottom of MoveRoute.Right squares.
        for (const path in firstPath) {
            if(firstPath[path as MoveRoute]!.length == 2){ // If the path has 2 squares
                if(path == MoveRoute.Bottom || path == MoveRoute.Top) // If the path is vertical, then get the horizontal squares of last square of the path.
                    route = Converter.convertPathToMoves(this.pathCalculator.getHorizontalSquares(firstPath[path as MoveRoute]![1], 1)).concat(route);
                else // If the path is horizontal, then get the vertical squares of last square of the path.
                    route = Converter.convertPathToMoves(this.pathCalculator.getVerticalSquares(firstPath[path as MoveRoute]![1], 1)).concat(route);
            }
        }

        return route;
    }

    /**
     * This function returns bishop route scheme(diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getBishopRoute(square: Square): Path
    {
        // Get the diagonal squares.
        return this.pathCalculator.getDiagonalSquares(square);
    }

    /**
     * This function returns rook route scheme(horizontal and vertical).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getRookRoute(square: Square): Path
    {
        // Get the horizontal and vertical squares.
        return {
            ...this.pathCalculator.getHorizontalSquares(square),
            ...this.pathCalculator.getVerticalSquares(square)
        };
    }

    /**
     * This function returns the rook and bishop route scheme(horizontal, vertical and diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getQueenRoute(square: Square): Path
    {
        // Get the horizontal, vertical and diagonal squares.
        return {
            ...this.pathCalculator.getHorizontalSquares(square),
            ...this.pathCalculator.getVerticalSquares(square),
            ...this.pathCalculator.getDiagonalSquares(square)
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public getKingRoute(square: Square): Path
    {
        // Get the horizontal, vertical and diagonal squares but only one square away.
        return {
            ...this.pathCalculator.getHorizontalSquares(square, 1),
            ...this.pathCalculator.getVerticalSquares(square, 1),
            ...this.pathCalculator.getDiagonalSquares(square, 1)
        };
    }
}