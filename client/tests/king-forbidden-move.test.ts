/**
 * Test for the king's forbidden move (king cannot move to a square
 * that is under attack).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { MoveType, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Board with expected moves for the king on h8.
 */
const games: TestGame[] = [
    {
        title: "Forbidden Moves Test For King on h8",
        board: StartPosition.KingForbiddenMove,
        expectation: [Square.g8]
    }
]

describe('King Forbidden Moves', () => {
    for (const game of games) {
        test(game.title, () => {
            const engine = new ChessEngine();
            engine.createGame(game.board);
            console.log("Initial Board: " + engine.getGameAsFenNotation());

            expect(engine.getMoves(Square.h8)![MoveType.Normal]!.sort()).toEqual(game.expectation.sort());
        })
    }
});
