import {
    CastlingSide,
    Color,
    EnPassantDirection,
    GameStatus,
    PieceIcon,
    PieceType,
    Square,
} from "../../../Types";
import { Piece } from "../../Types";
import { BoardQuerier } from "../../Board/BoardQuerier.ts";
import { Locator } from "../Utils/Locator.ts";
import { Converter } from "../../../Utils/Converter.ts";

/**
 * This class is responsible for checking if the specific move is available like
 * castling and en passant. Also, the methods are separated by the direction or
 * type because of the get one direction or type of move(check move engine).
 *
 * @see src/Chess/Engine/Move/MoveEngine.ts
 */
export class MoveExtender {
    /**
     * @description Check if the castling is available for the given king, rook and squares between king and rook.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    private calculateCastlingMove(
        color: Color,
        castlingSide: CastlingSide,
        pieceSensitivity: boolean = true
    ): Square | null {
        /**
         * Rules for castling:
         * 1. King and chosen rook must be their original squares.
         * 2. King or the chosen rook has not moved previously.
         * 3. The king is not currently in check.
         * 4. There are no pieces or dangerous squares between king and the chosen rook.
         *
         * @see for more information about castling https://en.wikipedia.org/wiki/Castling
         */

        /**
         * Find needed squares and icons for checking rules.
         * @see for more information icon of the piece https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
         */
        const kingSquare: Square = color == Color.White ? Square.e1 : Square.e8;
        const castlingMove: Square =
            castlingSide == CastlingSide.Long
                ? color == Color.White
                    ? Square.a1
                    : Square.a8
                : color == Color.White
                ? Square.h1
                : Square.h8;
        const kingIcon: string =
            color == Color.White ? PieceIcon.WhiteKing : PieceIcon.BlackKing;
        const rookIcon: string =
            color == Color.White ? PieceIcon.WhiteRook : PieceIcon.BlackRook;

        if (
            BoardQuerier.getBoardStatus() ==
            (color == Color.White
                ? GameStatus.WhiteInCheck
                : GameStatus.BlackInCheck)
        )
            return null;

        // Check first rule. Also, check the fen notation for castling availability
        // when the game is loaded from fen notation.
        if (
            !BoardQuerier.isSquareHasPiece(kingSquare, color, [
                PieceType.King,
            ]) ||
            !BoardQuerier.isSquareHasPiece(castlingMove, color, [
                PieceType.Rook,
            ]) ||
            (BoardQuerier.getAlgebraicNotation().length == 0 &&
                !(
                    (castlingMove == Square.a8 &&
                        BoardQuerier.getCastling().BlackLong) ||
                    (castlingMove == Square.h8 &&
                        BoardQuerier.getCastling().BlackShort) ||
                    (castlingMove == Square.a1 &&
                        BoardQuerier.getCastling().WhiteLong) ||
                    (castlingMove == Square.h1 &&
                        BoardQuerier.getCastling().WhiteShort)
                ))
        )
            return null;

        // No need to check any further if the piece sensitivity is false.
        if (!pieceSensitivity) return castlingMove;

        const betweenSquares: Array<Square> =
            castlingSide == CastlingSide.Long
                ? color == Color.White
                    ? [Square.b1, Square.c1, Square.d1]
                    : [Square.b8, Square.c8, Square.d8]
                : color == Color.White
                ? [Square.f1, Square.g1]
                : [Square.f8, Square.g8];

        // Check second rule.
        for (const notation of BoardQuerier.getAlgebraicNotation()) {
            if (
                notation.includes(kingIcon) ||
                (notation.includes(rookIcon + "a") &&
                    castlingSide == CastlingSide.Long) ||
                (notation.includes(rookIcon + "h") &&
                    castlingSide == CastlingSide.Short)
            )
                return null;

            // For horizontal moves of the rook.
            for (const square of betweenSquares) {
                if (
                    notation.includes(
                        rookIcon + Converter.squareIDToSquare(square)
                    )
                )
                    return null;
            }
        }

        // Check third rule.
        if (BoardQuerier.isSquareThreatened(kingSquare)) return null;

        // Check fourth rule.
        for (const square of betweenSquares) {
            if (
                BoardQuerier.getPieceOnSquare(square) ||
                BoardQuerier.isSquareThreatened(square)
            )
                return null;
        }

        return castlingMove;
    }

    /**
     * @description Check if the long castling is available for the given color.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getLongCastlingMove(
        color: Color,
        pieceSensitivity: boolean = true
    ): Square | null {
        return this.calculateCastlingMove(
            color,
            CastlingSide.Long,
            pieceSensitivity
        );
    }

    /**
     * @description Check if the short castling is available for the given color.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getShortCastlingMove(
        color: Color,
        pieceSensitivity: boolean = true
    ): Square | null {
        return this.calculateCastlingMove(
            color,
            CastlingSide.Short,
            pieceSensitivity
        );
    }

    /**
     * @description Check if the en passant is available for the given square and direction.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    private calculateEnPassantMove(
        square: Square,
        direction: EnPassantDirection
    ): Square | null {
        const pawn: Piece | null = BoardQuerier.getPieceOnSquare(square);
        if (!pawn || pawn.getType() != PieceType.Pawn) return null;

        const pawnColumn = Locator.getColumn(square);
        if (
            (pawnColumn == 1 && direction == EnPassantDirection.Left) ||
            (pawnColumn == 8 && direction == EnPassantDirection.Right)
        )
            return null;

        // Find en passant move
        const color: Color = pawn.getColor();
        const enPassantMove: Square =
            direction == EnPassantDirection.Left
                ? color == Color.White
                    ? square - 9
                    : square + 7
                : color == Color.White
                ? square - 7
                : square + 9;

        // Check fen notation for en passant availability 
        if (BoardQuerier.getGame().enPassant == enPassantMove)
            return enPassantMove;

        return null;
    }

    /**
     * @description Check if the left en passant is available for the given square.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getLeftEnPassantMove(
        square: Square
    ): Square | null {
        return this.calculateEnPassantMove(
            square,
            EnPassantDirection.Left
        );
    }

    /**
     * @description Check if the right en passant is available for the given square.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getRightEnPassantMove(
        square: Square
    ): Square | null {
        return this.calculateEnPassantMove(
            square,
            EnPassantDirection.Right
        );
    }
}
