import {CastlingType, Color, EnPassantDirection, PieceType, Square} from "../../../Types";
import {Piece} from "../../Types";
import {BoardQueryer} from "../../Board/BoardQueryer.ts";
import {Locator} from "../Utils/Locator.ts";
import {Converter} from "../../../Utils/Converter.ts";

/**
 * This class is responsible for checking if the specific move is available like
 * castling and en passant. Also, the methods are separated by the direction or
 * type because of the get one direction or type of move(check move engine).
 *
 * @see src/Chess/Engine/Move/MoveEngine.ts
 */
export class MoveExtender{

    /**
     * @description Check if the castling is available for the given king, rook and squares between king and rook.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    private calculateCastlingMove(color: Color, castlingType: "Long" | "Short"): Square | null
    {
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
         * Find the king, the chosen rook, squares between king
         * and rook and icons of the king and the rook by the given color
         *
         * For find chosen rook and squares between king and rook see the example below:
         * Color: white, castling type: long, king: e1, chosen rook: a1, between squares: b1, c1, d1
         * Color: black, castling type: short, king: e8, chosen rook: h8, between squares: f8, g8
         *
         * @see for more information icon of the piece https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
         */
        const kingSquare: Square = color == Color.White ? Square.e1 : Square.e8;
        const kingIcon: string = color == Color.White ? "K" : "k";
        const rookIcon: string = color == Color.White ? "R" : "r";

        // Check first rule and third rule, if king is not on its original square or king is in check, return null.
        if(!BoardQueryer.isSquareHasPiece(kingSquare, color, [PieceType.King])
            || BoardQueryer.getMoveHistory()[BoardQueryer.getMoveHistory().length - 1].includes("+")
        ) return null;

        // Find squares between king and the chosen rook.
        const betweenSquares: Array<Square> = castlingType == "Long"
            ? (color == Color.White ? [Square.b1, Square.c1, Square.d1] : [Square.b8, Square.c8, Square.d8])
            : (color == Color.White ? [Square.f1, Square.g1] : [Square.f8, Square.g8]);

        /**
         * If there is a move history that includes king, castling or rook
         * icon, return null. This check is for the second rule.
         */
        for(const notation of BoardQueryer.getMoveHistory()){
            // Check the second rule, if king or the chosen rook has not moved previously.
            if(notation.includes(kingIcon)
                || notation.includes("O-O")
                || notation.includes("O-O-O")
                || (notation.includes(rookIcon + "a") && castlingType == "Long") // Vertical moves of the rook.
                || (notation.includes(rookIcon + "h") && castlingType == "Short")  // Same as above.
            ) return null;

            // Check the fourth rule, if there are no pieces or dangerous squares between king and the chosen rook.
            for(const square of betweenSquares){
                if(notation.includes(rookIcon + Converter.squareIDToSquare(square)) // Also, horizontal moves of the rook.
                    || BoardQueryer.getPieceOnSquare(square) // If there is a piece on the square.
                    || BoardQueryer.isSquareThreatened(square) // If there is threatened square.
                ) return null;
            }
        }

