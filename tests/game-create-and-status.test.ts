/**
 * Test file for creating a game and checking the status of the game
 * after creating without any moves.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { GameStatus } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

/**
 * Games with expected status after creating board.
 */
const games: Test[] = [
    {
        title: "White Victory",
        board: "rnbqkbnr/pppppQpp/8/8/2B5/8/PPPPPPPP/RNB1K1NR b KQkq - 0 1",
        expectation: GameStatus.WhiteVictory
    },
    {
        title: "Black Victory",
        board: "rnb1k1nr/pppppppp/8/2b5/8/8/PPPPPqPP/RNBQKBNR w KQkq - 0 1",
        expectation: GameStatus.BlackVictory
    },
    {
        title: "White In Check",
        board: "rnbqk1nr/pppppppp/8/8/7b/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1",
        expectation: GameStatus.WhiteInCheck
    },
    {
        title: "Black In Check",
        board: "rnbqkbnr/ppppp1pp/5p2/7B/8/8/PPPPPPPP/RNBQK1NR b KQkq - 0 1",
        expectation: GameStatus.BlackInCheck
    },
    {
        title: "Stalemate",
        board: "k7/5R2/8/6p1/6P1/8/7K/1R6 b - - 0 1",
        expectation: GameStatus.Draw
    },
    {
        title: "50 Move Rule",
        board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 50 1",
        expectation: GameStatus.Draw
    },
    {
        title: "In Play",
        board: "r3k1n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R2QK2R w KQq - 0 1",
        expectation: GameStatus.InPlay
    },
    {
        title: "Not Started (Black and/or White King Missing)",
        board: "r5n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R3K2R w KQa - 0 1",
        expectation: GameStatus.NotStarted
    }
]

// Test every status of the game
test(`Game Status on Start`, () => {
    // Create chess engine
    const chessEngine = new ChessEngine();

    // Test every game
    for (const game of games) {
        console.log("Testing: " + game.title);
        console.log("Board: " + game.board);
        chessEngine.createGame(game.board);

        expect(chessEngine.getStatus()).toBe(game.expectation);
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
