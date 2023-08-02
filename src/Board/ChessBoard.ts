/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/rule).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Converter } from "../Utils/Converter";
import { StartPosition, Color, PieceType, Square } from "../Enums.ts";

export class ChessBoard {
    /**
     * This class provides users to create and manage a chess board.
     */

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     */
    createBoard(position:StartPosition|Array<{color: Color, type:PieceType, square:Square}> = StartPosition.Standard) {

        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position);

    }
}