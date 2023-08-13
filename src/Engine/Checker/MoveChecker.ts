import { Color, Square, Piece, CastlingType } from "../../Types";
import { BoardManager } from "../../Managers/BoardManager";
import { StateChecker } from "./StateChecker.ts";
export class MoveChecker{
    private static isCastlingAvailable(king: Piece, chosenRook: Piece, betweenSquares: Array<Square>): boolean
    {
        /**
         * Rules for castling:
         * 1. King or the chosen rook has not moved previously.
         * 2. The king is not currently in check.
         * 3. There are no pieces or dangerous squares between king and the chosen rook.
         *
         * @see for more information about castling https://en.wikipedia.org/wiki/Castling
         * @see for more information about dangerous squares src/Engine/Checker/StateChecker.ts
         */

        /**
         * Check first and second rules, if the king or the long rook
         * hasn't moved previously or if the king is not in check.
         */
        if(king.isMoved() || chosenRook!.isMoved() || StateChecker.isPlayerInCheck())
            return false;

        /**
         * Check third rule, if there are no pieces or dangerous squares
         * between king and the long rook.
         */
        for(let square of betweenSquares!){
            // If there is a piece or a dangerous square between king and the long rook, return false.
            if(BoardManager.getPiece(square) || StateChecker.isSquareThreatened(square))
                return false;
        }

        // If all rules are passed, return true.
        return true;
    }

    /**
     * @description Check if the long castling is available for the given color.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    public static isLongCastlingAvailable(color: Color): boolean
    {
        // Find the king, the long rook and squares between king and rook(a1 or h1) by the given color.
        const king: Piece = BoardManager.getKing(color)!;
        const rook: Piece = BoardManager.getPiece(color == Color.White ? Square.a1 : Square.h1)!;
        const betweenSquares: Array<Square> = color == Color.White ? [Square.b1, Square.c1, Square.d1] : [Square.b8, Square.c8, Square.d8];

        // Check if the long castling is available.
        return this.isCastlingAvailable(king, rook, betweenSquares);
    }

    /**
     * @description Check if the short castling is available for the given color.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    public static isShortCastlingAvailable(color: Color): boolean
    {
        // Find the king, the short rook and squares between king and rook(a8 or h8) by the given color.
        const king: Piece = BoardManager.getKing(color)!;
        const rook: Piece = BoardManager.getPiece(color == Color.White ? Square.a8 : Square.h8)!;
        const betweenSquares: Array<Square> = color == Color.White ? [Square.f1, Square.g1] : [Square.f8, Square.g8];

        // Check if the short castling is available.
        return this.isCastlingAvailable(king, rook, betweenSquares);
    }

    private static isEnPassantAvailable(): boolean
    {

    }

    public static isLeftEnPassantAvailable(): boolean
    {

    }

    public static isRightEnPassantAvailable(): boolean
    {

    }
}