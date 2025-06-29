/**
 * Test for threefold repetition. The game is drawn if the same position occurs three times.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { GameStatus, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Board with expected repetition moves.
 */
const games: TestGame[] = [
    {
        title: "Threefold repetition test",
        board: StartPosition.Standard,
        moves: [{ from: 53, to: 37 },{ from: 13, to: 29 },{ from: 63, to: 46 },{ from: 7, to: 22 },{ from: 52, to: 44 },{ from: 6, to: 27 },{ from: 58, to: 52 },{ from: 12, to: 20 },{ from: 52, to: 35 },{ from: 2, to: 19 },{ from: 51, to: 43 },{ from: 3, to: 39 },{ from: 50, to: 34 },{ from: 27, to: 18 },{ from: 35, to: 18 },{ from: 9, to: 18 },{ from: 62, to: 53 },{ from: 19, to: 13 },{ from: 56, to: 48 },{ from: 11, to: 27 },{ from: 48, to: 39 },{ from: 22, to: 39 },{ from:34, to: 27 },{ from: 39, to: 22 },{ from: 27, to: 20 },{ from: 4, to: 20 },{ from: 59, to: 50 }, { from: 18, to: 26 }, { from: 43, to: 35 },{ from: 26, to: 35 }, { from: 50, to: 29 }, { from: 20, to: 34 }, { from: 60, to: 52 }, { from: 34, to: 52 }, { from: 46, to: 52 }, { from: 22, to: 12 }, { from: 52, to: 35 }, { from: 12, to: 29 }, { from: 35, to: 29 }, { from: 5, to: 8 },{ from: 29, to: 12 }, { from: 6, to: 5 }, { from: 53, to: 32 }, { from: 13, to: 23 }, { from: 32, to: 23 }, { from: 14, to: 23 }, { from: 61, to: 57 }, { from: 1, to: 49 }, { from: 54, to: 46 }, { from: 5, to: 3 }, { from: 59, to: 58 }, { from: 3, to: 51 }, { from: 55, to: 39 }, { from: 51, to: 50 }, { from: 58, to: 59 }, { from: 50, to: 51 }, { from: 59, to: 58 }, { from: 49, to: 50 }, { from: 58, to: 57 },{ from: 50, to: 49 },{ from: 57, to: 58 }],
        expectation: GameStatus.Draw
    },
    {
        // https://www.chessgames.com/perl/chessgame?gid=2694350
        title: "Ian Nepomniachtchi vs Hikaru Nakamura, World Championship Candidates (2024), Toronto CAN, rd 13, Apr-20",
        board: StartPosition.Standard,
        moves: [{from:53,to:37},{from:13,to:29},{from:63,to:46},{from:2,to:19},{from:62,to:26},{from:9,to:17},{from:26,to:33},{from:6,to:27},{from:61,to:64},{from:7,to:13},{from:51,to:43},{from:13,to:23},{from:52,to:36},{from:27,to:9},{from:59,to:31},{from:14,to:22},{from:31,to:45},{from:5,to:8},{from:58,to:52},{from:7,to:8},{from:62,to:61},{from:29,to:36},{from:46,to:36},{from:19,to:36},{from:45,to:36},{from:9,to:36},{from:43,to:36},{from:12,to:28},{from:37,to:28},{from:4,to:28},{from:52,to:37},{from:28,to:4},{from:33,to:51},{from:22,to:30},{from:37,to:27},{from:10,to:18},{from:27,to:44},{from:3,to:10},{from:44,to:29},{from:4,to:31},{from:36,to:28},{from:1,to:4},{from:51,to:42},{from:11,to:27},{from:29,to:46},{from:31,to:32},{from:46,to:29},{from:32,to:31},{from:29,to:46},{from:31,to:32},{from:46,to:29},{from:32,to:31}],
        expectation: GameStatus.Draw,
    }
];

/**
 * Test for threefold repetition.
 */
describe('Threefold Repetition Test', () => {
    // Test every game
    for (const game of games) {
        test(game.title, () => {
            const engine = new ChessEngine();
            engine.createGame(game.board);
            console.log("Initial Board:  " + engine.getGameAsFenNotation());

            for (const move of game.moves!) {
                engine.playMove(move.from, move.to);
            }

            console.log("Final Notation: " + engine.getAlgebraicNotation());
            console.log("Final Board:    " + engine.getGameAsFenNotation());

            // Check if the game status is the expected
            expect(engine.getGameStatus()).toBe(game.expectation);
        });
    }
});
