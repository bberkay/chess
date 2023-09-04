/**
 * Test for pawn promotion.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { Color, MoveType, PieceType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';
import { BoardQueryer } from "../src/Engine/Core/Board/BoardQueryer";
import { Piece } from "../src/Types/Engine";


/**
 * Random game with that contains promotion move
 * for one white pawn.
 */
const game: Test = {
    title: "Pawn Promotion",
    board: StartPosition.Promotion,
    moves: [
        {from: Square.e6, to: Square.e7},
        {from: Square.a6, to: Square.a5}
    ],
    expectation: {
       "promotionMove": {
           "from": Square.e7, // Current square of pawn.
           "to": Square.e8 // Expected move of pawn on e7 as promotion move.
        },
        "promoteOptions": [Square.e8, PieceType.Rook, Square.e6, PieceType.Knight]
    }
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
    const chessEngine = new ChessEngine();
    console.log("Testing: " + game.title);

    // Promote pawn to the every promotion option.
    for(const promotionOption of game.expectation.promoteOptions) {
        chessEngine.createGame(game.board);

        // Go to the 7th row.
        for (const move of game.moves) {
            chessEngine.playMove(move.from, move.to);
        }

        /**
         * Get the pawn before promotion move and expected promotion move.
         * For example, before promotion move, pawn is on e7 and promotion
         * move must be e8.
         */
        const promoteFrom = game.expectation.promotionMove.from; // current square of pawn: e7
        const promoteTo = game.expectation.promotionMove.to; // expected promotion square: e8

        /**
         * Check if the promotion move is available(pawn on e7 and
         * expected promotion move is e8).
         */
        expect(chessEngine.getMoves(promoteFrom)![MoveType.Promotion][0])
            .toEqual(promoteTo);

        // Go to the promotion move(e8).
        chessEngine.playMove(promoteFrom, promoteTo);

        // Promote pawn on e8 to the current type of promote.
        chessEngine.playMove(promoteTo, promotionOption);

        // Check if the piece is promoted to expected type of promote.
        const promotedPawn: Piece = BoardQueryer.getPieceOnSquare(promoteTo);
        expect({
            color: promotedPawn.getColor(), // Current color of promoted pawn.
            type: promotedPawn.getType() // Current type of promoted pawn.
        }).toEqual({
            color: Color.White, // Expected color of promoted pawn.
            type: typeof promotionOption == "number" ? promoteScheme[promotionOption] : promotionOption // Expected type of promoted pawn.
        });
    }

    console.log("Board: " + chessEngine.getGameAsFenNotation());
    console.log("Passed: " + game.title);
    console.log("--------------------------------------------------");
});