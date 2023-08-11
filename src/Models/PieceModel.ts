export class PieceModel implements Piece{
    /**
     * This class is the abstract class of the pieces.
     */

    private readonly color: Color;
    private readonly type: PieceType;
    private readonly startPosition: Square;
    private readonly id: number;

    public constructor(color: Color, type: PieceType, startPosition:Square, id: number){
        this.color = color;
        this.type = type;
        this.startPosition = startPosition;
        this.id = id;
    }

    /**
     * This function returns the color of the piece.
     */
    public getColor(): Color { return this.color; }

    /**
     * This function returns the type of the piece.
     */
    public getType(): PieceType { return this.type; }

    /**
     * This function returns the start position of the piece.
     */
    public getStartPosition(): Square { return this.startPosition; }

    /**
     * This function returns the id of the piece.
     */
    public getID(): number { return this.id; }
}