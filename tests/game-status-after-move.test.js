"use strict";
/**
 * Test file for game status after move like check, checkmate, stalemate, etc.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Games with expected GameStatus after the
 * moves are played.
 */
var games = [
    {
        title: "Check Test",
        board: Types_1.StartPosition.Check,
        moves: [
            { from: Types_1.Square.d5, to: Types_1.Square.e5 }
        ],
        expectation: Types_1.GameStatus.BlackInCheck
    },
    {
        title: "En Passant Check Test",
        board: Types_1.StartPosition.EnPassantCheck,
        moves: [
            { from: Types_1.Square.d2, to: Types_1.Square.d4 },
            { from: Types_1.Square.a7, to: Types_1.Square.a6 },
            { from: Types_1.Square.d4, to: Types_1.Square.d5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e5 },
            { from: Types_1.Square.d5, to: Types_1.Square.e6 }
        ],
        expectation: Types_1.GameStatus.BlackInCheck
    },
    {
        title: "Checkmate Test",
        board: Types_1.StartPosition.Checkmate,
        moves: [
            { from: Types_1.Square.b1, to: Types_1.Square.a1 },
            { from: Types_1.Square.e6, to: Types_1.Square.a6 },
            { from: Types_1.Square.a1, to: Types_1.Square.a6 }
        ],
        expectation: Types_1.GameStatus.WhiteVictory
    },
    {
        title: "Stalemate Test",
        board: Types_1.StartPosition.Stalemate,
        moves: [
            { from: Types_1.Square.g4, to: Types_1.Square.g5 }
        ],
        expectation: Types_1.GameStatus.Draw
    },
    {
        title: "Double Check Test",
        board: Types_1.StartPosition.DoubleCheck,
        moves: [
            { from: Types_1.Square.f7, to: Types_1.Square.d6 }
        ],
        expectation: Types_1.GameStatus.BlackInCheck
    },
    {
        title: "Adjacent Checkmate Test",
        board: Types_1.StartPosition.AdjacentCheckmate,
        moves: [
            { from: Types_1.Square.f4, to: Types_1.Square.f7 }
        ],
        expectation: Types_1.GameStatus.WhiteVictory
    },
    {
        title: "Checkmate With Double Check Test",
        board: Types_1.StartPosition.CheckmateWithDoubleCheck,
        moves: [
            { from: Types_1.Square.f7, to: Types_1.Square.d6 }
        ],
        expectation: Types_1.GameStatus.WhiteVictory
    }
];
// Test every game
(0, vitest_1.test)("Game Status After Move", function () {
    // Create chess engine
    var engine = new ChessEngine_1.ChessEngine();
    // Test every game
    for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
        var game = games_1[_i];
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());
        // Check if the game status is the expected
        (0, vitest_1.expect)(engine.getStatusOfGame()).toBe(game.expectation);
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
