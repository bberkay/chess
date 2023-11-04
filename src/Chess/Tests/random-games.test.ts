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
        moves: [{from:53,to:37},{from:13,to:29},{from:54,to:38},{from:2,to:19},{from:38,to:30},{from:14,to:22},{from:55,to:39},{from:7,to:13},{from:56,to:40},{from:15,to:23},{from:63,to:46},{from:23,to:30},{from:39,to:30},{from:6,to:24},{from:62,to:35},{from:12,to:20},{from:52,to:44},{from:9,to:17},{from:59,to:24},{from:10,to:26},{from:46,to:29},{from:20,to:29},{from:60,to:32},{from:5,to:12},{from:35,to:21},{from:12,to:20},{from:21,to:3},{from:4,to:3},{from:51,to:35},{from:26,to:35},{from:44,to:35},{from:19,to:36},{from:24,to:15},{from:13,to:30},{from:32,to:30},{from:36,to:30},{from:37,to:30},{from:8,to:7},{from:15,to:22},{from:3,to:30},{from:64,to:62},{from:30,to:51},{from:58,to:52},{from:7,to:55},{from:57,to:60},{from:51,to:50},{from:22,to:31},{from:1,to:7},{from:62,to:22},{from:20,to:27},{from:22,to:17},{from:29,to:37},{from:52,to:37},{from:27,to:35},{from:17,to:19},{from:35,to:34},{from:19,to:11}],
        expectation: GameStatus.BlackVictory
    },
    {
        title: "Game 4",
        board: StartPosition.Standard,
        moves: [{from:53,to:37},{from:13,to:29},{from:63,to:46},{from:2,to:19},{from:52,to:36},{from:29,to:36},{from:46,to:36},{from:19,to:36},{from:60,to:36},{from:7,to:22},{from:37,to:29},{from:4,to:13},{from:59,to:38},{from:13,to:34},{from:58,to:43},{from:34,to:36},{from:29,to:22},{from:36,to:38},{from:43,to:28},{from:38,to:29},{from:62,to:53},{from:29,to:28},{from:22,to:15},{from:6,to:15},{from:57,to:60},{from:28,to:55},{from:61,to:52},{from:15,to:24},{from:52,to:43},{from:55,to:19},{from:43,to:44},{from:12,to:20},{from:64,to:63},{from:3,to:30},{from:44,to:36}],
        expectation: GameStatus.BlackVictory
    },
    {
        title: "Game 5",
        board: StartPosition.Standard,
        moves: [{ from: 53, to: 37 },{ from: 13, to: 29 },{ from: 63, to: 46 },{ from: 7, to: 22 },{ from: 52, to: 44 },{ from: 6, to: 27 },{ from: 58, to: 52 },{ from: 12, to: 20 },{ from: 52, to: 35 },{ from: 2, to: 19 },{ from: 51, to: 43 },{ from: 3, to: 39 },{ from: 50, to: 34 },{ from: 27, to: 18 },{ from: 35, to: 18 },{ from: 9, to: 18 },{ from: 62, to: 53 },{ from: 19, to: 13 },{ from: 56, to: 48 },{ from: 11, to: 27 },{ from: 48, to: 39 },{ from: 22, to: 39 },{ from:34, to: 27 },{ from: 39, to: 22 },{ from: 27, to: 20 },{ from: 4, to: 20 },{ from: 59, to: 50 }, { from: 18, to: 26 }, { from: 43, to: 35 },{ from: 26, to: 35 }, { from: 50, to: 29 }, { from: 20, to: 34 }, { from: 60, to: 52 }, { from: 34, to: 52 }, { from: 46, to: 52 }, { from: 22, to: 12 }, { from: 52, to: 35 }, { from: 12, to: 29 }, { from: 35, to: 29 }, { from: 5, to: 8 },{ from: 29, to: 12 }, { from: 6, to: 5 }, { from: 53, to: 32 }, { from: 13, to: 23 }, { from: 32, to: 23 }, { from: 14, to: 23 }, { from: 61, to: 57 }, { from: 1, to: 49 }, { from: 54, to: 46 }, { from: 5, to: 3 }, { from: 59, to: 58 }, { from: 3, to: 51 }, { from: 55, to: 39 }, { from: 51, to: 50 }, { from: 58, to: 59 }, { from: 50, to: 51 }, { from: 59, to: 58 }, { from: 49, to: 50 }, { from: 58, to: 57 },{ from: 50, to: 49 },{ from: 57, to: 58 },{ from: 49, to: 50 }],
        expectation: GameStatus.Draw
    },
    {
        // https://www.chessgames.com/perl/chessgame?gid=1106921&comp=1
        title: "Robert James Fischer vs Tigran V Petrosian, (1971), Buenos Aires ARG, rd 3, Oct-07 ",
        board: StartPosition.Standard,
        moves: [{from:53,to:37},{from:13,to:21},{from:52,to:36},{from:12,to:28},{from:58,to:43},{from:7,to:22},{from:59,to:31},{from:28,to:37},{from:43,to:37},{from:6,to:13},{from:31,to:22},{from:15,to:22},{from:55,to:47},{from:22,to:30},{from:37,to:43},{from:13,to:22},{from:63,to:53},{from:2,to:19},{from:36,to:28},{from:21,to:28},{from:43,to:28},{from:22,to:50},{from:62,to:55},{from:5,to:8},{from:61,to:64},{from:50,to:8},{from:53,to:38},{from:19,to:29},{from:60,to:32},{from:29,to:23},{from:57,to:60},{from:11,to:19},{from:28,to:45},{from:4,to:22},{from:63,to:64},{from:8,to:15},{from:55,to:48},{from:23,to:13},{from:60,to:44},{from:3,to:21},{from:62,to:60},{from:15,to:24},{from:44,to:36},{from:24,to:38},{from:36,to:38},{from:1,to:4},{from:60,to:4},{from:6,to:4},{from:48,to:30},{from:13,to:30},{from:45,to:30},{from:4,to:28},{from:47,to:39},{from:21,to:30},{from:39,to:30},{from:16,to:24},{from:56,to:48},{from:7,to:16},{from:32,to:53},{from:22,to:29},{from:53,to:32},{from:29,to:22},{from:32,to:53},{from:28,to:29},{from:53,to:44},{from:29,to:28}],
        expectation: GameStatus.Draw,
    },
    {
        title: "Game 6",
        board: StartPosition.Standard,
        moves: [{from:53,to:37},{from:13,to:29},{from:63,to:46},{from:12,to:20},{from:62,to:35},{from:2,to:12},{from:58,to:43},{from:14,to:22},{from:52,to:44},{from:7,to:13},{from:59,to:45},{from:11,to:19},{from:60,to:52},{from:20,to:28},{from:37,to:28},{from:19,to:28},{from:43,to:28},{from:13,to:28},{from:35,to:28},{from:12,to:18},{from:28,to:42},{from:18,to:28},{from:42,to:28},{from:4,to:28},{from:61,to:64},{from:3,to:39},{from:52,to:53},{from:22,to:30},{from:51,to:35},{from:28,to:19},{from:56,to:48},{from:29,to:37},{from:48,to:39},{from:37,to:46},{from:53,to:46},{from:19,to:46},{from:55,to:46},{from:30,to:39},{from:46,to:39},{from:1,to:3},{from:45,to:9},{from:6,to:27},{from:9,to:27},{from:3,to:27},{from:50,to:34},{from:10,to:18},{from:34,to:27},{from:18,to:27},{from:57,to:58},{from:5,to:8},{from:49,to:33},{from:6,to:1},{from:58,to:57},{from:1,to:2},{from:62,to:61},{from:2,to:42},{from:61,to:45},{from:16,to:24},{from:63,to:55},{from:15,to:31},{from:33,to:25},{from:7,to:15},{from:25,to:17},{from:42,to:2},{from:17,to:9},{from:2,to:1},{from:45,to:13},{from:15,to:22},{from:13,to:10},{from:22,to:29},{from:10,to:2},{from:1,to:2},{from:9,to:2},{from:29,to:36},{from:57,to:60},{from:36,to:43},{from:2,to:58},{from:43,to:36},{from:55,to:46},{from:36,to:29},{from:60,to:61}, {from:1,to:2},{from:9,to:2},{from:29,to:36},{from:57,to:60},{from:36,to:43},{from:2,to:58},{from:43,to:36},{from:55,to:46},{from:36,to:29},{from:60,to:61},{from:29,to:36},{from:58,to:51},{from:24,to:32},{from:39,to:32},{from:31,to:39}],
        expectation: GameStatus.Draw
    },
    {
        title: "Game 7",
        board: StartPosition.Standard,
        moves: [],
        expectation: GameStatus.Draw
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
