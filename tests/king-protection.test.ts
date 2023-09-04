/**
 * Test for the king's protection (for example, rook must not move any
 * square that puts the king in danger).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { MoveType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

/**
 * Board with expected moves for protectors of the king.
 */
const games: Test[] = [
    {
        title: "King Protection with Rook from Enemy Queen",
        board: StartPosition.ProtectKing,
        expectation: {
            "protectorOfKing": Square.d2,
            "expectedMovesOfProtector": [Square.d3, Square.d4, Square.d5, Square.d6, Square.d7] // Expected moves for the white rook
        }
    },
    {
        title: "King Protection with Knight from Enemy Bishop",
        board: '8/8/7k/6b1/8/8/3N4/2K5 w - - 0 1',
        expectation: {
            "protectorOfKing": Square.d2,
            "expectedMovesOfProtector": [] // Expected moves for the white knight
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook",
        board: '3k4/3p4/4P3/8/8/8/8/3RK3 b - - 0 1',
        expectation: {
            "protectorOfKing": Square.d7,
            "expectedMovesOfProtector": [Square.d6, Square.d5] // Expected moves for the black pawn
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook (Forbidden En Passant)",
        board: '3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1',
        expectation: {
            "protectorOfKing": Square.d4,
            "expectedMovesOfProtector": [Square.d3] // Expected moves for the black pawn
        }
    }
]

test('King Protection Test', () => {
    const chessEngine = new ChessEngine();

    for(const game of games){
        console.log("Testing: " + game.title);
        chessEngine.createGame(game.board);

        // Test every piece and its moves
        expect(chessEngine.getMoves(Number(game.expectation.protectorOfKing) as Square)[MoveType.Normal].sort())
                .toEqual(game.expectation.expectedMovesOfProtector.sort());

        console.log("Board: " + chessEngine.getGameAsFenNotation());
        console.log("Passed: " + game.title);
        console.log("--------------------------------------------------");
    }
});
