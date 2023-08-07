import { Square, Color, PieceType } from "../../Enums";
import { Piece } from "../../Models/Piece";
import { Game } from "../../Global/Game";
import { Board } from "../../Types";

export class BoardNavigator{
    /**
     * This class is responsible for navigating on the board.
     */

    /**
     * Get piece with the given square.
     */
    public static getPiece(square: Square): Piece | null
    {
        const squareContent: Piece | null = Game.getSquare(square);
        return squareContent ? squareContent : null;
    }

    /**
     * Get all pieces by color and/or type.
     */
    public static getPieces(targetColor: Color | null = null, targetTypes: Array<PieceType> | null = null): Array<Piece>
    {
        const squares: Board = Game.getBoard();
        const pieces: Array<Piece> = [];

        for(let square in squares){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;
            // If the square has a piece and the piece color and type is the same with the given color and type
            if(this.hasPiece(squareKey, targetColor, targetTypes))
                pieces.push(this.getPiece(squareKey) as Piece); // Add the piece to the list.
        }

        return pieces;
    }

    /**
     * Has the given square a piece?
     * @example hasPiece(Square.a1, Color.White, [PieceType.King, PieceType.Queen]); // Returns true if the square has a white king or queen.
     */
    public static hasPiece(square: Square, specificColor: Color | null = null, specificTypes: Array<PieceType> | null = null): boolean
    {
        const squareContent: Piece | null = this.getPiece(square);
        if(!squareContent) // If there is no piece on the square
            return false;

        if(specificColor && squareContent.getColor() != specificColor) // If the piece color is not the same with the given color
            return false;

        if(specificTypes && !specificTypes.includes(squareContent.getType())) // If the piece type is not the same with the given type
            return false;

        return true;
    }
}