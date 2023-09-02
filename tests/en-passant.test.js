"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
// Possible En Passant Moves
var possibleEnPassantGames = [
    {
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.e5, to: Types_1.Square.d6 }
    },
    {
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        "expectedEnPassantMove": { from: Types_1.Square.d5, to: Types_1.Square.e6 }
    }
];
(0, vitest_1.test)('Possible En Passant Moves', function () {
    for (var _i = 0, possibleEnPassantGames_1 = possibleEnPassantGames; _i < possibleEnPassantGames_1.length; _i++) {
        var game = possibleEnPassantGames_1[_i];
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectedEnPassantMove.from)[Types_1.MoveType.EnPassant][0]).toEqual(game.expectedEnPassantMove.to);
    }
});
// Missed En Passant Moves(one turn limit when it was possible)
var missedEnPassantGames = [
    {
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.e5, to: [] }
    },
    {
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 },
            { from: Types_1.Square.h2, to: Types_1.Square.h3 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)('Missed En Passant Moves', function () {
    for (var _i = 0, missedEnPassantGames_1 = missedEnPassantGames; _i < missedEnPassantGames_1.length; _i++) {
        var game = missedEnPassantGames_1[_i];
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectedEnPassantMove.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});
// Forbidden En Passant Moves (enemy pawn is not play 2 square directly from start position)
var forbiddenEnPassantGames = [
    {
        "board": Types_1.StartPosition.EnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.d7, to: Types_1.Square.d6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d6, to: Types_1.Square.d5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.e5, to: [] }
    },
    {
        "board": Types_1.StartPosition.EnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.e7, to: Types_1.Square.e6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e6, to: Types_1.Square.e5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)("Forbidden En Passant Games Because Of Enemy Pawn's Move", function () {
    for (var _i = 0, forbiddenEnPassantGames_1 = forbiddenEnPassantGames; _i < forbiddenEnPassantGames_1.length; _i++) {
        var game = forbiddenEnPassantGames_1[_i];
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectedEnPassantMove.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});
// Forbidden En Passant Moves (because king will be in danger when en passant move done)
var forbiddenEnPassantGamesForKingProtection = [
    {
        "board": Types_1.StartPosition.ForbiddenEnPassantLeft,
        "moves": [
            { from: Types_1.Square.e2, to: Types_1.Square.e4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.e4, to: Types_1.Square.e5 },
            { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        ],
        "expectedEnPassantMove": { from: Types_1.Square.e5, to: [] }
    },
    {
        "board": Types_1.StartPosition.ForbiddenEnPassantRight,
        "moves": [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 }
        ],
        "expectedEnPassantMove": { from: Types_1.Square.d5, to: [] }
    }
];
(0, vitest_1.test)('Forbidden En Passant Moves Because Of King Protection', function () {
    for (var _i = 0, forbiddenEnPassantGamesForKingProtection_1 = forbiddenEnPassantGamesForKingProtection; _i < forbiddenEnPassantGamesForKingProtection_1.length; _i++) {
        var game = forbiddenEnPassantGamesForKingProtection_1[_i];
        var engine = new ChessEngine_1.ChessEngine();
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        (0, vitest_1.expect)(engine.getMoves(game.expectedEnPassantMove.from)[Types_1.MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});
