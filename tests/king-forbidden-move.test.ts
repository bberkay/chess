/**
 * Test for the king's forbidden move (king cannot move to a square
 * that is under attack).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { MoveType, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Board with expected moves for the king on h8.
 */
const game: TestGame = {
    title: "Forbidden Moves Test For King on h8",
    board: StartPosition.KingForbiddenMove,
    expectation: [Square.g8]
}

test('King Forbidden Moves', () => {
    console.log("Testing: " + game.title);
    console.log("Board:   " + game.board);

    const engine = new ChessEngine();
    engine.createGame(game.board);

    expect(engine.getMoves(Square.h8)![MoveType.Normal]!.sort()).toEqual(game.expectation.sort());
    console.log("Passed");
    console.log("--------------------------------------------------");
});