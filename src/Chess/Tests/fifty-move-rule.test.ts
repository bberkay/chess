/**
 * Fifty-move rule test
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { ChessEngine } from '../Engine/ChessEngine';
import {GameStatus, Square, StartPosition} from "../Types";
import { BoardQueryer } from "../Engine/Board/BoardQueryer";

/**
 * Test the fifty-move rule (50 moves without a capture
 * or a pawn move is a draw)
 */
const fiftyMoveRuleTestGames: Test[] = [
    {
        title: "Fifty-move rule is reset by capture/pawn move",
        board: '3k4/1r6/8/5n2/8/6N1/1P6/4K3 w - - 0 1',
        moves: [
            {from: Square.e1, to: Square.e2},
            {from: Square.f5, to: Square.g7},
            {from: Square.e2, to: Square.e1},
            {from: Square.b7, to: Square.b2}, // Rook capture pawn on b2, half move count is reset.
        ],
        expectation: 0 // Expected half move clock.
    },
    {
        title: 'Fifty-move rule in progress',
        board: '3k4/1r6/8/5n2/8/6N1/1P6/4K3 w - - 0 1',
        moves: [
            {from: Square.e1, to: Square.e2},
            {from: Square.f5, to: Square.g7},
            {from: Square.e2, to: Square.e1},
        ],
        expectation: 3 // Expected half move clock.
    },
    {
        title: 'Fifty-move rule completed',
        board: StartPosition.Standard,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.g3, to: Square.e4},
            {from: Square.f5, to: Square.g7},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5},
            {from: Square.e4, to: Square.g3},
            {from: Square.g7, to: Square.f5}, // 50 moves without a capture or pawn move.
        ],
        expectation: GameStatus.Draw
    }
]

// Convert FEN to JSON
test('Fifty Move Rule Test', () => {
    const engine = new ChessEngine();
    for(const game of fiftyMoveRuleTestGames)
    {
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);

        // Play moves
        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        /**
         * Check if the expectation is a number, if it is, then
         * check if the half move count is equal to the expectation.
         * If it is not, then check if the game status is equal to the expectation.
         */
        if(typeof game.expectation === "number")
            expect(BoardQueryer.getHalfMoveCount()).toBe(game.expectation);
        else
            expect(engine.getGameStatus()).toBe(game.expectation);

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
