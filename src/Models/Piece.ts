import { Color, PieceType, Square } from "../Enums.ts";

export class Piece{
    /**
     * This class provides users to manage a piece.
     */

    private color: Color;
    private type: PieceType;
    private startPosition: Square;
    private id: number;

    constructor(color: Color, type: PieceType, square:Square, id: number){
        this.color = color;
        this.type = type;
        this.startPosition = square;
        this.id = id;
    }

    /**
     * Getters
     */
    public getColor(): Color
    {
        return this.color;
    }

    public getType(): PieceType
    {
        return this.type;
    }

    public getStartPosition(): Square
    {
        return this.startPosition;
    }

    public getID(): number
    {
        return this.id;
    }
}