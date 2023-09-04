/**
 * Test for standard moves by using some pieces on board.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { MoveType, Square } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

/**
 * Random game with expected moves for some piece.
 */
const game: Test = {
    title: "Standard Moves",
    board: 'rnbqkbnr/pppppppp/8/6B1/3P2B1/2NQ3P/PPP1PPP1/R3K1NR w KQkq - 0 1',
    expectation: [
        {
            // Expected moves for the white rook on a1
            "piece": Square.a1,
            "expectedMoves": [Square.b1, Square.c1, Square.d1]
        },
        {
            // Expected moves for the white pawn on c2
            "piece": Square.c2,
            "expectedMoves": []
        },
        {
            // Expected moves for the white knight on c3
            "piece": Square.c3,
            "expectedMoves": [Square.a4, Square.b5, Square.d5, Square.e4, Square.b1, Square.d1]
        },
        {
            // Expected moves for the white queen on d3
            "piece": Square.d3,
            "expectedMoves": [Square.h7, Square.a6, Square.b5, Square.c4, Square.d2, Square.d1, Square.e3, Square.f3, Square.g3, Square.e4, Square.f5, Square.g6]
        },
        {
            // Expected moves for the white pawn on d4
            "piece": Square.d4,
            "expectedMoves": [Square.d5]
        },
        {
            // Expected moves for the white pawn on e2
            "piece": Square.e2,
            "expectedMoves": [Square.e3, Square.e4]
        },
        {
            // Expected moves for the white king on g1
            "piece": Square.g1,
            "expectedMoves": [Square.f3]
        },
        {
            // Expected moves for the white rook on h1
            "piece": Square.h1,
            "expectedMoves": [Square.h2]
        },
        {
            // Expected moves for the white bishop on g4
            "piece": Square.g4,
            "expectedMoves": [Square.f5, Square.e6, Square.f3, Square.d7, Square.h5]
        },
        {
            // Expected moves for the white bishop on g5
            "piece": Square.g5,
            "expectedMoves": [Square.h4, Square.h6, Square.f6, Square.e7, Square.f4, Square.e3, Square.d2, Square.c1]
        }
    ]
};

// Tests
test('Standard Moves', () => {
    const chessEngine = new ChessEngine();
    console.log("Testing: " + game.title);
    chessEngine.createGame(game.board);

    // Test every piece and its moves
    for(const expectation of game.expectation)
        expect(chessEngine.getMoves(Number(expectation.piece) as Square)![MoveType.Normal]!.sort()).toEqual(expectation.expectedMoves.sort());

    console.log("Board: " + chessEngine.getGameAsFenNotation());
    console.log("Passed: " + game.title);
    console.log("--------------------------------------------------");
});