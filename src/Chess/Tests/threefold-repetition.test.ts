/**
 * Test for threefold repetition. The game is drawn if the same position occurs three times.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { GameStatus, Square, StartPosition } from '../Types';
import { ChessEngine } from '../Engine/ChessEngine';

/**
 * Board with expected repetition moves.
 */
const games: Test[] = [
    {
        title: "Threefold repetition test",
        board: StartPosition.Standard,
        moves: [{ from: 53, to: 37 },{ from: 13, to: 29 },{ from: 63, to: 46 },{ from: 7, to: 22 },{ from: 52, to: 44 },{ from: 6, to: 27 },{ from: 58, to: 52 },{ from: 12, to: 20 },{ from: 52, to: 35 },{ from: 2, to: 19 },{ from: 51, to: 43 },{ from: 3, to: 39 },{ from: 50, to: 34 },{ from: 27, to: 18 },{ from: 35, to: 18 },{ from: 9, to: 18 },{ from: 62, to: 53 },{ from: 19, to: 13 },{ from: 56, to: 48 },{ from: 11, to: 27 },{ from: 48, to: 39 },{ from: 22, to: 39 },{ from:34, to: 27 },{ from: 39, to: 22 },{ from: 27, to: 20 },{ from: 4, to: 20 },{ from: 59, to: 50 }, { from: 18, to: 26 }, { from: 43, to: 35 },{ from: 26, to: 35 }, { from: 50, to: 29 }, { from: 20, to: 34 }, { from: 60, to: 52 }, { from: 34, to: 52 }, { from: 46, to: 52 }, { from: 22, to: 12 }, { from: 52, to: 35 }, { from: 12, to: 29 }, { from: 35, to: 29 }, { from: 5, to: 8 },{ from: 29, to: 12 }, { from: 6, to: 5 }, { from: 53, to: 32 }, { from: 13, to: 23 }, { from: 32, to: 23 }, { from: 14, to: 23 }, { from: 61, to: 57 }, { from: 1, to: 49 }, { from: 54, to: 46 }, { from: 5, to: 3 }, { from: 59, to: 58 }, { from: 3, to: 51 }, { from: 55, to: 39 }, { from: 51, to: 50 }, { from: 58, to: 59 }, { from: 50, to: 51 }, { from: 59, to: 58 }, { from: 49, to: 50 }, { from: 58, to: 57 },{ from: 50, to: 49 },{ from: 57, to: 58 }],
        expectation: GameStatus.Draw
    },
    {
        // https://www.chessgames.com/perl/chessgame?gid=1106921&comp=1
        title: "Robert James Fischer vs Tigran V Petrosian, (1971), Buenos Aires ARG, rd 3, Oct-07 ",
        board: StartPosition.Standard,
        moves: [{from:53,to:37},{from:13,to:21},{from:52,to:36},{from:12,to:28},{from:58,to:43},{from:7,to:22},{from:59,to:31},{from:28,to:37},{from:43,to:37},{from:6,to:13},{from:31,to:22},{from:15,to:22},{from:55,to:47},{from:22,to:30},{from:37,to:43},{from:13,to:22},{from:63,to:53},{from:2,to:19},{from:36,to:28},{from:21,to:28},{from:43,to:28},{from:22,to:50},{from:62,to:55},{from:5,to:8},{from:61,to:64},{from:50,to:8},{from:53,to:38},{from:19,to:29},{from:60,to:32},{from:29,to:23},{from:57,to:60},{from:11,to:19},{from:28,to:45},{from:4,to:22},{from:63,to:64},{from:8,to:15},{from:55,to:48},{from:23,to:13},{from:60,to:44},{from:3,to:21},{from:62,to:60},{from:15,to:24},{from:44,to:36},{from:24,to:38},{from:36,to:38},{from:1,to:4},{from:60,to:4},{from:6,to:4},{from:48,to:30},{from:13,to:30},{from:45,to:30},{from:4,to:28},{from:47,to:39},{from:21,to:30},{from:39,to:30},{from:16,to:24},{from:56,to:48},{from:7,to:16},{from:32,to:53},{from:22,to:29},{from:53,to:32},{from:29,to:22},{from:32,to:53},{from:28,to:29},{from:53,to:44},{from:29, to:28}, {from:44, to:53}],
        expectation: GameStatus.Draw,
    }
];

/**
 * Test for threefold repetition.
 */
test('Threefold Repetition Test', () => {
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
        expect(engine.getGameStatus()).toBe(game.expectation);

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});