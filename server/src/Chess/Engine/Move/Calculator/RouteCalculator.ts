import { Color, PieceType, Square } from "../../../Types";
import { MoveRoute, Piece, Route } from "../../Types";
import { DirectionCalculator } from "./DirectionCalculator.ts";
import { Flattener } from "../Utils/Flattener.ts";
import { BoardQuerier } from "../../Board/BoardQuerier.ts";

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
export class RouteCalculator {
    /**
     * This function returns the route of the piece on given square.
     * For more information, please check the class description.
     */
    public static getRouteBySquare(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        const piece: Piece | null = board.getPieceOnSquare(square);
        if (!piece) return {};

        switch (piece.getType()) {
            case PieceType.Pawn:
                return this.getPawnRoute(board, square, pieceSensitivity);
            case PieceType.Knight:
                return this.getKnightRoute(board, square, pieceSensitivity);
            case PieceType.Bishop:
                return this.getBishopRoute(board, square, pieceSensitivity);
            case PieceType.Rook:
                return this.getRookRoute(board, square, pieceSensitivity);
            case PieceType.Queen:
                return this.getQueenRoute(board, square, pieceSensitivity);
            case PieceType.King:
                return this.getKingRoute(board, square, pieceSensitivity);
            default:
                return {};
        }
    }

    /**
     * This function returns pawn route scheme(2 horizontal and 1 diagonal for each direction).
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getPawnRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        // Get first 2 vertical squares and first 1 diagonal squares.
        return {
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                null,
                2,
                pieceSensitivity
            ),
            ...DirectionCalculator.getDiagonalSquares(
                board,
                square,
                board.getColorBySquare(square) ??
                    board.getTurnColor(),
                1,
                pieceSensitivity
            ),
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getKnightRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        /**
         * Find player's color by given square. If square has no piece,
         * then use BoardQuerier.
         */
        const playerColor =
            board.getColorBySquare(square) ??
            board.getTurnColor();

        // Knight can't move to any direction, it can move only 2 horizontal and 1 vertical or 2 vertical and 1 horizontal.
        // So, we can't return Path type here.
        const route: { [MoveRoute.L]: Square[] } = { [MoveRoute.L]: [] };

