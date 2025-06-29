/**
 * Test for time control logic.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

const games: TestGame[] = [
    {
        title: "Undo last move.",
        board: StartPosition.Standard,
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 }
        ],
        expectation: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
    },
    {
        title: "Undo capture.",
        board: StartPosition.Standard,
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.d7, to: Square.d5 },
            { from: Square.e4, to: Square.d5 },
        ],
        expectation: "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
    },
    {
        title: "Undo check.",
        board: StartPosition.Check,
        moves: [
            { from: Square.d5, to: Square.e5 },
        ],
        expectation: StartPosition.Check
    },
    {
        title: "Undo king side rook.",
        board: StartPosition.Castling,
        moves: [
            { from: Square.e1, to: Square.h1 },
        ],
        expectation: StartPosition.Castling
    },
    {
        title: "Undo queen side rook",
        board: StartPosition.Castling,
        moves: [
            { from: Square.e1, to: Square.a1 },
        ],
        expectation: StartPosition.Castling
    },
    {
        title: "Undo promote",
        board: StartPosition.Promotion,
        moves: [
            { from: Square.e6, to: Square.e7 },
            { from: Square.a6, to: Square.a5 },
            { from: Square.e7, to: Square.e8 },
            { from: Square.e8, to: Square.e8 }, // Promote to queen (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "8/4P3/8/k7/8/8/8/4K3 w - - 1 2"
    },
    {
        title: "Undo promote by capture",
        board: StartPosition.PromotionByCapture,
        moves: [
            { from: Square.e6, to: Square.e7 },
            { from: Square.a6, to: Square.a5 },
            { from: Square.e7, to: Square.d8 },
            { from: Square.d8, to: Square.d8 }, // Promote to queen (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "3r4/4P3/8/k7/8/8/8/4K3 w - - 1 2"
    },
    {
        title: "Undo en passant",
        board: StartPosition.EnPassantLeft,
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.c7, to: Square.c6 },
            { from: Square.e4, to: Square.e5 },
            { from: Square.d7, to: Square.d5 },
            { from: Square.e5, to: Square.d6 },
        ],
        expectation: "8/k7/2p5/3pP3/8/8/5P1K/8 w - d6 0 3"
    }
]

describe("Undo every move type", () => {
    for (const game of games) {
        test(game.title, () => {
            const engine = new ChessEngine();

            engine.createGame(game.board);
            console.log("Initial Board:  " + engine.getGameAsFenNotation());

            if (game.moves) {
                for (const move of game.moves) {
                    engine.playMove(move.from, move.to);
                }
            }

            console.log("Final Notation: " + engine.getAlgebraicNotation());
            console.log("Final Board:    " + engine.getGameAsFenNotation());

            engine.takeBack();

            expect(engine.getGameAsFenNotation()).toEqual(game.expectation);
        });
    }
})


test('Undo last moves consecutively ', () => {
    const game: TestGame = {
        title: "Undo multiple last move.",
        board: StartPosition.Standard,
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
            { from: Square.g7, to: Square.g5 }
        ],
        expectation: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"
    }

    const engine = new ChessEngine();
    engine.createGame(game.board);
    console.log("Initial Board:  " + engine.getGameAsFenNotation());

    for(const move of game.moves!) {
        engine.playMove(move.from, move.to);
    }

    console.log("Final Notation: " + engine.getAlgebraicNotation());
    console.log("Final Board:    " + engine.getGameAsFenNotation());

    engine.takeBack();
    engine.takeBack();

    expect(engine.getGameAsFenNotation()).toEqual(game.expectation);

    console.log("--------------------------------------------------");
});
