import {Square} from "../../../Types";
import {MoveRoute} from "../../Types";

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
    static getRelative(relative: Square, relativeTo: Square): MoveRoute | null
    {
        const relativeRoute = relativeTo > relative
            ? {Vertical: MoveRoute.Top, Horizontal: MoveRoute.Left, LeftDiagonal: MoveRoute.TopLeft, RightDiagonal: MoveRoute.TopRight}
            : {Vertical: MoveRoute.Bottom, Horizontal: MoveRoute.Right, LeftDiagonal: MoveRoute.BottomRight, RightDiagonal: MoveRoute.BottomLeft};

        // If relative and relativeTo are in the same row then get horizontal route and return it.
        if(Locator.getRow(relative) == Locator.getRow(relativeTo))
            return relativeRoute.Horizontal;

        // If relative and relativeTo are in the same column then get vertical route and return it.
        if(Locator.getColumn(relative) == Locator.getColumn(relativeTo))
            return relativeRoute.Vertical;

        /**
         * Algorithm to find diagonal route:
         * 1. If distance between relative and relativeTo is multiple of 9, then
         * the relative is in top right or bottom left of the piece.
         * 2. If distance between relative and relativeTo is multiple of 7, then
         * the relative is in top left or bottom right of the piece.
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
        if(Locator.getColumn(relative) - Locator.getRow(relative) == Locator.getColumn(relativeTo) - Locator.getRow(relativeTo))
        {
            const distance: number = Math.abs(relativeTo! - relative);
            if(distance % 9 == 0)
                return relativeRoute.LeftDiagonal; // Top Left to Bottom Right
            else if(distance % 7 == 0)
                return relativeRoute.RightDiagonal; // Top Right to Bottom Left
        }

        return null;
    }

    /**
     * Get the next square of the given square list and route.
     * @example getNext([Square.e4, Square.e5, Square.e6], MoveRoute.Top), return Square.e7
     * @example getNext([Square.e4, Square.e5, Square.e6], MoveRoute.Bottom), return Square.e3
     * @example getNext([], MoveRoute.Top, Square.e3), return Square.e4
     * @example getNext([], MoveRoute.Bottom, Square.e3), return Square.e2
     */
    static getNext(squares: Square[], route: MoveRoute, startSquare: Square | null = null): Square
    {
        if(squares.length == 0 && !startSquare)
            throw new Error("Squares and startSquare cannot be empty at the same time.");

        // If squares is empty, the define the start square as the last square of the given squares.
        let lastSquare: Square = squares.length == 0 ? startSquare! : squares[squares.length - 1];

        // Get the next square of the given route.
        switch (route) {
            case MoveRoute.Top:
                return lastSquare - 8;
            case MoveRoute.TopRight:
                return lastSquare - 7;
            case MoveRoute.Right:
                return lastSquare + 1;
            case MoveRoute.BottomRight:
                return lastSquare + 9;
            case MoveRoute.Bottom:
                return lastSquare + 8;
            case MoveRoute.BottomLeft:
                return lastSquare + 7;
            case MoveRoute.Left:
                return lastSquare - 1;
            case MoveRoute.TopLeft:
                return lastSquare - 9;
        }

        throw new Error("Invalid route.");
    }
}