/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { PieceFactory } from "./Factory/PieceFactory";
import { Converter } from "../Utils/Converter";
import { MoveEngine } from "./Core/MoveEngine";
import {Color, Piece, PieceType, Square, StartPosition} from "../Types.ts";
import {BoardManager} from "../Managers/BoardManager.ts";
import {StateManager} from "../Managers/StateManager.ts";

/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine{

    /**
     * Properties of the ChessEngine class.
     */
    private pieceFactory: PieceFactory = new PieceFactory();
    private moveEngine: MoveEngine = new MoveEngine();

    /**
     * Constructor of the ChessEngine class.
     * @param isStandalone If this parameter is true, the engine will work standalone. Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true){
        console.log("isStandalone: " + isStandalone);
        // Standalone unit testing ile beraber geliştirilir.
    }

    /**
     * This function creates a new game with the given position(fen notation or json notation).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppd/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // If fen notation is given, convert it to json notation.
        if(!Array.isArray(position))
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create the game.
        this.pieceFactory.createPieces(position);
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Square[] | null
    {
        return this.moveEngine.getMoves(square);
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        BoardManager.setPiece(to, BoardManager.getPiece(from)!);
        BoardManager.removePiece(from);
        StateManager.changeTurn();
        // TODO: Castling and en passant state management should be implemented.
    }

    /**
     * This function checks if the game is finished after move is played.
     */
    public isFinished(): boolean
    {
        // TODO: Implement this function.
        // TODO: StateManagement burada yapılabilir.
        return false;
    }
}