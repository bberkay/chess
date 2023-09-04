"use strict";
/**
 * Test for standard moves by using some pieces on board.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Random game with expected moves for some piece.
 */
var game = {
    title: "Standard Moves",
    board: 'rnbqkbnr/pppppppp/8/6B1/3P2B1/2NQ3P/PPP1PPP1/R3K1NR w KQkq - 0 1',
    expectation: [
        {
            // Expected moves for the white rook on a1
            "piece": Types_1.Square.a1,
            "expectedMoves": [Types_1.Square.b1, Types_1.Square.c1, Types_1.Square.d1]
        },
        {
            // Expected moves for the white pawn on c2
            "piece": Types_1.Square.c2,
            "expectedMoves": []
        },
        {
            // Expected moves for the white knight on c3
            "piece": Types_1.Square.c3,
            "expectedMoves": [Types_1.Square.a4, Types_1.Square.b5, Types_1.Square.d5, Types_1.Square.e4, Types_1.Square.b1, Types_1.Square.d1]
        },
        {
            // Expected moves for the white queen on d3
            "piece": Types_1.Square.d3,
            "expectedMoves": [Types_1.Square.h7, Types_1.Square.a6, Types_1.Square.b5, Types_1.Square.c4, Types_1.Square.d2, Types_1.Square.d1, Types_1.Square.e3, Types_1.Square.f3, Types_1.Square.g3, Types_1.Square.e4, Types_1.Square.f5, Types_1.Square.g6]
        },
        {
            // Expected moves for the white pawn on d4
            "piece": Types_1.Square.d4,
            "expectedMoves": [Types_1.Square.d5]
        },
        {
            // Expected moves for the white pawn on e2
            "piece": Types_1.Square.e2,
            "expectedMoves": [Types_1.Square.e3, Types_1.Square.e4]
        },
        {
            // Expected moves for the white king on g1
            "piece": Types_1.Square.g1,
            "expectedMoves": [Types_1.Square.f3]
        },
        {
            // Expected moves for the white rook on h1
            "piece": Types_1.Square.h1,
            "expectedMoves": [Types_1.Square.h2]
        },
        {
            // Expected moves for the white bishop on g4
            "piece": Types_1.Square.g4,
            "expectedMoves": [Types_1.Square.f5, Types_1.Square.e6, Types_1.Square.f3, Types_1.Square.d7, Types_1.Square.h5]
        },
        {
            // Expected moves for the white bishop on g5
            "piece": Types_1.Square.g5,
            "expectedMoves": [Types_1.Square.h4, Types_1.Square.h6, Types_1.Square.f6, Types_1.Square.e7, Types_1.Square.f4, Types_1.Square.e3, Types_1.Square.d2, Types_1.Square.c1]
        }
    ]
};
// Tests
(0, vitest_1.test)('Standard Moves', function () {
    var chessEngine = new ChessEngine_1.ChessEngine();
    console.log("Testing: " + game.title);
    chessEngine.createGame(game.board);
    // Test every piece and its moves
    for (var _i = 0, _a = game.expectation; _i < _a.length; _i++) {
        var expectation = _a[_i];
        (0, vitest_1.expect)(chessEngine.getMoves(Number(expectation.piece))[Types_1.MoveType.Normal].sort()).toEqual(expectation.expectedMoves.sort());
    }
    console.log("Board: " + chessEngine.getGameAsFenNotation());
    console.log("Passed: " + game.title);
    console.log("--------------------------------------------------");
});
