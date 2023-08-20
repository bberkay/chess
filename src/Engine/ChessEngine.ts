/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess game(does not include board or other ui components).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import { JsonNotation, Square, StartPosition, Moves } from "../Types";
import { MoveEngine } from "./Core/Move/MoveEngine";
import { BoardManager } from "./Core/Board/BoardManager.ts";
import { Converter } from "../Utils/Converter";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine{

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private boardManager: BoardManager;
    private currentMoves: Moves | null = null;

    /**
     * Constructor of the ChessEngine class.
     * @param isStandalone If this parameter is true, the engine will work standalone(without board or other ui components just console).
     * Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true){
        console.log("isStandalone: " + isStandalone);
        this.moveEngine = new MoveEngine();
        this.boardManager = new BoardManager();
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/types.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        // If fen notation is given, convert it to json notation.
        if(typeof position === "string")
            position = Converter.convertFenToJson(position as StartPosition);

        // Create the board with the given position.
        this.boardManager.createBoard(position);
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Moves | null
    {
        this.currentMoves = this.moveEngine.getMoves(square);
        return this.currentMoves;
    }

    /**
     * This function finds and checks the given move. For example,
     * if the given move is not in the currentMoves, it returns false.
     */
    public findAndCheckMove(from: Square, to: Square): boolean
    {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if(this.currentMoves === null)
            return false;

        // TODO: Implement this function.
        console.log(from, to);

        return true;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        this.findAndCheckMove(from, to);
        this.boardManager.movePiece(from, to);
        this.boardManager.changeTurn();
        // TODO: Castling and en passant state management should be implemented.
    }

    /**
     * This function checks if the game is finished after move is played.
     */
    public isFinished(): boolean
    {
        // TODO: Implement this function.
        return false;
    }
}