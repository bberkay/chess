import { Color, Moves, MoveType, PieceType, Square } from "../../Types";
import { MoveRoute, Piece, Route } from "../Types";
import { BoardQuerier } from "../Board/BoardQuerier.ts";
import { Locator } from "./Utils/Locator.ts";
import { RouteCalculator } from "./Calculator/RouteCalculator.ts";
import { Flattener } from "./Utils/Flattener.ts";
import { MoveExtender } from "./Helper/MoveExtender.ts";
import { MoveFilterer } from "./Helper/MoveFilterer.ts";

/**
 * This class calculates the possible moves of the pieces.
 */
export class MoveEngine {
    /**
     * Properties of the MoveEngine class.
     */
    private readonly moveFilterer: MoveFilterer;
    private readonly moveExtender: MoveExtender;
    private piece: Piece | null = null;
    private pieceSquare: Square | null = null;

    /**
     * Constructor of the MoveEngine class.
     */
    constructor() {
        this.moveFilterer = new MoveFilterer();
        this.moveExtender = new MoveExtender();
    }

    /**
     * Get the possible moves of the piece on the given square.
     */
    public getMoves(
        square: Square,
        pieceSensitivity: boolean = true
    ): Moves | null {
        /**
         * Check the given moves. If there is no move, then return null
         * otherwise return the given moves.
         */
        function hasAnyMove(moves: Moves | null): Moves | null {
            if (!moves) return null;

            // Check every move type.
            for (const moveType in moves) {
                if (moves[moveType as MoveType]!.length > 0) return moves;
            }

            return null;
        }

        // Get the piece on the given square.
        this.piece = BoardQuerier.getPieceOnSquare(square);
        this.pieceSquare = square;

        // If there is no piece on the given square, return null;
        if (!this.piece) return null;

        /**
         * If there is a piece on the given square, get
         * the possible moves of the piece by its type.
         */
        switch (this.piece.getType()) {
            case PieceType.Pawn:
                return hasAnyMove(this.getPawnMoves(pieceSensitivity));
            case PieceType.Knight:
                return hasAnyMove(this.getKnightMoves(pieceSensitivity));
            case PieceType.Bishop:
                return hasAnyMove(this.getBishopMoves(pieceSensitivity));
            case PieceType.Rook:
                return hasAnyMove(this.getRookMoves(pieceSensitivity));
            case PieceType.Queen:
                return hasAnyMove(this.getQueenMoves(pieceSensitivity));
            case PieceType.King:
                return hasAnyMove(this.getKingMoves(pieceSensitivity));
            default:
                return null;
        }
    }

