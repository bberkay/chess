import { BoardManager } from "../../Managers/BoardManager.ts";
import { PieceModel } from "../../Models/PieceModel.ts";
import { Color, PieceType, Square } from "../../Types.ts";

export class PieceFactory{
    /**
     * This class is responsible for creating pieces on the board.
     */

    /**
     * Create piece id for the piece(between 1000 and 9999).
     */
    private createPieceID(): number
    {
        let id = Math.floor(Math.random() * 10000) + 1000

        // If the id is already used, create a new one.
        if (BoardManager.getPieceIds().includes(id))
            this.createPieceID();
        else // If the id is not used, add it to the list.
            BoardManager.addPieceIds(id);

        return id
    }

    /**
     * This function creates pieces with the given position.
     * @example createPieces([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2},
     * {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}]); This will create two
     * white pawns on a2 and b2.
     */
    public createPieces(pieces:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of pieces){
            this.createPiece(piece.color, piece.type, piece.square);
        }
    }

    /**
     * This function creates a piece with the given color, type and square.
     * @example createPiece(Color.White, PieceType.Pawn, Square.a2); This will create a white pawn on a2.
     */
    public createPiece(color: Color, type:PieceType, square:Square): void
    {
        BoardManager.addPiece(square, new PieceModel(color, type, square, this.createPieceID()));
    }
}