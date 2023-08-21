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
     * @param color Color of the piece.
     * @param type Type of the piece.
     * @param id Id of the piece.
     * @param moveCount Move count of the piece, this is generally used when loading a game from cache.
     */
    public constructor(color: Color, type: PieceType, id: number, moveCount: number = 0){
        this.id = id;
        this.color = color;
        this.type = type;
        this.moveCount = moveCount;
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
}