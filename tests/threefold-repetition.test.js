"use strict";
/**
 * Test for threefold repetition. The game is drawn if the same position occurs three times.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Board with expected repetition moves.
 */
var game = {
    title: "Threefold Repetition Test",
    board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    moves: [
        { from: Types_1.Square.d2, to: Types_1.Square.d4 },
        { from: Types_1.Square.d7, to: Types_1.Square.d5 },
        { from: Types_1.Square.e1, to: Types_1.Square.d2 },
        { from: Types_1.Square.e8, to: Types_1.Square.d7 },
        { from: Types_1.Square.d2, to: Types_1.Square.e1 },
        { from: Types_1.Square.d7, to: Types_1.Square.e8 },
        { from: Types_1.Square.e1, to: Types_1.Square.d2 },
        { from: Types_1.Square.e8, to: Types_1.Square.d7 },
        { from: Types_1.Square.d2, to: Types_1.Square.e1 },
        { from: Types_1.Square.d7, to: Types_1.Square.e8 },
        { from: Types_1.Square.e1, to: Types_1.Square.d2 },
        { from: Types_1.Square.e8, to: Types_1.Square.d7 },
    ],
    expectation: Types_1.GameStatus.Draw
};
/**
 * Test for threefold repetition.
 */
(0, vitest_1.test)('Threefold Repetition Test', function () {
    console.log("Testing:       " + game.title);
    console.log("Initial Board: " + game.board);
    var chessEngine = new ChessEngine_1.ChessEngine();
    chessEngine.createGame(game.board);
    // Play moves
    for (var _i = 0, _a = game.moves; _i < _a.length; _i++) {
        var move = _a[_i];
        chessEngine.playMove(move.from, move.to);
    }
    console.log("Notation:      " + chessEngine.getNotation());
    console.log("Final Board:   " + chessEngine.getGameAsFenNotation());
    // Check if the game is drawn
    (0, vitest_1.expect)(chessEngine.getStatusOfGame()).toEqual(game.expectation);
    console.log("Passed");
    console.log("--------------------------------------------------");
});
