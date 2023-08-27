import { Color, PieceType } from "../../Types";
import { Piece } from "../../Types/Engine";

/**
 * This class is the model of the piece.
 */
export class PieceModel implements Piece{

    /**
     * Properties of the PieceModel class.
     */
    private readonly color: Color;
    private readonly type: PieceType;

    /**
     * Constructor of the PieceModel class.
     */
    public constructor(color: Color, type: PieceType){
        this.color = color;
        this.type = type;
    }

    /**
     * This function returns the color of the piece.
     */
    public getColor(): Color { return this.color; }

    /**
     * This function returns the type of the piece.
     */
    public getType(): PieceType { return this.type; }
}