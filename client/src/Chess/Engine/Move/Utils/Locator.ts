import { Square } from "../../../Types";
import { MoveRoute } from "../../Types";

/**
 * This class contains static methods that are used to calculate the row and column of a square.
 */
export class Locator {
    /**
     * Calculates the row of a square
     * @example getRow(64), return 8
     * @example getRow(Square.g7), return 2
     */
    static getRow(squareID: Square | number): number {
        return Math.ceil(squareID / 8);
    }

    /**
     * Calculates the column of a square
     * @example getColumn(64), return 8
     * @example getColumn(Square.g7), return 7
     */
    static getColumn(squareID: Square | number): number {
        return squareID % 8 === 0 ? 8 : squareID % 8;
    }

    /**
     * Get opposite route of the given route.
     * @example getOppositeRoute(MoveRoute.TopLeft), return MoveRoute.BottomRight
     * @example getOppositeRoute(MoveRoute.Top), return MoveRoute.Bottom
     */
    static getOpposite(route: MoveRoute): MoveRoute {
        // Init the opposite route scheme.
        const oppositeRoutes: { [key in MoveRoute]?: MoveRoute } = {
            [MoveRoute.Top]: MoveRoute.Bottom,
            [MoveRoute.TopRight]: MoveRoute.BottomLeft,
            [MoveRoute.Right]: MoveRoute.Left,
            [MoveRoute.BottomRight]: MoveRoute.TopLeft,
            [MoveRoute.Bottom]: MoveRoute.Top,
            [MoveRoute.BottomLeft]: MoveRoute.TopRight,
            [MoveRoute.Left]: MoveRoute.Right,
            [MoveRoute.TopLeft]: MoveRoute.BottomRight,
        };

        return oppositeRoutes[route]!;
    }

    /**
     * Get relative route of the piece.
     *
     * @example getRelative(Square.e4, Square.c6), return MoveRoute.TopLeft
     * @example getRelative(Square.e4, Square.e6), return MoveRoute.Top
     *
     */
    static getRelative(relative: Square, relativeTo: Square): MoveRoute | null {
        const relativeRoute =
            relativeTo > relative
                ? {
                      Vertical: MoveRoute.Top,
                      Horizontal: MoveRoute.Left,
                      LeftDiagonal: MoveRoute.TopRight,
                      RightDiagonal: MoveRoute.TopLeft,
                  }
                : {
                      Vertical: MoveRoute.Bottom,
                      Horizontal: MoveRoute.Right,
                      LeftDiagonal: MoveRoute.BottomRight,
                      RightDiagonal: MoveRoute.BottomLeft,
                  };

        const relativeRow = Locator.getRow(relative);
        const relativeToRow = Locator.getRow(relativeTo);
        if (relativeRow == relativeToRow) return relativeRoute.Horizontal;

        const relativeColumn = Locator.getColumn(relative);
        const relativeToColumn = Locator.getColumn(relativeTo);
        if (relativeColumn == relativeToColumn) return relativeRoute.Vertical;

        if (
            Math.abs(relativeRow - relativeToRow) !=
            Math.abs(relativeColumn - relativeToColumn)
        )
            return null;

        return relativeColumn < relativeToColumn
            ? relativeRoute.RightDiagonal
            : relativeRoute.LeftDiagonal;
    }

    /**
     * Get the next square of the given square list and route.
     * @example getNext([Square.e4, Square.e5, Square.e6], MoveRoute.Top), return Square.e7
     * @example getNext([Square.e4, Square.e5, Square.e6], MoveRoute.Bottom), return Square.e3
     * @example getNext([], MoveRoute.Top, Square.e3), return Square.e4
     * @example getNext([], MoveRoute.Bottom, Square.e3), return Square.e2
     */
    static getNext(
        squares: Square[],
        route: MoveRoute,
        startSquare: Square | null = null
    ): Square {
        if (squares.length == 0 && !startSquare)
            throw new Error(
                "Squares and startSquare cannot be empty at the same time."
            );

        // If squares is empty, the define the start square as the last square of the given squares.
        const lastSquare: Square =
            squares.length == 0 ? startSquare! : squares[squares.length - 1];

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
