import { Color, Piece, PieceType, Square } from "../Types";

export class PieceModel implements Piece{
    /**
     * This class is the model of the piece.
     */

    private readonly id: number;
    private readonly color: Color;
    private readonly type: PieceType;
    private readonly startPosition: Square;
    private moveCount: number;

    public constructor(color: Color, type: PieceType, startPosition:Square, id: number){
        this.id = id;
        this.color = color;
        this.type = type;
        this.startPosition = startPosition;
        this.moveCount = 0;
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

    /**
     * This function returns the moved status of the piece.
     */
    public getMoveCount(): number { return this.moveCount; }

    /**
     * This function sets the moved status of the piece.
     */
    public increaseMoveCount(): void { this.moveCount++; }

    /**
     * This function set move count of the piece.
     * Note: Generally, this function is used for loading unfinished games.
     */
    public setMoveCount(moveCount: number): void { this.moveCount = moveCount; }
}