import { Square, Color } from "Types";
import { MoveRoute, Route } from "Types/Engine";
import { DirectionCalculator } from "./DirectionCalculator.ts";
import { Flattener } from "Engine/Core/Utils/Flattener.ts";
import { BoardQueryer } from "Engine/Core/Board/BoardQueryer.ts";
import { StateInspector } from "Engine/Core/State/StateInspector.ts";

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
export class RouteCalculator{

    /**
     * This function returns pawn route scheme(2 horizontal and 1 diagonal for each direction).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getPawnRoute(square: Square): Route
    {
        /**
         * Find player's color by given square. If square has no piece,
         * then use StateManager.
         */
        const safeColor: Color = BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor();

        // Get first 2 vertical squares and first 1 diagonal squares.
        return {
            ...DirectionCalculator.getVerticalSquares(square, safeColor,2),
            ...DirectionCalculator.getDiagonalSquares(square, safeColor, 1)
        }
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getKnightRoute(square: Square): Route
    {
        /**
         * Find player's color by given square. If square has no piece,
         * then use StateManager.
         */
        const safeColor: Color = BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor();

        // Knight can't move to any direction, it can move only 2 horizontal and 1 vertical or 2 vertical and 1 horizontal.
        // So, we can't return Path type here.
        let route: { [MoveRoute.L]: Square[] } = { [MoveRoute.L]: [] };

        // Get the 2 horizontal and vertical squares.
        const firstPath = {
            ...DirectionCalculator.getVerticalSquares(square, safeColor,2, false),
            ...DirectionCalculator.getHorizontalSquares(square, safeColor, 2, false)
        }

        /**
         * Now, get first squares of the firstPath's horizontal and vertical directions.
         * Example, if the firstPath is {MoveRoute.Bottom: [Square.b1, Square.b2], MoveRoute.Right: [Square.b2, Square.c2], ...},
         * then the route will be [Square.c2, Square.a2, Square.c3, Square.c1]. Square.c2, Square.a2 are right and left of
         * MoveRoute.Bottom squares and Square.c3, Square.c1 are top and bottom of MoveRoute.Right squares.
         */
        for (const path in firstPath) {
            /**
             * Get the last square of the path. Example, if the path is MoveRoute.Bottom and the squares are
             * [Square.b1, Square.b2], then the last square is Square.b2.
             */
            const lastSquare = firstPath[path as MoveRoute]![firstPath[path as MoveRoute]!.length - 1];

            /**
             * Get the horizontal and vertical squares of the last square of the path.
             * Example, if the path is MoveRoute.Bottom and the squares are [Square.b1, Square.b2],
             * then the horizontal squares of the Square.b2 are [Square.c2, Square.a2] and the vertical squares of the Square.b2 are
             * [Square.b3, Square.b1].
             */
            let lastRoute: Route | null = null;

            // If the path is vertical, then get the horizontal squares of last square of the path.
            if(path == MoveRoute.Bottom || path == MoveRoute.Top)
                lastRoute = DirectionCalculator.getHorizontalSquares(lastSquare, safeColor, 1);
            else // If the path is horizontal, then get the vertical squares of last square of the path.
                lastRoute = DirectionCalculator.getVerticalSquares(lastSquare, safeColor, 1);

            // Update the route
            route[MoveRoute.L] = Flattener.flattenRoute(lastRoute).concat(route[MoveRoute.L]);
        }

        return route;
    }

    /**
     * This function returns bishop route scheme(diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getBishopRoute(square: Square): Route
    {
        /**
         * Get the diagonal squares with color of square. If square has no piece,
         * then use StateManager.
         */
        return DirectionCalculator.getDiagonalSquares(square, BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor());
    }

    /**
     * This function returns rook route scheme(horizontal and vertical).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getRookRoute(square: Square): Route
    {
        /**
         * Find player's color by given square. If square has no piece,
         * then use StateManager.
         */
        const safeColor: Color = BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor();

        // Get the horizontal and vertical squares.
        return {
            ...DirectionCalculator.getHorizontalSquares(square, safeColor),
            ...DirectionCalculator.getVerticalSquares(square, safeColor)
        };
    }

    /**
     * This function returns the rook and bishop route scheme(horizontal, vertical and diagonal).
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getQueenRoute(square: Square): Route
    {
        /**
         * Find player's color by given square. If square has no piece,
         * then use StateManager.
         */
        const safeColor: Color = BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor();

        // Get the horizontal, vertical and diagonal squares.
        return {
            ...DirectionCalculator.getHorizontalSquares(square, safeColor),
            ...DirectionCalculator.getVerticalSquares(square, safeColor),
            ...DirectionCalculator.getDiagonalSquares(square, safeColor)
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Engine/Core/RouteCalculator.ts
     */
    public static getKingRoute(square: Square): Route
    {
        /**
         * Find player's color by given square. If square has no piece,
         * then use StateManager.
         */
        const safeColor: Color = BoardQueryer.getColor(square) ?? StateInspector.getPlayerColor();

        // Get the horizontal, vertical and diagonal squares but only one square away.
        return {
            ...DirectionCalculator.getHorizontalSquares(square, safeColor, 1),
            ...DirectionCalculator.getVerticalSquares(square, safeColor, 1),
            ...DirectionCalculator.getDiagonalSquares(square, safeColor, 1)
        };
    }
}