/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Color, PieceType, Square, StartPosition, SquareClickMode } from "../Enums.ts";
import { PieceFactory } from "./Factory/PieceFactory";
import { Converter } from "../Utils/Converter";

// Core
import { MoveEngine } from "./Core/MoveEngine";
import { PathEngine } from "./Core/PathEngine";
import { RouteEngine } from "./Core/RouteEngine";

export class ChessEngine{

    private moveEngine: MoveEngine;
    private pathEngine: PathEngine;
    private routeEngine: RouteEngine;

    constructor(){
        this.moveEngine = new MoveEngine();
        this.pathEngine = new PathEngine();
        this.routeEngine = new RouteEngine();
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
    public getMoves(square: Square): Array<Square>
    {
        return [Square.a1, Square.a2];
    }
}