    /**
     * Get the possible moves of the pawn on the given square.
     */
    private getPawnMoves(pieceSensitivity: boolean = true): Moves | null {
        // Initialize the moves of the pawn.
        const moves: Moves = {
            [MoveType.Normal]: [],
            [MoveType.EnPassant]: [],
            [MoveType.Promotion]: [],
        };

        // Find possible moves of the pawn.
        const route: Route = RouteCalculator.getPawnRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;

        /**************************************************************************
         * Filter the moves of the pawn by the pawn's color, position
         * and has enemy status of the diagonal squares(these filter operations
         * made because pawn has different move capabilities by its color and position
         * also has a special move called en passant).
         *
         * @see for more information about pawn moves https://en.wikipedia.org/wiki/Pawn_(chess)
         **************************************************************************/

        // Find the pawn's color and enemy's color by the given square.
        const color: Color = this.piece!.getColor();
        const enemyColor: Color =
            color === Color.White ? Color.Black : Color.White;

        /**
         * Find routes of the pawn by its color. For example,
         * if the pawn is white, we need to get the top route of the pawn.
         * if the pawn is black, we need to get the bottom route of the pawn.
         */
        const moveDirection: Record<string, MoveRoute> =
            color === Color.White
                ? {
                      vertical: MoveRoute.Top,
                      leftDiagonal: MoveRoute.TopLeft,
                      rightDiagonal: MoveRoute.TopRight,
                  }
                : {
                      vertical: MoveRoute.Bottom,
                      leftDiagonal: MoveRoute.BottomLeft,
                      rightDiagonal: MoveRoute.BottomRight,
                  };

        /**
         * Filter the route by the pawn's color. For example,
         * if the pawn is white, we need to delete the bottom route of the pawn.
         * if the pawn is black, we need to delete the top route of the pawn.
         */
        for (const path in route) {
            if (
                path != moveDirection.vertical &&
                path != moveDirection.leftDiagonal &&
                path != moveDirection.rightDiagonal
            )
                delete route[path as MoveRoute];
        }

        // Filter two square toward move
        if (Locator.getRow(this.pieceSquare!) != (color == Color.White ? 7 : 2))
            route[moveDirection.vertical]!.splice(1, 1);

        /**
         * Filter diagonal routes by the pawn's color and has enemy status.
         *
         * If the diagonal squares has no enemy piece, then remove
         * the diagonal routes from the moves.
         */
        if (
            !BoardQuerier.isSquareHasPiece(
                route[moveDirection.leftDiagonal]![0],
                enemyColor
            ) &&
            pieceSensitivity
        )
            delete route[moveDirection.leftDiagonal];

        if (
            !BoardQuerier.isSquareHasPiece(
                route[moveDirection.rightDiagonal]![0],
                enemyColor
            ) &&
            pieceSensitivity
        )
            delete route[moveDirection.rightDiagonal];

        moves[MoveType.Normal] = Flattener.flattenSquares(
            pieceSensitivity
                ? this.moveFilterer.filterForKingSafety(
                      this.pieceSquare!,
                      this.piece!.getColor(),
                      route
                  )!
                : route
        );

        /**
         * Clear the pawn's routes. Because we will add en passant moves
         * to the pawn's moves. If we don't clear the pawn's routes, then
         * the pawn's moves will be duplicated for every move type. For example,
         * if the pawn has 2 normal moves, 1 en passant move and 1 promotion move,
         * then the pawn's moves will be 2 normal moves, 3 en passant moves(2 normal
         * + 1 en passant) and 4 promotion moves(2 normal + 1 en passant + 1 promotion).
         */
        for (const path in route) route[path as MoveRoute] = [];
        route[moveDirection.leftDiagonal] = [];
        route[moveDirection.rightDiagonal] = [];

        /**
         * Add en passant capability to the pawn. For example,
         * if the pawn is white and left en passant is available,
         * then add the left top square(current square id - 9) to the pawn's
         * moves. Also, if right en passant is available, then add the right
         * top square(current square id - 7) to the pawn's moves. For black
         * pawn, add the left bottom square(current square id + 7) and right
         * bottom square(current square id + 9) to the pawn's moves.
         *
         * @see for more information about square id check Square enum in src/Chess/Types/index.ts
         * @see for more information about en passant check src/Chess/Engine/Move/Helper/MoveExtender.ts
         */

        // Add left en passant move to the pawn's moves.
        const leftEnPassant: Square | null =
            this.moveExtender.getLeftEnPassantMove(
                this.pieceSquare!
            );
        if (leftEnPassant)
            route[moveDirection.leftDiagonal]!.push(leftEnPassant);

        // Add right en passant move to the pawn's moves.
        const rightEnPassant: Square | null =
            this.moveExtender.getRightEnPassantMove(
                this.pieceSquare!
            );
        if (rightEnPassant)
            route[moveDirection.rightDiagonal]!.push(rightEnPassant);

        // Add filtered(for king's safety) en passant moves to the pawn's moves.
        moves[MoveType.EnPassant] = Flattener.flattenSquares(
            pieceSensitivity
                ? this.moveFilterer.filterForKingSafety(
                      this.pieceSquare!,
                      this.piece!.getColor(),
                      route
                  )!
                : route
        );

        /**
         * Clear the pawn's routes. Because we will add promotion moves
         * to the pawn's moves. For more information check the en passant
         * section above.
         */
        for (const path in route) route[path as MoveRoute] = [];
        route[moveDirection.vertical] = [];

        /**
         * Add promotion capability to the pawn. For example,
         * if the pawn is white and is on the second row or black
         * and is on the seventh row. Change normal moves to promotion
         * moves.
         *
         * @see for more information about square id check Square enum in src/Chess/Types/index.ts
         * @see for more information about promotion check src/Chess/Engine/Move/Helper/MoveExtender.ts
         */

        if (
            Locator.getRow(this.pieceSquare!) == (color == Color.White ? 2 : 7)
        ) {
            moves[MoveType.Promotion] = moves[MoveType.Normal];
            moves[MoveType.Normal] = [];
        }

        return moves;
    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    private getKnightMoves(pieceSensitivity: boolean = true): Moves | null {
        const route: Route = RouteCalculator.getKnightRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;
        return {
            [MoveType.Normal]: Flattener.flattenSquares(
                pieceSensitivity
                    ? this.moveFilterer.filterForKingSafety(
                          this.pieceSquare!,
                          this.piece!.getColor(),
                          route
                      )
                    : route
            ),
        };
    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    private getBishopMoves(pieceSensitivity: boolean = true): Moves | null {
        const route: Route = RouteCalculator.getBishopRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;
        return {
            [MoveType.Normal]: Flattener.flattenSquares(
                pieceSensitivity
                    ? this.moveFilterer.filterForKingSafety(
                          this.pieceSquare!,
                          this.piece!.getColor(),
                          route
                      )
                    : route
            ),
        };
    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    private getRookMoves(pieceSensitivity: boolean = true): Moves | null {
        const route: Route = RouteCalculator.getRookRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;
        return {
            [MoveType.Normal]: Flattener.flattenSquares(
                pieceSensitivity
                    ? this.moveFilterer.filterForKingSafety(
                          this.pieceSquare!,
                          this.piece!.getColor(),
                          route
                      )
                    : route
            ),
        };
    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    private getQueenMoves(pieceSensitivity: boolean = true): Moves | null {
        const route: Route = RouteCalculator.getQueenRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;
        return {
            [MoveType.Normal]: Flattener.flattenSquares(
                pieceSensitivity
                    ? this.moveFilterer.filterForKingSafety(
                          this.pieceSquare!,
                          this.piece!.getColor(),
                          route
                      )
                    : route
            ),
        };
    }

    /**
     * Get the possible moves of the king on the given square.
     */
    private getKingMoves(pieceSensitivity: boolean = true): Moves | null {
        const moves: Moves = { [MoveType.Normal]: [], [MoveType.Castling]: [] };

        const route: Route = RouteCalculator.getKingRoute(
            this.pieceSquare!,
            pieceSensitivity
        );
        if (!route) return null;

        const color: Color = BoardQuerier.getPieceOnSquare(
            this.pieceSquare!
        )!.getColor();

        /**
         * Remove squares that are threatened by the enemy pieces so that
         * the king can't move to the threatened squares. For example,
         * if the king is on f3 and enemy's bishop is on e6, then remove
         * g4 from the king's route because g4 is threatened by the enemy's
         * bishop currently.
         */
        for (const square of Flattener.flattenSquares(route)) {
            if (
                !pieceSensitivity ||
                !BoardQuerier.isSquareThreatened(
                    square,
                    color == Color.White ? Color.Black : Color.White
                )
            )
                moves[MoveType.Normal]!.push(square);
        }

        /**
         * Example: King is on f3 and enemy's bishop is on d5.
         * Currently, g2 isn't threatened by the enemy's bishop. But king can't
         * move to the g2 because after the king's move, g2 will be threatened
         * by the enemy's bishop again. This code block prevents this situation.
         */
        const enemies: boolean | Square[] = pieceSensitivity
            ? BoardQuerier.isSquareThreatened(
                  this.pieceSquare!,
                  color == Color.White ? Color.Black : Color.White,
                  true
              )
            : false;
        if (moves[MoveType.Normal]!.length > 0 && enemies) {
            for (const enemySquare of enemies as Square[]) {
                if (
                    BoardQuerier.getPieceOnSquare(enemySquare)!.getType() ==
                        PieceType.Knight ||
                    BoardQuerier.getPieceOnSquare(enemySquare)!.getType() ==
                        PieceType.Pawn
                )
                    continue;

                const dangerousRoute: MoveRoute | null = Locator.getRelative(
                    this.pieceSquare!,
                    enemySquare
                );
                if (!dangerousRoute) continue;

                const dangerousMoveIndex: number = moves[
                    MoveType.Normal
                ]!.indexOf(route[dangerousRoute!]![0]);
                if (
                    dangerousRoute &&
                    Object.hasOwn(route, dangerousRoute) &&
                    route[dangerousRoute]!.length > 0 &&
                    dangerousMoveIndex != -1
                )
                    moves[MoveType.Normal]!.splice(dangerousMoveIndex, 1);
            }
        }

        /**
         * Add castling moves to the king's moves. For example,
         * If the king is white, add Square.a1 to king's left route
         * and Square.h1 to king's right route. If the king is black,
         * add Square.a8 to king's left route and Square.h8 to king's
         * right route.
         *
         * @see for more information src/Chess/Engine/Move/Helper/MoveExtender.ts
         */

        /**
         * Clear the king's routes. Because we will add castling moves
         * to the king's moves. If we don't clear the king's routes,
         * then king's normal moves also will be added to the king's
         * castling moves. For example, if the king has 2 normal moves
         * and 2 castling moves, then normal moves will be [Square.x1, Square.x2],
         * castling moves will be [Square.a1, Square.h1, Square.x1, Square.x2].
         */
        for (const path in route) route[path as MoveRoute] = [];

        const longCastling: Square | null =
            this.moveExtender.getLongCastlingMove(color, pieceSensitivity);
        if (longCastling) {
            route[MoveRoute.Left]!.push(longCastling);
            route[MoveRoute.Left]!.push(longCastling + 2);
        }

        const shortCastling: Square | null =
            this.moveExtender.getShortCastlingMove(color, pieceSensitivity);
        if (shortCastling) {
            route[MoveRoute.Right]!.push(shortCastling);
            route[MoveRoute.Right]!.push(shortCastling - 1);
        }

        // Get castling moves of the king. Also,
        // castling doesn't need king safety filter because it is already filtered.
        moves[MoveType.Castling] = Flattener.flattenSquares(route);

        return moves;
    }
}
