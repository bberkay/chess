/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess game(does not include board or other ui components).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import { Color, PieceType, Square, StartPosition } from "Types";
import { MoveEngine } from "./Core/Move/MoveEngine";
import { BoardController } from "./Core/Board/BoardManager.ts";
import { StateManager } from "./Core/State/StateManager.ts";
import { Converter } from "../Utils/Converter";
import { BoardTraverser } from "./Core/Board/BoardTraverser.ts";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine{

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private boardManager: BoardController;
    private stateManager: StateManager;

    /**
     * Constructor of the ChessEngine class.
     * @param isStandalone If this parameter is true, the engine will work standalone(without board or other ui components just console).
     * Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true){
        console.log("isStandalone: " + isStandalone);
        this.moveEngine = new MoveEngine();
        this.boardManager = new BoardController();
        this.stateManager = new StateManager();
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     * @see For more information about StartPosition enum check src/types.ts
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // If fen notation is given, convert it to json notation.
        if(!Array.isArray(position))
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create the pieces with the given position.
        this.boardManager.createPieces(position);
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
        this.boardManager.movePiece(to, BoardTraverser.getPiece(from)!);
        this.stateManager.changeTurn();
        // TODO: Castling and en passant state management should be implemented.
    }

    /**
     * This function checks if the game is finished after move is played.
     */
    public isFinished(): boolean
    {
        // TODO: Implement this function.
        // TODO: StateManagement burada yapılabilir.
        // this.stateManager.isFinished();
        return false;
    }
}