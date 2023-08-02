import { Color, PieceType, Square} from "../../Enums.ts";
import { Session } from "../../Global/Session.ts";

export class PieceFactory{
    /**
     * This class provides users to create pieces.
     */

    /**
     * Create piece id for the piece(between 1000 and 9999).
     */
    private static createPieceID(): number
    {
        let id = Math.floor(Math.random() * 10000) + 1000;
        if (Session.getIdList().includes(id))
            this.createPieceID();
        else
            Session.addIdList(id);

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
        console.log(`A ${color} ${type} is created on ${square}.`);
    }
}