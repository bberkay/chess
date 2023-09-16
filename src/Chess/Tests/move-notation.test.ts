/**
 * Test file for move notation by playing a random game
 * that includes every move type.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { Square, StartPosition } from '../Types';
import { ChessEngine } from '../Engine/ChessEngine';

/**
 * Random game that includes every move type.
 */
const game: Test = {
    title: "Move Notation Test",
    board: StartPosition.Standard,
    moves: [
        {from: Square.e2, to: Square.e4},
        {from: Square.b8, to: Square.c6},
        {from: Square.e4, to: Square.e5},
        {from: Square.c6, to: Square.e5},
        {from: Square.d2, to: Square.d4},
        {from: Square.g8, to: Square.h6},
        {from: Square.d4, to: Square.d5},
        {from: Square.c7, to: Square.c5},
        {from: Square.d5, to: Square.c6}, // En passant
        {from: Square.b7, to: Square.c6},
        {from: Square.f1, to: Square.c4},
        {from: Square.g7, to: Square.g6},
        {from: Square.g1, to: Square.f3},
        {from: Square.f8, to: Square.g7},
        {from: Square.c1, to: Square.f4},
        {from: Square.e8, to: Square.h8}, // King side castling
        {from: Square.b1, to: Square.c3},
        {from: Square.e5, to: Square.f3}, // White in check
        {from: Square.g2, to: Square.f3},
        {from: Square.e7, to: Square.e6},
        {from: Square.d1, to: Square.d4},
        {from: Square.g7, to: Square.h8},
        {from: Square.e1, to: Square.a1}, // Queen side castling
        {from: Square.f8, to: Square.e8},
        {from: Square.f4, to: Square.e3},
        {from: Square.g6, to: Square.g5},
        {from: Square.d4, to: Square.e5},
        {from: Square.h8, to: Square.f6},
        {from: Square.e3, to: Square.d4},
        {from: Square.f6, to: Square.e7},
        {from: Square.f3, to: Square.f4},
        {from: Square.g5, to: Square.g4},
        {from: Square.f4, to: Square.f5},
        {from: Square.g4, to: Square.g3},
        {from: Square.h2, to: Square.h4},
        {from: Square.g3, to: Square.g2},
        {from: Square.h4, to: Square.h5},
        {from: Square.g2, to: Square.h1}, // Promotion move
        {from: Square.h1, to: Square.h1}, // Promote black pawn to black queen
        {from: Square.d4, to: Square.c5},
        {from: Square.d8, to: Square.b6},
        {from: Square.c5, to: Square.d6},
        {from: Square.c8, to: Square.b7},
        {from: Square.d6, to: Square.c5},
        {from: Square.a8, to: Square.c8},
        {from: Square.c5, to: Square.d4},
        {from: Square.b6, to: Square.a6},
        {from: Square.e5, to: Square.g7}, // White Victory
    ],
    expectation: [
        "e4", "nc6", "e5", "nxe5", "d4", "nh6", "d5", "c5", "dxc6", "bxc6", "Bc4", "g6", "Nf3", "bg7", "Bf4",
        "O-O", "Nc3", "nxf3+", "gxf3", "e6", "Qd4", "bh8", "O-O-O", "re8", "Be3", "g5", "Qe5", "bf6", "Bd4",
        "be7", "f4", "g4", "f5", "g3", "h4", "g2", "h5", "gxh1=q", "Bc5", "qb6", "Bd6", "bb7", "Bc5", "rac8",
        "Bd4", "qa6", "Qg7#" // Expected moves in algebraic notation
    ]
}

/**
 * Test file for move notation by playing a random game
 */
test('Algebraic Notation Test', () => {
    const engine = new ChessEngine(true);

    console.log("Testing:        " + game.title);
    console.log("Initial Board:  " + game.board);
    engine.createGame(game.board);

    for(const move of game.moves!) {
        engine.playMove(move.from, move.to);
    }

    console.log("Final Notation: " + engine.getNotation());
    console.log("Final Board:    " + engine.getGameAsFenNotation());

    // Check the notation is equal to the expectation.
    expect(engine.getNotation()).toEqual(game.expectation);

    console.log("Passed");
    console.log("--------------------------------------------------");
});