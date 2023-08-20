import { Color, PieceType } from "../../Types";
import { Piece } from "../../Types/Engine";

/**
 * This class is the model of the piece.
 */
export class PieceModel implements Piece{

    /**
     * Properties of the PieceModel class.
     */
    private readonly id: number;
    private readonly color: Color;
    private readonly type: PieceType;
    private moveCount: number;

    /**
     * Constructor of the PieceModel class.
     */
    public constructor(color: Color, type: PieceType, id: number){
        this.id = id;
        this.color = color;
        this.type = type;
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
     * This function returns the id of the piece.
     */
    public getID(): number { return this.id; }

    /**
     * This function returns the move count of the piece.
     */
    public getMoveCount(): number { return this.moveCount; }

    /**
     * This function increases move count of the piece.
     */
    public increaseMoveCount(): void { this.moveCount++; }

    /**
     * This function set move count of the piece.
     * Note: Generally, this function is used for loading unfinished games.
     */
    public setMoveCount(moveCount: number): void { this.moveCount = moveCount; }
}