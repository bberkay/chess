/**
 * Test for pawn promotion.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';


/**
 * Random game with that contains promotion move
 * for one white pawn.
 */
const promotionTestGames: Test[] = [
    {
        title: "Promote Pawn To Queen on e8",
        board: StartPosition.Promotion,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.e8},
            {from: Square.e8, to: Square.e8} // Promote to queen (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4Q3/8/8/k7/8/8/8/4K3 b - - 3 2",
    },
    {
        title: "Promote Pawn To Rook on e8",
        board: StartPosition.Promotion,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.e8},
            {from: Square.e8, to: Square.e7} // Promote to rook (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4R3/8/8/k7/8/8/8/4K3 b - - 3 2",
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
        expectation: "4B3/8/8/k7/8/8/8/4K3 b - - 3 2",
    },
    {
        title: "Promote Pawn To Knight on e8",
        board: StartPosition.Promotion,
        moves: [
            {from: Square.e6, to: Square.e7},
            {from: Square.a6, to: Square.a5},
            {from: Square.e7, to: Square.e8},
            {from: Square.e8, to: Square.e5} // Promote to knight (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4N3/8/8/k7/8/8/8/4K3 b - - 3 2",
    }
]

// Test for promotion move.
test('Promote pawn to the every promotion option', () => {
    const chessEngine = new ChessEngine();

    for(const game of promotionTestGames){
        console.log("Testing: " + game.title);
        console.log("Initial Board: " + game.board);
        chessEngine.createGame(game.board);

        // Play moves
        for (const move of game.moves!) {
            chessEngine.playMove(move.from, move.to);
        }

        // Check the pawn is promoted to the current type of promotion.
        expect(chessEngine.getGameAsFenNotation()).toEqual(game.expectation!);
        console.log("Final Board: " + chessEngine.getGameAsFenNotation());
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});