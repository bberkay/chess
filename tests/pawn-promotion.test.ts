import { expect, test } from 'vitest';
import { Color, MoveType, PieceType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';
import { BoardQueryer } from "../src/Engine/Core/Board/BoardQueryer";
import { Piece } from "../src/Types/Engine";

// Promotion Move Game.
const promotionMoveGame = {
    "board": StartPosition.Promotion,
    "moves": [
        {from: Square.e6, to: Square.e7},
        {from: Square.a6, to: Square.a5}
    ],
    "expectedPromotionMove": {from: Square.e7, to: Square.e8}
};

// Promote moves.
const promoteMoves = {
    from: Square.e8,
    to: [Square.e8, Square.e7, Square.e6, Square.e5] // Promote to every option one by one.
}

/**
 * Promote with square.
 * @see for more information, check _doPromote() in src/Engine/ChessEngine.ts
 */
const promoteScheme = {
    [Square.e8]: PieceType.Queen,
    [Square.e7]: PieceType.Rook,
    [Square.e6]: PieceType.Bishop,
    [Square.e5]: PieceType.Knight
}

// Test for promotion move.
test('Promote pawn to the every promotion option', () => {
    for(const promoteTo of promoteMoves.to) {
        const chessEngine = new ChessEngine();
        chessEngine.createGame(promotionMoveGame.board);

        // Go to the 7th row.
        for (const move of promotionMoveGame.moves) {
            chessEngine.playMove(move.from, move.to);
        }

        // Check if the promotion move is available.
        expect(chessEngine.getMoves(promotionMoveGame.expectedPromotionMove.from)![MoveType.Promotion][0])
            .toEqual(promotionMoveGame.expectedPromotionMove.to);

        // Go to the promotion move/8th row.
        chessEngine.playMove(promotionMoveGame.expectedPromotionMove.from, promotionMoveGame.expectedPromotionMove.to);

        // Promote pawn.
        chessEngine.playMove(promoteMoves.from, promoteTo);

        // Check if the piece is promoted to current type of promote.
        const promotedPawn: Piece = BoardQueryer.getPieceOnSquare(promoteMoves.from);
        expect({color: promotedPawn.getColor(), type: promotedPawn.getType()})
            .toEqual({color: Color.White, type: promoteScheme[promoteTo]});
    }
});