        // Get the 2 horizontal and vertical squares.
        const firstPath = {
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                playerColor,
                2,
                false
            ),
            ...DirectionCalculator.getHorizontalSquares(
                board,
                square,
                playerColor,
                2,
                false
            ),
        };

        /**
         * Now, get first squares of the firstPath's horizontal and vertical directions.
         * Example, if the firstPath is {MoveRoute.Bottom: [Square.b1, Square.b2], MoveRoute.Right: [Square.b2, Square.c2], ...},
         * then the route will be [Square.c2, Square.a2, Square.c3, Square.c1]. Square.c2, Square.a2 are right and left of
         * MoveRoute.Bottom squares and Square.c3, Square.c1 are top and bottom of MoveRoute.Right squares.
         */
        for (const path in firstPath) {
            // If knight can't move 2 horizontal or 2 vertical, then skip the path.
            if (firstPath[path as MoveRoute]!.length != 2) continue;

            /**
             * Get the last square of the path. Example, if the path is MoveRoute.Bottom and the squares are
             * [Square.b1, Square.b2], then the last square is Square.b2.
             */
            const lastSquare =
                firstPath[path as MoveRoute]![
                    firstPath[path as MoveRoute]!.length - 1
                ];

            /**
             * Get the horizontal and vertical squares of the last square of the path.
             * Example, if the path is MoveRoute.Bottom and the squares are [Square.b1, Square.b2],
             * then the horizontal squares of the Square.b2 are [Square.c2, Square.a2] and the vertical squares of the Square.b2 are
             * [Square.b3, Square.b1].
             */
            let lastRoute: Route | null = null;

            // If the path is vertical, then get the horizontal squares of last square of the path.
            if (path == MoveRoute.Bottom || path == MoveRoute.Top)
                lastRoute = DirectionCalculator.getHorizontalSquares(
                    board,
                    lastSquare,
                    playerColor,
                    1,
                    pieceSensitivity
                );
            // If the path is horizontal, then get the vertical squares of last square of the path.
            else
                lastRoute = DirectionCalculator.getVerticalSquares(
                    board,
                    lastSquare,
                    playerColor,
                    1,
                    pieceSensitivity
                );

            // Update the route
            route[MoveRoute.L] = Flattener.flattenSquares(lastRoute).concat(
                route[MoveRoute.L]
            );
        }

        return route;
    }

    /**
     * This function returns bishop route scheme(diagonal).
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getBishopRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        /**
         * Get the diagonal squares with color of square
         */
        return DirectionCalculator.getDiagonalSquares(
            board,
            square,
            board.getColorBySquare(square) ??
                board.getTurnColor(),
            null,
            pieceSensitivity
        );
    }

    /**
     * This function returns rook route scheme(horizontal and vertical).
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getRookRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        const playerColor =
            board.getColorBySquare(square) ??
            board.getTurnColor();

        // Get the horizontal and vertical squares.
        return {
            ...DirectionCalculator.getHorizontalSquares(
                board,
                square,
                playerColor,
                null,
                pieceSensitivity
            ),
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                playerColor,
                null,
                pieceSensitivity
            ),
        };
    }

    /**
     * This function returns the rook and bishop route scheme(horizontal, vertical and diagonal).
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getQueenRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        const playerColor =
            board.getColorBySquare(square) ??
            board.getTurnColor();

        // Get the horizontal, vertical and diagonal squares.
        return {
            ...DirectionCalculator.getHorizontalSquares(
                board,
                square,
                playerColor,
                null,
                pieceSensitivity
            ),
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                playerColor,
                null,
                pieceSensitivity
            ),
            ...DirectionCalculator.getDiagonalSquares(
                board,
                square,
                playerColor,
                null,
                pieceSensitivity
            ),
        };
    }

    /**
     * This function returns the horizontal squares of the given square.
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getKingRoute(
        board: BoardQuerier,
        square: Square,
        pieceSensitivity: boolean = true
    ): Route {
        /**
         * Find player's color by given square. If square has no piece,
         * then use BoardQuerier.
         */
        const playerColor =
            board.getColorBySquare(square) ??
            board.getTurnColor();

        // Get the horizontal, vertical and diagonal squares but only one square away.
        return {
            ...DirectionCalculator.getHorizontalSquares(
                board,
                square,
                playerColor,
                1,
                pieceSensitivity
            ),
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                playerColor,
                1,
                pieceSensitivity
            ),
            ...DirectionCalculator.getDiagonalSquares(
                board,
                square,
                playerColor,
                1,
                pieceSensitivity
            ),
        };
    }

    /**
     * This function returns the horizontal, vertical and diagonal squares
     * of the given square.
     * For more information, please check the class description.
     * @See src/Chess/Engine/Move/Calculator/RouteCalculator.ts
     */
    public static getAllRoutes(
        board: BoardQuerier,
        square: Square,
        color: Color | null = null,
        distanceLimit: number | null = null,
        pieceSensitivity: boolean = true
    ): Route {
        /**
         * Find player's color by given square. If square has no piece,
         * then use BoardQuerier.
         */
        color =
            color ??
            board.getColorBySquare(square) ??
            board.getTurnColor();

        return {
            ...DirectionCalculator.getHorizontalSquares(
                board,
                square,
                color,
                distanceLimit,
                pieceSensitivity
            ),
            ...DirectionCalculator.getVerticalSquares(
                board,
                square,
                color,
                distanceLimit,
                pieceSensitivity
            ),
            ...DirectionCalculator.getDiagonalSquares(
                board,
                square,
                color,
                distanceLimit,
                pieceSensitivity
            ),
            ...RouteCalculator.getKnightRoute(board, square, false),
        };
    }
}
