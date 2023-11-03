/**
 * Test file that includes some random-real games.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { GameStatus, Square, StartPosition } from '../Types';
import { ChessEngine } from '../Engine/ChessEngine';

/**
 * Games with expected algebraic notation.
 */
const games: Test[] = [
    {
        // https://www.chessgames.com/perl/chessgame?gid=1096968
        title: "Game 1",
        board: StartPosition.Standard,
        moves: [
            {from: Square.d5, to: Square.e5}
        ],
        expectation: GameStatus.BlackInCheck
    }
]

// Test every game
test(`Random Games`, () => {
    // Create chess engine
    const engine = new ChessEngine();

    // Test every game
    for (const game of games) {
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);

        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        // Check if the game status is the expected
        expect(engine.getNotation()).toBe(game.expectation);

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
