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
import { Color, PieceType, Square, StartPosition} from "../Types.ts";

export class ChessEngine{
    /**
     * This class provides users to create and manage a game(does not include board or other ui elements).
     * TODO: Engine Bitince, Bu dosyanın yorum satırları en üstte tüm engine klasörünü kapsayacak şekilde ve burada genel
     * TODO: chess engini kapsayacak şekilde geliştirilecek.
     */

    /**
     * Piece factory property of the engine. It is used to create piece/pieces.
     * @see for more information src/Engine/Factory/PieceFactory.ts
     */
    private pieceFactory: PieceFactory = new PieceFactory();

    /**
     * Move engine property of the engine. It is used to get possible moves of a piece.
     * @see for more information src/Engine/Core/MoveEngine.ts
     */
    private moveEngine: MoveEngine = new MoveEngine();

    /**
     * Constructor of the ChessEngine class.
     * @param isStandalone If this parameter is true, the engine will work standalone. Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true){
        console.log("isStandalone: " + isStandalone);
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
    public getMoves(square: Square): Array<Square> | null
    {
        return this.moveEngine.getMoves(square);
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        // BoardManager.
        console.log("playMove: " + from + " " + to);
        // TODO: isMoved property of the piece should be set to true.
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