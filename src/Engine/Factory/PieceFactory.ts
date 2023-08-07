import { Color, PieceType, Square} from "../../Enums.ts";
import { Game } from "../../Global/Game.ts";
import { Piece } from "../../Models/Piece.ts";

export class PieceFactory{
    /**
     * This class is responsible for creating pieces.
     */

    /**
     * Create piece id for the piece(between 1000 and 9999).
     */
    private static createPieceID(): number
    {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (Game.getPieceIDList().includes(id)) // If the id is already used, create a new one.
            this.createPieceID();
        else // If the id is not used, add it to the list.
            Game.addToPieceIDList(id);

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
        Game.setSquare(square, new Piece(color, type, square, this.createPieceID()));
    }
}