/**
 * This class is responsible for creating pieces.
 */

import { Color, PieceType, Square} from "../../Enums.ts";
import { Session } from "../../Global/Session.ts";
import { Piece } from "../../Models/Piece.ts";

export class PieceFactory{
    /**
     * Create piece id for the piece(between 1000 and 9999).
     */
    private static createPieceID(): number
    {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (Session.getPieceIDList().includes(id))
            this.createPieceID();
        else
            Session.addToPieceIDList(id);

        return id
    }

    /**
     * This function creates pieces with the given position.
     */
    public static createPieces(pieces:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of pieces){
            this.createPiece(piece.color, piece.type, piece.square);
        }
    }

    /**
     * This function creates a piece with the given color, type and square.
     */
    public static createPiece(color: Color, type:PieceType, square:Square): void
    {
        Session.setSquare(square, new Piece(color, type, square, this.createPieceID()));
    }
}