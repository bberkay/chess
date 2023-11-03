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
        moves: [{from:53,to:37},{from:13,to:29},{from:52,to:44},{from:2,to:19},{from:59,to:52},{from:6,to:20},{from:63,to:46},{from:7,to:22},{from:62,to:53},{from:19,to:2},{from:44,to:36},{from:20,to:13},{from:46,to:29},{from:22,to:37},{from:29,to:14},{from:37,to:54},{from:61,to:54},{from:5,to:14},{from:53,to:32},{from:14,to:7},{from:60,to:46},{from:4,to:6},{from:46,to:6},{from:7,to:6},{from:49,to:41},{from:12,to:20},{from:64,to:61},{from:2,to:19},{from:58,to:43},{from:19,to:36},{from:43,to:28},{from:36,to:51},{from:61,to:13},{from:51,to:57},{from:13,to:14},{from:6,to:7},{from:14,to:11},{from:3,to:21},{from:28,to:13},{from:7,to:6},{from:52,to:34},{from:57,to:51},{from:34,to:20},{from:1,to:4},{from:13,to:23},{from:6,to:5}],
        expectation: GameStatus.WhiteVictory
    },
    {
        title: "Game 2",
        board: StartPosition.Standard,
        moves: [{from:53,to:45},{from:7,to:22},{from:45,to:37},{from:15,to:23},{from:54,to:46},{from:6,to:15},{from:58,to:43},{from:5,to:8},{from:52,to:44},{from:12,to:20},{from:46,to:38},{from:22,to:39},{from:63,to:46},{from:15,to:43},{from:50,to:43},{from:4,to:12},{from:44,to:36},{from:12,to:19},{from:43,to:35},{from:10,to:18},{from:59,to:45},{from:3,to:17},{from:56,to:48},{from:17,to:35},{from:48,to:39},{from:35,to:62},{from:64,to:62},{from:19,to:37},{from:46,to:52},{from:37,to:21},{from:52,to:35},{from:21,to:35},{from:38,to:30},{from:2,to:19},{from:30,to:23},{from:14,to:23},{from:45,to:24},{from:6,to:62},{from:61,to:52},{from:62,to:60},{from:52,to:60},{from:19,to:36},{from:57,to:59},{from:35,to:62},{from:60,to:52},{from:62,to:53},{from:52,to:43},{from:11,to:27},{from:59,to:58},{from:9,to:17},{from:58,to:50},{from:18,to:26},{from:50,to:42},{from:26,to:34},{from:43,to:50},{from:53,to:51},{from:50,to:57},{from:36,to:42},{from:49,to:42},{from:17,to:25},{from:55,to:47},{from:25,to:33},{from:42,to:33}],
        expectation: GameStatus.BlackVictory
    },
    {
        title: "Game 3",
        board: StartPosition.Standard,
        moves: [],
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
