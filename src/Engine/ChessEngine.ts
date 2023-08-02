/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Color, PieceType, Square, StartPosition} from "../Enums.ts";
import { PieceFactory } from "./Factory/PieceFactory";
import { Converter } from "../Utils/Converter";

// Core
import { MoveEngine } from "./Core/MoveEngine";
import { PathEngine } from "./Core/PathEngine";
import { RouteEngine } from "./Core/RouteEngine";

export class ChessEngine{
    /**
     * This class provides users to create and manage a game.
     */

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
     */
    public createGame(position:StartPosition|Array<{color: Color, type:PieceType, square:Square}> = StartPosition.Standard): void
    {

        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position);

        // Create the game.
        PieceFactory.createPieces(position);
    }
}