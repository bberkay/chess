import { Color, PieceType } from "../../Types";
import { Piece } from "../Types";

/**
 * This class is the model of the piece.
 */
export class PieceModel implements Piece {
    /**
     * Properties of the PieceModel class.
     */
    private readonly color: Color;
    private readonly type: PieceType;

    /**
     * Constructor of the PieceModel class.
     */
    public constructor(color: Color, type: PieceType) {
        this.color = color;
        this.type = type;
    }

    /**
     * This function returns the color of the piece.
     */
    public getColor(): Color {
        return this.color;
    }

    /**
     * This function returns the type of the piece.
     */
    public getType(): PieceType {
        return this.type;
    }

    /**
     * This function returns the score of the piece.
     */
    public getScore(): number {
        /**
         * The score of the pieces.
         * @see for more information about piece score https://en.wikipedia.org/wiki/Chess_piece_relative_value
         */
        const pieceScore: Record<PieceType, number> = {
            [PieceType.Pawn]: 1,
            [PieceType.Knight]: 3,
            [PieceType.Bishop]: 3,
            [PieceType.Rook]: 5,
            [PieceType.Queen]: 9,
            [PieceType.King]: 0,
        };

        return pieceScore[this.type];
    }
}
