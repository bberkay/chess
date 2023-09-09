/**
 * Test for the king's protection (for example, rook must not move any
 * square that puts the king in danger).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import {Moves, MoveType, Square, StartPosition} from '../Types';
import { ChessEngine } from '../Engine/ChessEngine';

/**
 * Board with expected moves for protectors of the king.
 */
const games: Test[] = [
    {
        title: "King Protection with Rook from Enemy Queen",
        board: StartPosition.ProtectKing,
        expectation: {
            from: Square.d2, // Square of Piece(White Rook) that protect the king
            to: [Square.d3, Square.d4, Square.d5, Square.d6, Square.d7] // Expected moves for the white rook
        }
    },
    {
        title: "King Protection with Knight from Enemy Bishop",
        board: '8/8/7k/6b1/8/8/3N4/2K5 w - - 0 1',
        expectation: {
            from: Square.d2, // Square of Piece(White Knight) that protect the king
            to: null // Expected moves for the white knight
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook",
        board: '3k4/3p4/4P3/8/8/8/8/3RK3 b - - 0 1',
        expectation: {
            from: Square.d7, // Square of Piece(Black Pawn) that protect the king
            to: [Square.d6, Square.d5] // Expected moves for the black pawn
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook (Forbidden En Passant)",
        board: '3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1',
        expectation: {
            from: Square.d4, // Square of Piece(Black Pawn) that protect the king
            to: [Square.d3] // Expected moves for the black pawn
        }
    }
]

test('King Protection Test', () => {
    const engine = new ChessEngine();

    for(const game of games){
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        engine.createGame(game.board);

        // Get moves for the piece that protect the king
        const moves: Moves = engine.getMoves(Number(game.expectation.from) as Square)!;

        if(game.expectation.to === null)
            expect(moves).toEqual(null);
        else
            expect(moves![MoveType.Normal]!.sort()).toEqual(game.expectation.to.sort());

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
