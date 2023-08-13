import {Color, MoveRoute, Path, Square} from "../../Types.ts";
import {BoardManager} from "../../Managers/BoardManager.ts";
import {Converter} from "../../Utils/Converter.ts";
import {Locator} from "../Utils/Locator.ts";
import {RouteCalculator} from "./Calculator/RouteCalculator.ts";
import {MoveChecker} from "../Checker/MoveChecker.ts";

export class MoveEngine{
    /**
     * This class calculates the possible moves of the pieces.
     */

    /**
     * @description This class contains king, queen, rook, bishop, knight and pawn route calculates methods for the given square.
     * @see for more information src/Engine/Core/Calculator/RouteCalculator.ts
     */
    private routeCalculator: RouteCalculator = new RouteCalculator();

    /**
     * Get the possible moves of the pawn on the given square.
     */
    public getPawnMoves(square: Square): Array<Square> | null
    {
        // Find possible moves of the pawn.
        let moves: Path = this.routeCalculator.getPawnRoute(square);
        if(!moves) return null;

        // Find the pawn's color and enemy's color by the given square.
        const color: Color = BoardManager.getPiece(square)!.getColor();
        const enemyColor: Color = color === Color.White ? Color.Black : Color.White;

        /**
         * Find routes of the pawn by its color. For example,
         * if the pawn is white, we need to get the top route of the pawn.
         * if the pawn is black, we need to get the bottom route of the pawn.
         */
        const moveDirection: Record<string, MoveRoute> = color === Color.White
            ? {vertical: MoveRoute.Top, leftDiagonal: MoveRoute.TopLeft, rightDiagonal: MoveRoute.TopRight}
            : {vertical: MoveRoute.Bottom, leftDiagonal: MoveRoute.BottomLeft, rightDiagonal: MoveRoute.BottomRight};

        /**
         * Filter the route by the pawn's color. For example,
         * if the pawn is white, we need to delete the bottom route of the pawn.
         * if the pawn is black, we need to delete the top route of the pawn.
         */
        for(let route in moves){
            if(route != moveDirection.vertical && route != moveDirection.leftDiagonal && route != moveDirection.rightDiagonal)
                delete moves[route as MoveRoute];
        }

        /**
         * Filter second square of the vertical route by the pawn's color and row.
         *
         * If pawn is white and is not on the seventh row
         * or if pawn is black and is not on the second row,
         * then remove the second square of the vertical route.
         */
        if(Locator.getRow(square) != (color == Color.White ? 7 : 2))
            moves[moveDirection.vertical]!.splice(1, 1);

        /**
         * Filter diagonal routes by the pawn's color and has enemy status.
         *
         * If the diagonal squares has no enemy piece, then remove
         * the diagonal routes from the moves.
         */
        if(!BoardManager.hasPiece(moves[moveDirection.leftDiagonal]![0], enemyColor))
            delete moves[moveDirection.leftDiagonal];

        if(!BoardManager.hasPiece(moves[moveDirection.rightDiagonal]![0], enemyColor))
            delete moves[moveDirection.rightDiagonal];

        // Return filtered moves.
        return Converter.convertPathToMoves(moves);
    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    public getKnightMoves(square: Square): Array<Square> | null
    {
        let moves: Array<Square> = this.routeCalculator.getKnightRoute(square);
        if(!moves) return null;

        // Knight has no direction, so we don't need to convert the route to moves.
        return moves;
    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    public getBishopMoves(square: Square): Array<Square> | null
    {
        let moves: Path = this.routeCalculator.getBishopRoute(square);
        if(!moves) return null;

        return Converter.convertPathToMoves(moves);
    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    public getRookMoves(square: Square): Array<Square> | null
    {
        let moves: Path = this.routeCalculator.getRookRoute(square);
        if(!moves) return null;

        return Converter.convertPathToMoves(moves);
    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    public getQueenMoves(square: Square): Array<Square> | null
    {
        let moves: Path = this.routeCalculator.getQueenRoute(square);
        if(!moves) return null;

        return Converter.convertPathToMoves(moves);
    }

    /**
     * Get the possible moves of the king on the given square.
     */
    public getKingMoves(square: Square): Array<Square> | null
    {
        let moves: Path = this.routeCalculator.getKingRoute(square);
        if(!moves) return null;

        // Find the king's color and enemy's color by the given square.
        const color: Color = BoardManager.getPiece(square)!.getColor();

        /**
         * Add castling moves to the king's moves. For example,
         * If the king is white, add Square.a1 to king's left route
         * and Square.h1 to king's right route. If the king is black,
         * add Square.a8 to king's left route and Square.h8 to king's
         * right route.
         *
         * @see for more information src/Engine/Checker/MoveChecker.ts
         */

        // Add long castling move to the king's moves.
        if(MoveChecker.isLongCastlingAvailable(color))
            moves[MoveRoute.Left]!.push(color == Color.White ? Square.a1 : Square.a8);

        // Add short castling move to the king's moves.
        if(MoveChecker.isShortCastlingAvailable(color))
            moves[MoveRoute.Right]!.push(color == Color.White ? Square.h1 : Square.h8);


        // Return extended moves.
        return Converter.convertPathToMoves(moves);
    }
}