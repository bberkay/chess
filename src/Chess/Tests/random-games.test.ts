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
        title: "Game 1",
        board: StartPosition.Standard,
        moves: [
            {from:53,to:37},{from:13,to:29},{from:52,to:44},{from:2,to:19},{from:59,to:52},{from:6,to:20},{from:63,to:46},{from:7,to:22},{from:62,to:53},{from:19,to:2},{from:44,to:36},{from:20,to:13},{from:46,to:29},{from:22,to:37},{from:29,to:14},{from:37,to:54},{from:61,to:54},{from:5,to:14},{from:53,to:32},{from:14,to:7},{from:60,to:46},{from:4,to:6},{from:46,to:6},{from:7,to:6},{from:49,to:41},{from:12,to:20},{from:64,to:61},{from:2,to:19},{from:58,to:43},{from:19,to:36},{from:43,to:28},{from:36,to:51},{from:61,to:13},{from:51,to:57},{from:13,to:14},{from:6,to:7},{from:14,to:11},{from:3,to:21},{from:28,to:13},{from:7,to:6},{from:52,to:34},{from:57,to:51},{from:34,to:20},{from:1,to:4},{from:13,to:23},{from:6,to:5}
        ],
        expectation: GameStatus.WhiteVictory
    },
    {
        title: "Game 2",
        board: StartPosition.Standard,
        moves: [
            {from:53,to:37},{from:13,to:29},{from:52,to:44},{from:2,to:19},{from:59,to:52},{from:6,to:20},{from:63,to:46},{from:7,to:22},{from:62,to:53},{from:19,to:2},{from:44,to:36},{from:20,to:13},{from:46,to:29},{from:22,to:37},{from:29,to:14},{from:37,to:54},{from:61,to:54},{from:5,to:14},{from:53,to:32},{from:14,to:7},{from:60,to:46},{from:4,to:6},{from:46,to:6},{from:7,to:6},{from:49,to:41},{from:12,to:20},{from:64,to:61},{from:2,to:19},{from:58,to:43},{from:19,to:36},{from:43,to:28},{from:36,to:51},{from:61,to:13},{from:51,to:57},{from:13,to:14},{from:6,to:7},{from:14,to:11},{from:3,to:21},{from:28,to:13},{from:7,to:6},{from:52,to:34},{from:57,to:51},{from:34,to:20},{from:1,to:4},{from:13,to:23},{from:6,to:5}
        ],
        expectation: GameStatus.WhiteVictory
    },
    {
        title: "Game 3",
        board: StartPosition.Standard,
        moves: [
            {from:53,to:37},{from:13,to:29},{from:52,to:44},{from:2,to:19},{from:59,to:52},{from:6,to:20},{from:63,to:46},{from:7,to:22},{from:62,to:53},{from:19,to:2},{from:44,to:36},{from:20,to:13},{from:46,to:29},{from:22,to:37},{from:29,to:14},{from:37,to:54},{from:61,to:54},{from:5,to:14},{from:53,to:32},{from:14,to:7},{from:60,to:46},{from:4,to:6},{from:46,to:6},{from:7,to:6},{from:49,to:41},{from:12,to:20},{from:64,to:61},{from:2,to:19},{from:58,to:43},{from:19,to:36},{from:43,to:28},{from:36,to:51},{from:61,to:13},{from:51,to:57},{from:13,to:14},{from:6,to:7},{from:14,to:11},{from:3,to:21},{from:28,to:13},{from:7,to:6},{from:52,to:34},{from:57,to:51},{from:34,to:20},{from:1,to:4},{from:13,to:23},{from:6,to:5}
        ],
        expectation: GameStatus.WhiteVictory
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
