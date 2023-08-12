/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { PieceFactory } from "./Factory/PieceFactory";
import { Converter } from "../Utils/Converter";
import { BoardManager } from "../Managers/BoardManager";
import { MoveEngine } from "./Core/MoveEngine";
import { Piece, Color, PieceType, Square, StartPosition} from "../Types.ts";

export class ChessEngine{
    /**
     * This class provides users to create and manage a game(does not include board or other ui elements).
     * TODO: Engine Bitince, Bu dosyanın yorum satırları en üstte tüm engine klasörünü kapsayacak şekilde ve burada genel
     * TODO: chess engini kapsayacak şekilde geliştirilecek.
     */

    // Piece factory property of the engine. It is used to create piece/pieces.
    private pieceFactory: PieceFactory;

    // Move engine property of the engine. It is used to get possible moves of a piece.
    private moveEngine: MoveEngine;

    /**
     * Constructor of the ChessEngine class.
     * @param isStandalone If this parameter is true, the engine will work standalone. Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true){
        console.log("isStandalone: " + isStandalone);
        this.pieceFactory = new PieceFactory()
        this.moveEngine = new MoveEngine();
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
     * This function returns the possible moves of the given square.
     */
    public getMoves(square: Square): Array<Square> | null
    {
        // Get the piece on the given square.
        let piece: Piece | null = BoardManager.getPiece(square);

        // If there is no piece on the given square, return null;
        if(!piece) return null;

        /**
         * If there is a piece on the given square, get
         * the possible moves of the piece by its type.
         */
        switch(piece.getType()){
            case PieceType.Pawn:
                return this.moveEngine.getPawnMoves(square);
            case PieceType.Knight:
                return this.moveEngine.getKnightMoves(square);
            case PieceType.Bishop:
                return this.moveEngine.getBishopMoves(square);
            case PieceType.Rook:
                return this.moveEngine.getRookMoves(square);
            case PieceType.Queen:
                return this.moveEngine.getQueenMoves(square);
            case PieceType.King:
                return this.moveEngine.getKingMoves(square);
            default:
                return null;
        }
    }

    /**
     * This function plays the given move.
     * @param from
     * @param to
     */
    public playMove(from: Square, to: Square): void
    {
        // BoardManager.
        console.log("playMove: " + from + " " + to);
    }

}