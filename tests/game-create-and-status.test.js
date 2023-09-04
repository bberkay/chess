"use strict";
/**
 * Test file for creating a game and checking the status of the game
 * after creating without any moves.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Games with expected status after creating board.
 */
var games = [
    {
        title: "White Victory",
        board: "rnbqkbnr/pppppQpp/8/8/2B5/8/PPPPPPPP/RNB1K1NR b KQkq - 0 1",
        expectation: Types_1.GameStatus.WhiteVictory
    },
    {
        title: "Black Victory",
        board: "rnb1k1nr/pppppppp/8/2b5/8/8/PPPPPqPP/RNBQKBNR w KQkq - 0 1",
        expectation: Types_1.GameStatus.BlackVictory
    },
    {
        title: "White In Check",
        board: "rnbqk1nr/pppppppp/8/8/7b/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1",
        expectation: Types_1.GameStatus.WhiteInCheck
    },
    {
        title: "Black In Check",
        board: "rnbqkbnr/ppppp1pp/5p2/7B/8/8/PPPPPPPP/RNBQK1NR b KQkq - 0 1",
        expectation: Types_1.GameStatus.BlackInCheck
    },
    {
        title: "Stalemate",
        board: "k7/5R2/8/6p1/6P1/8/7K/1R6 b - - 0 1",
        expectation: Types_1.GameStatus.Draw
    },
    {
        title: "50 Move Rule",
        board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 50 1",
        expectation: Types_1.GameStatus.Draw
    },
    {
        title: "In Play",
        board: "r3k1n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R2QK2R w KQq - 0 1",
        expectation: Types_1.GameStatus.InPlay
    },
    {
        title: "Not Started (Black and/or White King Missing)",
        board: "r5n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R3K2R w KQa - 0 1",
        expectation: Types_1.GameStatus.NotStarted
    }
];
// Test every status of the game
(0, vitest_1.test)("Game Status on Start", function () {
    // Create chess engine
    var chessEngine = new ChessEngine_1.ChessEngine();
    // Test every game
    for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
        var game = games_1[_i];
        console.log("Testing: " + game.title);
        chessEngine.createGame(game.board);
        (0, vitest_1.expect)(chessEngine.getStatus()).toBe(game.expectation);
        console.log("Board After Moves: " + chessEngine.getGameAsFenNotation());
        console.log("Passed: " + game.title);
        console.log("--------------------------------------------------");
    }
});
