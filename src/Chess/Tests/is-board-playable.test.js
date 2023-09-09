"use strict";
/**
 * Test file that check the board is playable/can be finished on start or mid-game.
 * For example: If board has no pieces expect kings, then game is not playable.
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
        title: "1 White King, 1 Black King",
        board: "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.NotStarted
    },
    {
        title: "1 White King, 1 Black King, 1 White Pawn",
        board: "4k3/8/8/8/8/5P2/8/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.InPlay
    },
    {
        title: "1 White King, 1 Black King, 1 White Bishop",
        board: "4k3/8/8/8/8/8/5B2/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.NotStarted
    },
    {
        title: "1 White King, 1 Black King, 1 White Knight",
        board: "4k3/8/8/8/8/8/5N2/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.NotStarted
    },
    {
        title: "1 White King, 1 Black King, 1 White Rook",
        board: "4k3/8/8/8/8/8/5R2/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.InPlay
    },
    {
        title: "1 White King, 1 Black King, 1 White Bishop, 1 White Knight",
        board: "4k3/8/8/8/8/8/3N1B2/4K3 w - - 0 1",
        moves: [],
        expectation: Types_1.GameStatus.InPlay
    },
    {
        title: "1 White King, 1 Black King, 1 Black Knight after 1 move",
        board: "4k3/3n4/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.f2 }
        ],
        expectation: Types_1.GameStatus.Draw
    },
    {
        title: "1 White King, 1 Black King, 1 Black Bishop after 1 move",
        board: "4k3/3b4/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.f2 }
        ],
        expectation: Types_1.GameStatus.Draw
    },
    {
        title: "1 White King, 1 Black King, 1 Black Bishop, 1 Black Knight after 1 move",
        board: "4k3/3b1n2/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.f2 }
        ],
        expectation: Types_1.GameStatus.InPlay
    },
    {
        title: "1 White King, 1 Black King after 1 move",
        board: "4k3/8/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.f2 }
        ],
        expectation: Types_1.GameStatus.Draw
    }
];
// Test Playable/Unplayable Boards
(0, vitest_1.test)("Is Board Playable", function () {
    // Create chess engine
    var chessEngine = new ChessEngine_1.ChessEngine();
    // Test every game
    for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
        var game = games_1[_i];
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        chessEngine.createGame(game.board);
        // Make moves(if any)
        if (game.moves.length > 0) {
            for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
                var move = _b[_a];
                chessEngine.playMove(move.from, move.to);
            }
        }
        (0, vitest_1.expect)(chessEngine.getStatusOfGame()).toBe(game.expectation);
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
