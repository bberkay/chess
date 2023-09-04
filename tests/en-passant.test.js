"use strict";
/**
 * Test file for every en passant move every situation like possible,
 * missed, forbidden, etc.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Every En Passant Test Games
 */
var enPassantTestGames = [
    {
        title: "Possible En Passant Left Test",
        board: Types_1.StartPosition.EnPassantLeft,
        moves: [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        expectation: { from: Types_1.Square.e5, to: [Types_1.Square.d6] }
    },
    {
        title: "Possible En Passant Right Test",
        board: Types_1.StartPosition.EnPassantRight,
        moves: [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        expectation: { from: Types_1.Square.d5, to: [Types_1.Square.e6] }
    },
    {
        title: "Missed En Passant Left Because Of One Turn Limit",
        board: Types_1.StartPosition.EnPassantLeft,
        moves: [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        expectation: { from: Types_1.Square.e5, to: [] }
    },
    {
        title: "Missed En Passant Right Because Of One Turn Limit",
        board: Types_1.StartPosition.EnPassantRight,
        moves: [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        expectation: { from: Types_1.Square.d5, to: [] }
    },
    {
        title: "Forbidden Left En Passant Move Because enemy pawn is not play 2 square directly from start position",
        board: Types_1.StartPosition.EnPassantLeft,
        moves: [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.d7, to: Types_1.Square.d6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d6, to: Types_1.Square.d5 },
        ],
        expectation: { from: Types_1.Square.e5, to: [] }
    },
    {
        title: "Forbidden Right En Passant Move Because enemy pawn is not play 2 square directly from start position",
        board: Types_1.StartPosition.EnPassantRight,
        moves: [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.e7, to: Types_1.Square.e6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e6, to: Types_1.Square.e5 },
        ],
        expectation: { from: Types_1.Square.d5, to: [] }
    },
    {
        title: "Forbidden Left En Passant Moves Because Of King Protection",
        board: Types_1.StartPosition.ForbiddenEnPassantLeft,
        moves: [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        expectation: { from: Types_1.Square.e5, to: [] }
    },
    {
        title: "Forbidden Right En Passant Moves Because Of King Protection",
        board: Types_1.StartPosition.ForbiddenEnPassantRight,
        moves: [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        expectation: { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)('En Passant Moves', function () {
    var engine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, enPassantTestGames_1 = enPassantTestGames; _i < enPassantTestGames_1.length; _i++) {
        var game = enPassantTestGames_1[_i];
        console.log("Testing: " + game.title);
        console.log("Initial Board: " + game.board);
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        /**
         * Check the en passant move is equal to the expectation.
         * "from: Square" means tested pawn's square.
         * "to: []" means there is no en passant move.
         * "to: [Square]" means there is en passant move.
         */
        (0, vitest_1.expect)(engine.getMoves(game.expectation.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Final Board: " + engine.getGameAsFenNotation());
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
