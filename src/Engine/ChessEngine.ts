/**
 * @module ChessEngine
 * @description This module provides users to create and manage a game(does not include board or other ui elements).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Color, PieceType, Square, StartPosition } from "../Enums.ts";
import { PieceFactory } from "./Factory/PieceFactory";
import { Converter } from "../Utils/Converter";
import { Piece } from "../Models/Piece";

// Core
import { MoveEngine } from "./Core/MoveEngine";
import { BoardNavigator } from "./Core/BoardNavigator";

export class ChessEngine{

    private moveEngine: MoveEngine;

    constructor(){
        this.moveEngine = new MoveEngine();
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
        }
    }
}