import { Square } from "../../../Types";
import { MoveRoute } from "../../../Types/Engine";

/**
 * This class contains static methods that are used to calculate the row and column of a square.
 */
export class Locator{

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

    /**
     * Get opposite route of the given route.
     * @example getOppositeRoute(MoveRoute.TopLeft), return MoveRoute.BottomRight
     * @example getOppositeRoute(MoveRoute.Top), return MoveRoute.Bottom
     */
    static getOpposite(route: MoveRoute): MoveRoute
    {
        // Init the opposite route scheme.
        const oppositeRoutes: {[key in MoveRoute]?: MoveRoute} = {
            [MoveRoute.Top]: MoveRoute.Bottom,
            [MoveRoute.TopRight]: MoveRoute.BottomLeft,
            [MoveRoute.Right]: MoveRoute.Left,
            [MoveRoute.BottomRight]: MoveRoute.TopLeft,
            [MoveRoute.Bottom]: MoveRoute.Top,
            [MoveRoute.BottomLeft]: MoveRoute.TopRight,
            [MoveRoute.Left]: MoveRoute.Right,
            [MoveRoute.TopLeft]: MoveRoute.BottomRight
        };

        return oppositeRoutes[route]!;
    }

    /**
     * Get relative route of the piece.
     *
     * @example getRelative(Square.e4, Square.c6), return MoveRoute.TopLeft
     * @example getRelative(Square.e4, Square.e6), return MoveRoute.Top
     *
     * @see for more information, check src/Engine/Utils/Locator.ts
     */
    static getRelative(relativeTo: Square, relative: Square): MoveRoute | null
    {
        /**
         * Algorithm:
         * 1. If distance between relative and relativeTo is multiple of 8, then
         * the relative is in top or bottom of the relativeTo(we can find is top
         * or bottom by simply comparing the squares of the relative and relativeTo).
         * 2. If distance between relative and relativeTo is multiple of 9, then
         * the relative is in top right or bottom left of the piece.
         * 3. If distance between relative and relativeTo is multiple of 7, then
         * the relative is in top left or bottom right of the piece.
         * 4. If distance between relative and relativeTo is smaller than 8, then
         * the relative is in right or left of the piece.
         *
         * The ASCII table of the formula(P is any piece):
         * -9 -8 -7
         * -1  P  1
         * +7 +8 +9
         *
         * The ASCII table of the current example(P is pawn and 29, K is king and 36):
         * 20 21 22
         * 28  P 30
         * K  37 38
         *
         * @see For more information about square numbers, check square enum in src/Types.ts
         */
        let relativeRoute: MoveRoute | null = null;

        // Distance between relative and relativeTo squares.
        const distance: number = Math.abs(relativeTo! - relative);

        // Now calculate the relative route with the distance and formula.
        if(distance % 8 == 0)
            relativeRoute = relativeTo! > relative ? MoveRoute.Top : MoveRoute.Bottom;
        else if(distance % 9 == 0)
            relativeRoute = relativeTo! > relative ? MoveRoute.TopLeft : MoveRoute.BottomRight;
        else if(distance % 7 == 0)
            relativeRoute = relativeTo! > relative ? MoveRoute.TopRight : MoveRoute.BottomLeft;
        else if(distance < 8)
            relativeRoute = relativeTo! > relative ? MoveRoute.Left : MoveRoute.Right;

        // Return the relative route if it's null or not.
        return relativeRoute;
    }
}