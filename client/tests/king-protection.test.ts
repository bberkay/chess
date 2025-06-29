/**
 * Test for the king's protection (for example, rook must not move any
 * square that puts the king in danger).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { Moves, MoveType, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Board with expected moves for protectors of the king.
 */
const games: TestGame[] = [
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
    },
    {
        title: "Black Queen on e5 Doesn't Need to Protect the King on e8 because of White Pawn on e7",
        board: 'rnb1k2r/pp1pP2p/7P/4q3/B1p5/2P1Qp2/PP6/RN2K2R b KQkq - 3 20',
        expectation: {
            from: Square.e5, // Square of Black Queen on e5
            to: [30, 31, 32, 28, 27, 26, 25, 37, 45, 21, 13, 38, 47, 56, 22, 15, 20, 11, 36, 43] // Expected moves
        }
    }
]

describe('King Protection Test', () => {
    for(const game of games){
        test(game.title, () => {
            const engine = new ChessEngine();

            engine.createGame(game.board);
            console.log("Initial Board:   " + engine.getGameAsFenNotation());

            // Get moves for the piece that protect the king
            const moves: Moves = engine.getMoves(Number(game.expectation.from) as Square)!;

            if(game.expectation.to === null)
                expect(moves).toEqual(null);
            else
                expect(moves![MoveType.Normal]!.sort()).toEqual(game.expectation.to.sort());
        })
    }
});