        // If all rules are passed, return castling move.
        return castlingType == "Short" ? (color == Color.White ? Square.h1 : Square.h8) : (color == Color.White ? Square.a1 : Square.a8);
    }

    /**
     * @description Check if the long castling is available for the given color.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getLongCastlingMove(color: Color): Square | null
    {
        return this.calculateCastlingMove(color, "Long");
    }

    /**
     * @description Check if the short castling is available for the given color.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getShortCastlingMove(color: Color): Square | null
    {
        return this.calculateCastlingMove(color, "Short");
    }

    /**
     * @description Check if the en passant is available for the given square and direction.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    private calculateEnPassantMove(square: Square, direction: EnPassantDirection): Square | null
    {
        /**
         * Rules for en passant:
         * 1. The pawn must be on its fifth rank.
         * 2. The enemy pawn must be on an adjacent square to the moving pawn.
         * 3. The enemy pawn must have just moved two squares in a single move.
         * 4. The en passant capture must be made on the very next turn.
         *
         * @see for more information about en passant https://en.wikipedia.org/wiki/En_passant
         */

        // Find the pawn by the given square.
        const pawn: Piece = BoardQueryer.getPieceOnSquare(square)!;

        // Find fifth rank for black and white pawns.
        const BLACK_EN_PASSANT_ROW: number = 5;
        const WHITE_EN_PASSANT_ROW: number = 4;

        // Find the pawn's color and row.
        const color: Color = pawn.getColor();
        const row: number = Locator.getRow(square);

        /**
         * Check first rule, if the pawn is on its fifth rank.
         * If the pawn is not on its fifth rank, return false.
         */
        if((color == Color.Black && row != BLACK_EN_PASSANT_ROW) || (color == Color.White && row != WHITE_EN_PASSANT_ROW))
            return null;

        /**
         * Check second rule, if the enemy pawn is on an adjacent
         * square to the moving pawn.
         */
        const adjacentSquare: number = direction == EnPassantDirection.Left ? square - 1 : square + 1;
        const pieceOfTargetSquare: Piece | null = BoardQueryer.getPieceOnSquare(adjacentSquare);
        const enPassantSquare: Square = direction == EnPassantDirection.Left
            ? (color == Color.White ? square - 9 : square + 7)
            : (color == Color.White ? square - 7 : square + 9);

        /**
         * Check fourth rule, if the en passant capture must be made on the very next turn.
         */
        if(BoardQueryer.isEnPassantBanned(enPassantSquare))
            return null;

        /**
         * Check if the adjacent square's piece type is pawn and color is not the same
         */
        if(!pieceOfTargetSquare || pieceOfTargetSquare.getColor() == color || pieceOfTargetSquare.getType() != PieceType.Pawn)
            return null;

        /**
         * Check third rule, if enemy pawn has not just moved two squares
         * in a single move then return false. Also, check is en passant
         * available for the given square(because an ongoing game can be loaded
         * with fen notation and when it is loaded, the move history will be null,
         * but fen notation has en passant availability information so use this
         * information to check is en passant available for the given square).
         */
        const blockerMove: boolean = BoardQueryer.getMoveHistory().includes(
            Converter.squareIDToSquare(adjacentSquare + (color == Color.White ? -8 : 8)));
        if(blockerMove && !BoardQueryer.isEnPassantAvailable(enPassantSquare))
            return null;

        // If all rules are passed, return en passant move.
        return enPassantSquare;
    }

    /**
     * @description Check if the left en passant is available for the given square.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getLeftEnPassantMove(square: Square): Square | null
    {
        return this.calculateEnPassantMove(square, EnPassantDirection.Left);
    }

    /**
     * @description Check if the right en passant is available for the given square.
     * @see src/Chess/Engine/Move/Helper/MoveExtender.ts For more information.
     */
    public getRightEnPassantMove(square: Square): Square | null
    {
        return this.calculateEnPassantMove(square, EnPassantDirection.Right);
    }

    /**
     * @description Check if the promotion is available for the given square.
     */
    public getPromotionMove(square: Square): Array<Square> | null
    {
        /**
         * Rules for promotion:
         * 1. The pawn must be on its last rank.
         *
         * @see for more information about promotion https://en.wikipedia.org/wiki/Promotion_(chess)
         */

            // Find the pawn by the given square.
        const pawn: Piece = BoardQueryer.getPieceOnSquare(square)!;

        /**
         * Find last rank for black and white pawns.
         */
        const BLACK_PROMOTION_ROW: number = 8;
        const WHITE_PROMOTION_ROW: number = 1;

        // Find the pawn's color and row.
        const color: Color = pawn.getColor();
        const row: number = Locator.getRow(square);

        /**
         * Check first rule. For example, if white pawn is not on the
         * 7th row, return null. If black pawn is not on the 2nd row,
         * return null.
         *
         * @see for more information about row calculation src/Chess/Engine/Move/Utils/Locator.ts
         */
        if((color == Color.Black && row != BLACK_PROMOTION_ROW - 1) || (color == Color.White && row != WHITE_PROMOTION_ROW + 1))
            return null;

        /**
         * If all rules are passed, then find vertical move, left diagonal capture move
         * (because pawn only go left diagonal when it is capturing) and right diagonal
         * capture move (because pawn only go right diagonal when it is capturing).
         */
        const verticalMove: number = square + (color == Color.White ? -8 : 8);
        const leftDiagonalMove: number = square + (color == Color.White ? -9 : 9);
        const rightDiagonalMove: number = square + (color == Color.White ? -7 : 7);
        const enemyColor: Color = color == Color.White ? Color.Black : Color.White;

        let promotionMoves: Array<Square> = [
            verticalMove
        ];

        // If there is a piece on the left diagonal square, add this square to the promotion moves.
        if(BoardQueryer.isSquareHasPiece(leftDiagonalMove, enemyColor))
            promotionMoves.push(leftDiagonalMove);

        // If there is a piece on the right diagonal square, add this square to the promotion moves.
        if(BoardQueryer.isSquareHasPiece(rightDiagonalMove, enemyColor))
            promotionMoves.push(rightDiagonalMove);

        return promotionMoves;
    }
}