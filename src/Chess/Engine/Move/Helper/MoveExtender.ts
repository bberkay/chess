import {Color, EnPassantDirection, PieceType, Square} from "../../../Types";
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
         * Find needed squares and icons for checking rules.
         * @see for more information icon of the piece https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
         */
        const kingSquare: Square = color == Color.White ? Square.e1 : Square.e8;
        const chosenRookSquare: Square = castlingType == "Long" ? (color == Color.White ? Square.a1 : Square.a8) : (color == Color.White ? Square.h1 : Square.h8);
        const kingIcon: string = color == Color.White ? "K" : "k";
        const rookIcon: string = color == Color.White ? "R" : "r";

        // Check first rule and third rule. Also, check the fen notation for castling availability when the game is loaded from fen notation.
        if(!BoardQueryer.isSquareHasPiece(kingSquare, color, [PieceType.King])
            || (BoardQueryer.getMoveHistory().length > 0 && BoardQueryer.getMoveHistory()[BoardQueryer.getMoveHistory().length - 1].includes("+"))
            || (BoardQueryer.getMoveHistory().length == 0 && !(
                (chosenRookSquare == Square.a8 && BoardQueryer.getGame().castling.BlackLong)
                || (chosenRookSquare == Square.h8 && BoardQueryer.getGame().castling.BlackShort)
                || (chosenRookSquare == Square.a1 && BoardQueryer.getGame().castling.WhiteLong)
                || (chosenRookSquare == Square.h1 && BoardQueryer.getGame().castling.WhiteShort)
            ))
        ) return null;

        // For fourth rule.
        const betweenSquares: Array<Square> = castlingType == "Long"
            ? (color == Color.White ? [Square.b1, Square.c1, Square.d1] : [Square.b8, Square.c8, Square.d8])
            : (color == Color.White ? [Square.f1, Square.g1] : [Square.f8, Square.g8]);

        // Check second rule.
        for(const notation of BoardQueryer.getMoveHistory()){
            if(notation.includes(kingIcon)
                || notation.includes("O-O")
                || notation.includes("O-O-O")
                || (notation.includes(rookIcon + "a") && castlingType == "Long") // Vertical moves of the rook.
                || (notation.includes(rookIcon + "h") && castlingType == "Short")  // Same as above.
            ) return null;

            // For horizontal moves of the rook.
            for(const square of betweenSquares){
                if(notation.includes(rookIcon + Converter.squareIDToSquare(square)))
                    return null;
            }
        }

        // Check third rule.
        if(BoardQueryer.isSquareThreatened(kingSquare))
            return null;

        // Check fourth rule.
        for(const square of betweenSquares){
            if(BoardQueryer.getPieceOnSquare(square) || BoardQueryer.isSquareThreatened(square))
                return null;
        }

        // If all rules are passed, return castling move(chosen rook's square).
        return chosenRookSquare;
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

        const pawn: Piece | null = BoardQueryer.getPieceOnSquare(square);
        if(!pawn || pawn.getType() != PieceType.Pawn) return null;

        // Find needed information for checking rules.
        const color: Color = pawn.getColor();
        const pawnRow: number = Locator.getRow(square);
        const enPassantRow: number = color == Color.White ? 4 : 5;
        const enPassantMove: Square = direction == EnPassantDirection.Left
            ? (color == Color.White ? square - 9 : square + 7)
            : (color == Color.White ? square - 7 : square + 9); // back diagonal square of the enemy pawn.

        // Target square of the enemy pawn for en passant.
        const enemyPawn: number = direction == EnPassantDirection.Left ? square - 1 : square + 1;

        /**
         * Search if the enemy pawn moved one square forward previously in
         * the move history. If it is not found in the move history, it means
         * that the enemy pawn moved two squares, or it is not moved yet.
         */
        const isEnemyPawnMovedTwoSquares: boolean = !BoardQueryer.getMoveHistory().includes(
            Converter.squareIDToSquare((enemyPawn) + (color == Color.White ? -8 : 8))
        );

        // Check fen notation for en passant availability when the game is loaded from fen notation.
        if(BoardQueryer.getMoveHistory().length == 0 && BoardQueryer.getGame().enPassant == enPassantMove)
            return enPassantMove;

        // Check all rules.
        if(pawnRow != enPassantRow // First rule.
            || !BoardQueryer.isSquareHasPiece(enemyPawn, color == Color.White ? Color.Black : Color.White, [PieceType.Pawn]) // Second rule.
            || BoardQueryer.getMoveHistory()[BoardQueryer.getMoveHistory().length - 2] != Converter.squareIDToSquare(square) // Fourth rule.
            || !(BoardQueryer.getPieceOnSquare(enemyPawn) && isEnemyPawnMovedTwoSquares) // Third rule.
        ) return null;


        // If all rules are passed, return en passant move.
        return enPassantMove;
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