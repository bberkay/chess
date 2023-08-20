import { Color, PieceType, Square, CastlingType, EnPassantDirection } from "../../../../Types";
import { Piece } from "../../../../Types/Engine";
import { BoardQueryer } from "../../Board/BoardQueryer.ts";
import { Locator } from "../../Utils/Locator";

/**
 * This class is responsible for checking if the specific move is available like
 * castling and en passant. Also, the methods are separated by the direction or
 * type because of the get one direction or type of move(check move engine).
 *
 * @see src/Engine/Core/MoveEngine.ts
 * @see for more information about state management src/Mangers/StateManager.ts
 */
export class MoveChecker{

    /**
     * @description Check if the castling is available for the given king, rook and squares between king and rook.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isCastlingAvailable(color: Color, castlingType: "Long" | "Short"): boolean
    {
        /**
         * Rules for castling:
         * 1. King or the chosen rook has not moved previously.
         * 2. The king is not currently in check.
         * 3. There are no pieces or dangerous squares between king and the chosen rook.
         *
         * @see for more information about castling https://en.wikipedia.org/wiki/Castling
         */

        /**
         * If castling is not available for the given color and castling type, return false.
         *
         * @see src/Manager/StateManager.ts
         */
        if(!BoardQueryer.getCastlingStatus(color == Color.Black
            ? (castlingType == "Short" ? CastlingType.BlackLong : CastlingType.BlackShort)
            : (castlingType == "Long" ? CastlingType.WhiteLong : CastlingType.WhiteShort)))
            return false;

        /**
         * Find the king, the chosen rook and squares between king
         * and rook by the given color.
         *
         * For find chosen rook and squares between king and rook:
         * Color: white, castling type: long, king: e1, chosen rook: a1, between squares: b1, c1, d1
         * Color: white, castling type: short, king: e1, chosen rook: h1, between squares: f1, g1
         * Color: black, castling type: long, king: e8, chosen rook: a8, between squares: b8, c8, d8
         * Color: black, castling type: short, king: e8, chosen rook: h8, between squares: f8, g8
         */
        const king: Piece = BoardQueryer.getKingByColor(color)!;
        const chosenRook: Piece | null = BoardQueryer.getPieceOnSquare(castlingType == "Short"
            ? (color == Color.White ? Square.a1 : Square.h1)
            : (color == Color.White ? Square.a8 : Square.h8));
        const betweenSquares: Array<Square> = castlingType == "Long"
            ? (color == Color.White ? [Square.b1, Square.c1, Square.d1] : [Square.b8, Square.c8, Square.d8])
            : (color == Color.White ? [Square.f1, Square.g1] : [Square.f8, Square.g8]);

        /**
         * Check first and second rules, if the king or the long rook
         * hasn't moved previously or if the king is not in check.
         *
         * @see for more information about dangerous squares src/Engine/Checker/StateChecker.ts
         */
        if(!chosenRook || king.getMoveCount() != 0 || chosenRook.getMoveCount() != 0 || BoardQueryer.isCheck())
            return false;

        /**
         * Check third rule, if there are no pieces or dangerous squares
         * between king and the long rook.
         */
        for(let square of betweenSquares!){
            // If there is a piece or a dangerous square between king and the long rook, return false.
            if(BoardQueryer.getPieceOnSquare(square) || BoardQueryer.isSquareThreatened(square))
                return false;
        }

        // If all rules are passed, return true.
        return true;
    }

    /**
     * @description Check if the long castling is available for the given color.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isLongCastlingAvailable(color: Color): boolean
    {
        return this.isCastlingAvailable(color, "Long");
    }

    /**
     * @description Check if the short castling is available for the given color.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isShortCastlingAvailable(color: Color): boolean
    {
        return this.isCastlingAvailable(color, "Short");
    }

    /**
     * @description Check if the en passant is available for the given square and direction.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isEnPassantAvailable(square: Square, direction: EnPassantDirection): boolean
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

        /**
         * If en passant is not available for the given pawn, return false.
         *
         * @see for more information about en passant state management src/Manager/StateManager.ts
         */
        if(BoardQueryer.getEnPassantBanStatus(pawn.getID()))
            return false;

        // Find fifth rank for black and white pawns.
        const BLACK_EN_PASSANT_ROW: number = 4;
        const WHITE_EN_PASSANT_ROW: number = 3;

        // Find the pawn's color and row.
        const color: Color = pawn.getColor();
        const row: number = Locator.getRow(square);

        /**
         * Check first rule, if the pawn is on its fifth rank.
         * If the pawn is not on its fifth rank, return false.
         */
        if((color == Color.Black && row != BLACK_EN_PASSANT_ROW) || (color == Color.White && row != WHITE_EN_PASSANT_ROW))
            return false;

        /**
         * Check second rule, if the enemy pawn is on an adjacent
         * square to the moving pawn.
         */
        const adjacentSquare: number = direction == EnPassantDirection.Left ? square - 1 : square + 1;
        const pieceOfTargetSquare: Piece | null = BoardQueryer.getPieceOnSquare(adjacentSquare);

        /**
         * Check third rule, if target square is empty or if the piece
         * on the target square is not an enemy pawn or if the enemy pawn
         * has not just moved two squares in a single move then return false.
         */
        return !(!pieceOfTargetSquare || pieceOfTargetSquare.getColor() == color || pieceOfTargetSquare.getType() != PieceType.Pawn || pieceOfTargetSquare.getMoveCount() != 1);
    }

    /**
     * @description Check if the left en passant is available for the given square.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isLeftEnPassantAvailable(square: Square): boolean
    {
        return this.isEnPassantAvailable(square, EnPassantDirection.Left);
    }

    /**
     * @description Check if the right en passant is available for the given square.
     * @see src/Engine/Checker/MoveChecker.ts For more information.
     */
    protected isRightEnPassantAvailable(square: Square): boolean
    {
        return this.isEnPassantAvailable(square, EnPassantDirection.Right);
    }
}