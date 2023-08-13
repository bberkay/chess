import {Color, MoveRoute, Path, Square} from "../../Types.ts";
import {BoardManager} from "../../Managers/BoardManager.ts";
import {Converter} from "../../Utils/Converter.ts";
import {Locator} from "../Utils/Locator.ts";
import {RouteCalculator} from "./Calculator/RouteCalculator.ts";

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
        let squares: Array<Square> = [];

        // Find possible moves of the pawn.
        let moves: Path = this.routeCalculator.getPawnRoute(square);
        if(!moves) return null;

        // Find the pawn's color and enemy's color by the given square.
        const color: Color = BoardManager.getPiece(square)!.getColor();
        const enemyColor: Color = color === Color.White ? Color.Black : Color.White;

        /**
         * Filter the route by the pawn's color. For example,
         * if the pawn is white, we need to get the top route of the pawn.
         * if the pawn is black, we need to get the bottom route of the pawn.
         */
        const moveRoutes: Array<MoveRoute> = color === Color.White
            ? [MoveRoute.Top, MoveRoute.TopLeft, MoveRoute.TopRight]
            : [MoveRoute.Bottom, MoveRoute.BottomLeft, MoveRoute.BottomRight];

        /**
         * Add the first square of vertical route to the squares array.
         * If the pawn is white, then moveRoutes[0] is MoveRoute.Top
         * If the pawn is black, then moveRoutes[0] is MoveRoute.Bottom
         * and add the first square of the vertical route to the squares array.
         */
        squares.push(moves[moveRoutes[0]]![0]);

        /**
         * Add the second square of vertical route to the squares array.
         * If the pawn is white and pawn is on the second row
         * or if the pawn is black and pawn is on the seventh row,
         * then add the second square of the vertical route to the squares array.
         */
        if(Locator.getRow(square) == (color == Color.White ? 2 : 7))
            squares.push(moves[moveRoutes[0]]![1]);


        /**
         * Add the diagonal squares to the squares array.
         * If the pawn is white, then moveRoutes[1] is MoveRoute.TopLeft and moveRoutes[2] is MoveRoute.TopRight
         * If the pawn is black, then moveRoutes[1] is MoveRoute.BottomLeft and moveRoutes[2] is MoveRoute.BottomRight
         * and add the diagonal squares to the squares array if there is an enemy piece.
         */
        if(BoardManager.hasPiece(moves[moveRoutes[1]]![0], enemyColor)) // Top/Bottom Left
            squares.push(moves[moveRoutes[1]]![0]);

        if(BoardManager.hasPiece(moves[moveRoutes[2]]![0], enemyColor)) // Top/Bottom Right
            squares.push(moves[moveRoutes[2]]![0])


        // Return the squares array.
        return squares;
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

        return Converter.convertPathToMoves(moves);
    }
}