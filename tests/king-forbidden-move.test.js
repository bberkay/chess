"use strict";
/**
 * Test for the king's forbidden move (king cannot move to a square
 * that is under attack).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Board with expected moves for the king on h8.
 */
var game = {
    title: "Forbidden Moves Test For King on h8",
    board: Types_1.StartPosition.KingForbiddenMove,
    expectation: [Types_1.Square.g8]
};
(0, vitest_1.test)('King Forbidden Moves', function () {
    console.log("Testing: " + game.title);
    console.log("Board: " + game.board);
    var chessEngine = new ChessEngine_1.ChessEngine();
    chessEngine.createGame(game.board);
    (0, vitest_1.expect)(chessEngine.getMoves(Types_1.Square.h8)[Types_1.MoveType.Normal].sort()).toEqual(game.expectation.sort());
    console.log("Passed");
    console.log("--------------------------------------------------");
});
