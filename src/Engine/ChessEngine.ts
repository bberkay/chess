/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import {Color, MoveRoute, PieceType, Square, StartPosition} from "../Enums.ts";
import {PieceFactory} from "./Factory/PieceFactory";
import {Converter} from "../Utils/Converter";
import {Piece} from "../Models/Piece";
import { Path } from "../Types";

// Core
import {BoardNavigator} from "./Core/BoardNavigator";
import {RouteCalculator} from "./Core/RouteCalculator.ts";

export class ChessEngine{

    private routeCalculator: RouteCalculator;

    constructor(){
        this.routeCalculator = new RouteCalculator();
    }

    /**
     * This function creates a new game with the given position(fen notation or json notation).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create the game.
        PieceFactory.createPieces(position);
    }

    /**
     * This function returns the possible moves of the given square.
     */
    public getMoves(square: Square): Array<Square> | null
    {
        // Get the piece on the given square.
        let piece: Piece | null = BoardNavigator.getPiece(square);
        if(!piece) return null; // If there is no piece on the given square, return null;

        // Get the possible moves of the piece by its type.
        switch(piece.getType()){
            case PieceType.Pawn:
                return this.getPawnMoves(square, piece);
            case PieceType.Knight:
                return this.getKnightMoves(square);
            case PieceType.Bishop:
                return this.getBishopMoves(square);
            case PieceType.Rook:
                return this.getRookMoves(square);
            case PieceType.Queen:
                return this.getQueenMoves(square);
            case PieceType.King:
                return this.getKingMoves(square);
        }
    }

    /**
     * Get the possible moves of the pawn on the given square.
     */
    private getPawnMoves(square: Square, pawn: Piece): Array<Square> | null
    {
        let squares: Array<Square> = [];

        // Find possible moves of the pawn.
        let route: Path = this.routeCalculator.getPawnRoute(square);
        if(!route) return null;

        // Get the pawn's move routes.
        let moveRoutes: Array<MoveRoute> = [];

        // Filter pawn's moves by its color and add them to the moveRoutes array.
        if(pawn.getColor() == Color.White)
            moveRoutes = [MoveRoute.Top, MoveRoute.TopLeft, MoveRoute.TopRight];
        else
            moveRoutes = [MoveRoute.Bottom, MoveRoute.BottomLeft, MoveRoute.BottomRight];

        // FIXME: moveRoutes[0]![0] kısmında problem çıkabilir ekstra bir if ile kontrol edilebilir. if(moveRoutes[0]) moveRoutes[0][0] şeklinde.

        // First square of vertical route
        squares.push(route[moveRoutes[0]]![0]); // White: MoveRoute.Top[0], Black: MoveRoute.Bottom[0]

        // Second square of vertical route but only if the pawn is on its start position.
        if(pawn.getStartPosition() == square)
            squares.push(route[moveRoutes[0]]![1]); // White: MoveRoute.Top[1], Black: MoveRoute.Bottom[1]

        // Add the diagonal routes(if has enemy)
        if(BoardNavigator.hasPiece(route[moveRoutes[1]]![0], pawn.getColor() == Color.White ? Color.Black : Color.White))
            squares.push(route[moveRoutes[1]]![0]); // White: MoveRoute.TopLeft[0], Black: MoveRoute.BottomLeft[0]

        if(BoardNavigator.hasPiece(route[moveRoutes[2]]![0], pawn.getColor() == Color.White ? Color.Black : Color.White))
            squares.push(route[moveRoutes[2]]![0]); // White: MoveRoute.TopRight[0], Black: MoveRoute.BottomRight[0]

        return squares;
    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    private getKnightMoves(square: Square): Array<Square> | null
    {
        let route: Array<Square> = this.routeCalculator.getKnightRoute(square);
        if(!route) return null;

        // Knight has no direction, so we don't need to convert the route to moves.
        return route;
    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    private getBishopMoves(square: Square): Array<Square> | null
    {
        let route: Path = this.routeCalculator.getBishopRoute(square);
        if(!route) return null;

        return Converter.convertPathToMoves(route);
    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    private getRookMoves(square: Square): Array<Square> | null
    {
        let route: Path = this.routeCalculator.getRookRoute(square);
        if(!route) return null;

        return Converter.convertPathToMoves(route);
    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    private getQueenMoves(square: Square): Array<Square> | null
    {
        let route: Path = this.routeCalculator.getQueenRoute(square);
        if(!route) return null;

        return Converter.convertPathToMoves(route);
    }

    /**
     * Get the possible moves of the king on the given square.
     */
    private getKingMoves(square: Square): Array<Square> | null
    {
        let route: Path = this.routeCalculator.getKingRoute(square);
        if(!route) return null;

        return Converter.convertPathToMoves(route);
    }
}