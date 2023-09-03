"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Possible En Passant Moves
 */
var possibleEnPassantTestGames = [
    {
        "title": "En Passant Left Test",
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        "expectation": { from: Types_1.Square.e5, to: Types_1.Square.d6 }
    },
    {
        "title": "En Passant Right Test",
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        "expectation": { from: Types_1.Square.d5, to: Types_1.Square.e6 }
    }
];
(0, vitest_1.test)('Possible En Passant Moves', function () {
    for (var _i = 0, possibleEnPassantTestGames_1 = possibleEnPassantTestGames; _i < possibleEnPassantTestGames_1.length; _i++) {
        var game = possibleEnPassantTestGames_1[_i];
        console.log("Testing: " + game.title);
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectation.from)[Types_1.MoveType.EnPassant][0]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});
/**
 * Missed En Passant Moves, one turn limit
 * when it was possible
 */
var missedEnPassantTestGames = [
    {
        "title": "Missed En Passant Left Test",
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        "expectation": { from: Types_1.Square.e5, to: [] }
    },
    {
        "title": "Missed En Passant Right Test",
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        "expectation": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)('Missed En Passant Moves', function () {
    for (var _i = 0, missedEnPassantTestGames_1 = missedEnPassantTestGames; _i < missedEnPassantTestGames_1.length; _i++) {
        var game = missedEnPassantTestGames_1[_i];
        console.log("Testing: " + game.title);
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectation.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});
/**
 * Forbidden En Passant Moves, enemy pawn is not play 2
 * square directly from start position
 */
var forbiddenEnPassantTestGames = [
    {
        "title": "Forbidden En Passant Left Test",
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.d7, to: Types_1.Square.d6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d6, to: Types_1.Square.d5 },
        ],
        "expectation": { from: Types_1.Square.e5, to: [] }
    },
    {
        "title": "Forbidden En Passant Right Test",
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.e7, to: Types_1.Square.e6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e6, to: Types_1.Square.e5 },
        ],
        "expectation": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)("Forbidden En Passant Games Because Of Enemy Pawn's Move", function () {
    for (var _i = 0, forbiddenEnPassantTestGames_1 = forbiddenEnPassantTestGames; _i < forbiddenEnPassantTestGames_1.length; _i++) {
        var game = forbiddenEnPassantTestGames_1[_i];
        console.log("Testing: " + game.title);
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectation.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});
/**
 * Forbidden En Passant Moves, king will be
 * in danger when en passant move done
 */
var forbiddenEnPassantGamesForKingProtectionTestGames = [
    {
        "title": "Forbidden En Passant Left Test",
        "board": Types_1.StartPosition.ForbiddenEnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        "expectation": { from: Types_1.Square.e5, to: [] }
    },
    {
        "title": "Forbidden En Passant Right Test",
        "board": Types_1.StartPosition.ForbiddenEnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        "expectation": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)('Forbidden En Passant Moves Because Of King Protection', function () {
    for (var _i = 0, forbiddenEnPassantGamesForKingProtectionTestGames_1 = forbiddenEnPassantGamesForKingProtectionTestGames; _i < forbiddenEnPassantGamesForKingProtectionTestGames_1.length; _i++) {
        var game = forbiddenEnPassantGamesForKingProtectionTestGames_1[_i];
        console.log("Testing: " + game.title);
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectation.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});
