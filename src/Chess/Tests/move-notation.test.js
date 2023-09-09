"use strict";
/**
 * Test file for move notation by playing a random game
 * that includes every move type.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Random game that includes every move type.
 */
var game = {
    title: "Move Notation Test",
    board: Types_1.StartPosition.Standard,
    moves: [
        { from: Types_1.Square.e2, to: Types_1.Square.e4 },
        { from: Types_1.Square.b8, to: Types_1.Square.c6 },
        { from: Types_1.Square.e4, to: Types_1.Square.e5 },
        { from: Types_1.Square.c6, to: Types_1.Square.e5 },
        { from: Types_1.Square.d2, to: Types_1.Square.d4 },
        { from: Types_1.Square.g8, to: Types_1.Square.h6 },
        { from: Types_1.Square.d4, to: Types_1.Square.d5 },
        { from: Types_1.Square.c7, to: Types_1.Square.c5 },
        { from: Types_1.Square.d5, to: Types_1.Square.c6 },
        { from: Types_1.Square.b7, to: Types_1.Square.c6 },
        { from: Types_1.Square.f1, to: Types_1.Square.c4 },
        { from: Types_1.Square.g7, to: Types_1.Square.g6 },
        { from: Types_1.Square.g1, to: Types_1.Square.f3 },
        { from: Types_1.Square.f8, to: Types_1.Square.g7 },
        { from: Types_1.Square.c1, to: Types_1.Square.f4 },
        { from: Types_1.Square.e8, to: Types_1.Square.h8 },
        { from: Types_1.Square.b1, to: Types_1.Square.c3 },
        { from: Types_1.Square.e5, to: Types_1.Square.f3 },
        { from: Types_1.Square.g2, to: Types_1.Square.f3 },
        { from: Types_1.Square.e7, to: Types_1.Square.e6 },
        { from: Types_1.Square.d1, to: Types_1.Square.d4 },
        { from: Types_1.Square.g7, to: Types_1.Square.h8 },
        { from: Types_1.Square.e1, to: Types_1.Square.a1 },
        { from: Types_1.Square.f8, to: Types_1.Square.e8 },
        { from: Types_1.Square.f4, to: Types_1.Square.e3 },
        { from: Types_1.Square.g6, to: Types_1.Square.g5 },
        { from: Types_1.Square.d4, to: Types_1.Square.e5 },
        { from: Types_1.Square.h8, to: Types_1.Square.f6 },
        { from: Types_1.Square.e3, to: Types_1.Square.d4 },
        { from: Types_1.Square.f6, to: Types_1.Square.e7 },
        { from: Types_1.Square.f3, to: Types_1.Square.f4 },
        { from: Types_1.Square.g5, to: Types_1.Square.g4 },
        { from: Types_1.Square.f4, to: Types_1.Square.f5 },
        { from: Types_1.Square.g4, to: Types_1.Square.g3 },
        { from: Types_1.Square.h2, to: Types_1.Square.h4 },
        { from: Types_1.Square.g3, to: Types_1.Square.g2 },
        { from: Types_1.Square.h4, to: Types_1.Square.h5 },
        { from: Types_1.Square.g2, to: Types_1.Square.h1 },
        { from: Types_1.Square.h1, to: Types_1.Square.h1 },
        { from: Types_1.Square.e5, to: Types_1.Square.g7 }, // White Victory
    ],
    expectation: [
        "e4", "nc6", "e5", "nxe5", "d4", "nh6", "d5", "c5", "dxc6", "bxc6", "Bc4", "g6", "Nf3", "bg7", "Bf4",
        "O-O", "Nc3", "nxf3+", "gxf3", "e6", "Qd4", "bh8", "O-O-O", "re8", "Be3", "g5", "Qe5", "bf6", "Bd4",
        "be7", "f4", "g4", "f5", "g3", "h4", "g2", "h5", "gxh1=q", "Qg7#" // Expected moves in algebraic notation
    ]
};
/**
 * Test file for move notation by playing a random game
 */
(0, vitest_1.test)('Algebraic Notation Test', function () {
    var engine = new ChessEngine_1.ChessEngine();
    console.log("Testing:        " + game.title);
    console.log("Initial Board:  " + game.board);
    engine.createGame(game.board);
    for (var _i = 0, _a = game.moves; _i < _a.length; _i++) {
        var move = _a[_i];
        engine.playMove(move.from, move.to);
    }
    console.log("Final Notation: " + engine.getNotation());
    console.log("Final Board:    " + engine.getGameAsFenNotation());
    // Check the notation is equal to the expectation.
    (0, vitest_1.expect)(engine.getNotation()).toEqual(game.expectation);
    console.log("Passed");
    console.log("--------------------------------------------------");
});
