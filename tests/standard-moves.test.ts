/**
 * Test for standard moves by using some pieces on board.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { Moves, MoveType, Square } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Random game with expected moves for some piece.
 */
const game: TestGame = {
    title: "Standard Moves",
    board: 'rnbqkbnr/pppppppp/8/6B1/3P2B1/2NQ3P/PPP1PPP1/R3K1NR w KQkq - 0 1',
    expectation: [
        {
            // Expected moves for the white rook on a1
            from: Square.a1, // Square of white rook
            to: [Square.b1, Square.c1, Square.d1] // Expected moves
        },
        {
            // Expected moves for the white pawn on c2
            from: Square.c2,
            to: null // No moves
        },
        {
            // Expected moves for the white knight on c3
            from: Square.c3,
            to: [Square.a4, Square.b5, Square.d5, Square.e4, Square.b1, Square.d1]
        },
        {
            // Expected moves for the white queen on d3
            from: Square.d3,
            to: [Square.h7, Square.a6, Square.b5, Square.c4, Square.d2, Square.d1, Square.e3, Square.f3, Square.g3, Square.e4, Square.f5, Square.g6]
        },
        {
            // Expected moves for the white pawn on d4
            from: Square.d4,
            to: [Square.d5]
        },
        {
            // Expected moves for the white pawn on e2
            from: Square.e2,
            to: [Square.e3, Square.e4]
        },
        {
            // Expected moves for the white king on g1
            from: Square.g1,
            to: [Square.f3]
        },
        {
            // Expected moves for the white rook on h1
            from: Square.h1,
            to: [Square.h2]
        },
        {
            // Expected moves for the white bishop on g4
            from: Square.g4,
            to: [Square.f5, Square.e6, Square.f3, Square.d7, Square.h5]
        },
        {
            // Expected moves for the white bishop on g5
            from: Square.g5,
            to: [Square.h4, Square.h6, Square.f6, Square.e7, Square.f4, Square.e3, Square.d2, Square.c1]
        }
    ]
};

// Tests
test('Standard Moves', () => {
    const engine = new ChessEngine();
    console.log("Testing: " + game.title);
    console.log("Board:   " + game.board);
    engine.createGame(game.board);

    // Test every piece and its moves
    for(const expectation of game.expectation){
        const moves: Moves = engine.getMoves(Number(expectation.from) as Square)!;

        if(expectation.to === null)
            expect(moves).toEqual(null);
        else
            expect(moves![MoveType.Normal]!.sort()).toEqual(expectation.to.sort());
    }

    console.log("Passed");
    console.log("--------------------------------------------------");
});