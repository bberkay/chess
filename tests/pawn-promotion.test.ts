/**
 * Test for pawn promotion.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';


/**
 * Random game with that contains promotion move
 * for one white pawn.
 */
const promotionTestGames: TestGame[] = [
    {
        title: "Promote Pawn To Queen on e8",
        board: StartPosition.Promotion,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.e8},
            {from: Square.e8, to: Square.e8} // Promote to queen (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4Q3/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Rook on e8 By Capture Black Rook",
        board: StartPosition.PromotionByCapture,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.d8},
            {from: Square.d8, to: Square.d7} // Promote to rook (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "3R4/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Bishop on e8",
        board: StartPosition.Promotion,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.e8},
            {from: Square.e8, to: Square.e6} // Promote to bishop (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4B3/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Knight on e8 By Capture Black Rook",
        board: StartPosition.PromotionByCapture,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.d8},
            {from: Square.d8, to: Square.d5} // Promote to knight (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "3N4/8/8/k7/8/8/8/4K3 b - - 0 2",
    }
]

// Test for promotion move.
test('Promote pawn to the every promotion option', () => {
    const engine = new ChessEngine();

    for(const game of promotionTestGames){
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);

        // Play moves
        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        // Check the pawn is promoted to the current type of promotion.
        expect(engine.getGameAsFenNotation()).toEqual(game.expectation!);

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});