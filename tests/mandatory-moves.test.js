"use strict";
/**
 * Test file for mandatory moves for example: If a king is in check
 * then the player must make a move that takes the king out of check.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
var mandatoryMovesTests = [
    {
        title: "White King must move because threat can't be captured",
        board: "7K/5R2/6n1/8/8/8/8/4k3 w - - 0 1",
        expectation: [
            {
                from: Types_1.Square.h8,
                to: [Types_1.Square.g8, Types_1.Square.g7, Types_1.Square.h7] // Expected moves of white king.
            },
            {
                from: Types_1.Square.f7,
                to: [] // Expected move of white rook.
            }
        ]
    },
    {
        title: "White King must move or white bishop must capture enemy knight",
        board: "7K/5R2/6n1/8/8/8/2B5/4k3 w - - 0 1",
        expectation: [
            {
                from: Types_1.Square.h8,
                to: [Types_1.Square.g8, Types_1.Square.g7, Types_1.Square.h7] // Expected moves of white king.
            },
            {
                from: Types_1.Square.f7,
                to: [] // Expected move of white rook
            },
            {
                from: Types_1.Square.c2,
                to: [Types_1.Square.g6] // Expected move of white bishop.
            }
        ]
    },
    {
        title: "White rook must block the check of the black rook",
        board: "K7/8/4RP2/8/8/8/1r5k/r7 w - - 0 1",
        expectation: [
            {
                from: Types_1.Square.a8,
                to: [] // Expected move of white king.
            },
            {
                from: Types_1.Square.e6,
                to: [Types_1.Square.a6] // Expected move of white rook.
            },
            {
                from: Types_1.Square.f6,
                to: [] // Expected move of white pawn.
            }
        ]
    },
    {
        title: "White king must move because of double check",
        board: "4K3/8/3n4/4R2q/8/8/7k/8 w - - 0 1",
        expectation: [
            {
                from: Types_1.Square.e8,
                to: [Types_1.Square.d8, Types_1.Square.d7, Types_1.Square.e7, Types_1.Square.f6]
            },
            {
                from: Types_1.Square.e5,
                to: [] // Expected move of white rook.
            }
        ]
    }
];
/**
 * Test file for move notation by playing a random game
 */
(0, vitest_1.test)('Mandatory Moves Test', function () {
    var engine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, mandatoryMovesTests_1 = mandatoryMovesTests; _i < mandatoryMovesTests_1.length; _i++) {
        var game = mandatoryMovesTests_1[_i];
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);
        // Test every piece and its moves
        for (var _a = 0, _b = game.expectation; _a < _b.length; _a++) {
            var expectation = _b[_a];
            (0, vitest_1.expect)(engine.getMoves(Number(expectation.from))[Types_1.MoveType.Normal].sort())
                .toEqual(expectation.to.sort());
        }
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
