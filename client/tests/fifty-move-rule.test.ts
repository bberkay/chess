/**
 * Fifty-move rule test
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';
import { GameStatus, Square, StartPosition } from "@Chess/Types";
import { BoardQuerier } from "@Chess/Engine/Board/BoardQuerier";

/**
 * Test the fifty-move rule (50 moves without a capture
 * or a pawn move is a draw)
 */
const fiftyMoveRuleTestGames: TestGame[] = [
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
        // https://www.chessgames.com/perl/chessgame?gid=1972221
        title: 'Fifty-move rule complete / Daniil Yuffa vs Luke McShane, World Cup (2019), Khanty-Mansiysk RUS, rd 2, Sep-13',
        board: StartPosition.Standard,
        moves: [{from: 52, to: 36},{from: 7, to: 22},{from: 51, to: 35},{from: 15, to: 23},{from: 58, to: 43},{from: 6, to: 15},{from: 53, to: 37},{from: 12, to: 20},{from: 63, to: 46},{from: 5, to: 8},{from: 62, to: 53},{from: 13, to: 29},{from: 61, to: 64},{from: 2, to: 17},{from: 59, to: 45},{from: 4, to: 5},{from: 36, to: 29},{from: 20, to: 29},{from: 56, to: 48},{from: 10, to: 18},{from: 49, to: 41},{from: 17, to: 27},{from: 60, to: 51},{from: 22, to: 12},{from: 43, to: 28},{from: 5, to: 4},{from: 50, to: 34},{from: 27, to: 21},{from: 34, to: 26},{from: 3, to: 10},{from: 57, to: 60},{from: 11, to: 19},{from: 26, to: 19},{from: 10, to: 19},{from: 51, to: 58},{from: 1, to: 3},{from: 53, to: 44},{from: 12, to: 27},{from: 44, to: 51},{from: 4, to: 5},{from: 55, to: 47},{from: 7, to: 8},{from: 48, to: 40},{from: 16, to: 32},{from: 63, to: 56},{from: 19, to: 12},{from: 60, to: 52},{from: 21, to: 4},{from: 56, to: 63},{from: 4, to: 10},{from: 62, to: 61},{from: 12, to: 39},{from: 46, to: 56},{from: 39, to: 21},{from: 56, to: 46},{from: 10, to: 25},{from: 58, to: 49},{from: 27, to: 10},{from: 51, to: 44},{from: 5, to: 33},{from: 46, to: 31},{from: 21, to: 28},{from: 35, to: 28},{from: 10, to: 20},{from: 52, to: 51},{from: 3, to: 51},{from: 44, to: 51},{from: 33, to: 26},{from: 41, to: 33},{from: 26, to: 34},{from: 61, to: 58},{from: 34, to: 35},{from: 49, to: 35},{from: 25, to: 35},{from: 45, to: 59},{from: 6, to: 3},{from: 51, to: 44},{from: 8, to: 7},{from: 63, to: 62},{from: 20, to: 10},{from: 62, to: 53},{from: 15, to: 6},{from: 54, to: 38},{from: 6, to: 20},{from: 38, to: 30},{from: 23, to: 30},{from: 37, to: 30},{from: 20, to: 13},{from: 31, to: 37},{from: 35, to: 20},{from: 30, to: 22},{from: 13, to: 4},{from: 59, to: 41},{from: 20, to: 37},{from: 44, to: 37},{from: 4, to: 22},{from: 28, to: 20},{from: 10, to: 4},{from: 58, to: 59},{from: 3, to: 59},{from: 41, to: 59},{from: 4, to: 21},{from: 59, to: 45},{from: 7, to: 6},{from: 53, to: 44},{from: 21, to: 36},{from: 44, to: 35},{from: 6, to: 5},{from: 35, to: 28},{from: 36, to: 53},{from: 28, to: 19},{from: 53, to: 47},{from: 20, to: 12},{from: 5, to: 4},{from: 33, to: 25},{from: 18, to: 25},{from: 45, to: 9},{from: 4, to: 13},{from: 37, to: 28},{from: 13, to: 6},{from: 9, to: 45},{from: 22, to: 4},{from: 45, to: 27},{from: 6, to: 15},{from: 27, to: 18},{from: 4, to: 13},{from: 18, to: 25},{from: 47, to: 30},{from: 12, to: 4},{from: 12, to: 4},{from: 13, to: 4},{from: 25, to: 4},{from: 14, to: 22},{from: 19, to: 12},{from: 30, to: 40},{from: 12, to: 21},{from: 40, to: 23},{from: 4, to: 22},{from: 15, to: 24},{from: 21, to: 30},{from: 32, to: 40},{from: 22, to: 31},{from: 24, to: 15},{from: 28, to: 37},{from: 15, to: 14},{from: 31, to: 22},{from: 23, to: 13},{from: 30, to: 29},{from: 13, to: 23},{from: 29, to: 30},{from: 23, to: 13},{from: 30, to: 31},{from: 14, to: 21},{from: 22, to: 36},{from: 40, to: 48},{from: 36, to: 63},{from: 21, to: 29},{from: 37, to: 58},{from: 13, to: 28},{from: 58, to: 30},{from: 48, to: 56},{from: 63, to: 56},{from: 29, to: 36},{from: 30, to: 16},{from: 28, to: 34},{from: 31, to: 30},{from: 34, to: 44},{from: 56, to: 63},{from: 36, to: 28},{from: 16, to: 7},{from: 28, to: 20},{from: 30, to: 37},{from: 44, to: 27},{from: 37, to: 36},{from: 27, to: 21},{from: 36, to: 35},{from: 20, to: 29},{from: 63, to: 56},{from: 29, to: 30},{from: 7, to: 16},{from: 30, to: 22},{from: 35, to: 28},{from: 21, to: 15},{from: 56, to: 29},{from: 22, to: 14},{from: 16, to: 51},{from: 15, to: 5},{from: 29, to: 50},{from: 5, to: 15},{from: 28, to: 29},{from: 15, to: 5},{from: 50, to: 59},{from: 5, to: 15},{from: 51, to: 42},{from: 14, to: 23},{from: 42, to: 33},{from: 23, to: 14},{from: 33, to: 12},{from: 14, to: 13},{from: 12, to: 39},{from: 13, to: 14},{from: 39, to: 53},{from: 14, to: 23},{from: 53, to: 60},{from: 23, to: 14},{from: 59, to: 52},{from: 14, to: 23},{from: 60, to: 51},{from: 23, to: 14},{from: 29, to: 20},{from: 15, to: 5},{from: 20, to: 12},{from: 5, to: 22},{from: 12, to: 19},{from: 22, to: 5},{from: 19, to: 28},{from: 5, to: 22},{from: 28, to: 29},{from: 22, to: 5},{from: 51, to: 42},{from: 14, to: 23},{from: 52, to: 25},{from: 5, to: 15},{from: 25, to: 4},{from: 15, to: 32},{from: 4, to: 40},{from: 32, to: 15},{from: 42, to: 51},{from: 23, to: 14},{from: 29, to: 20},{from: 15, to: 5},{from: 20, to: 12},{from: 5, to: 22},{from: 12, to: 4},{from: 14, to: 21},{from: 51, to: 42},{from: 21, to: 29},{from: 40, to: 47},{from: 29, to: 36},{from: 4, to: 13},{from: 22, to: 37},{from: 47, to: 56},{from: 37, to: 52},{from: 42, to: 60},{from: 52, to: 37},{from: 13, to: 21},{from: 37, to: 27},{from: 21, to: 20},{from: 27, to: 44},{from: 56, to: 47},{from: 36, to: 35},{from: 60, to: 53},{from: 35, to: 36},{from: 47, to: 40},{from: 36, to: 43},{from: 40, to: 31},{from: 44, to: 50},{from: 20, to: 28},{from: 43, to: 42},{from: 31, to: 22},{from: 42, to: 51},{from: 53, to: 32},{from: 51, to: 42},{from: 32, to: 23}],
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

        console.log("Final Notation: " + engine.getAlgebraicNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        /**
         * Check if the expectation is a number, if it is, then
         * check if the half move count is equal to the expectation.
         * If it is not, then check if the game status is equal to the expectation.
         */
        if(typeof game.expectation === "number")
            expect(BoardQuerier.getHalfMoveCount()).toBe(game.expectation);
        else
            expect(engine.getGameStatus()).toBe(game.expectation);

        console.log("--------------------------------------------------");
    }
});
