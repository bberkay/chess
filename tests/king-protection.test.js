"use strict";
/**
 * Test for the king's protection (for example, rook must not move any
 * square that puts the king in danger).
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Board with expected moves for protectors of the king.
 */
var games = [
    {
        title: "King Protection with Rook from Enemy Queen",
        board: Types_1.StartPosition.ProtectKing,
        expectation: {
            from: Types_1.Square.d2,
            to: [Types_1.Square.d3, Types_1.Square.d4, Types_1.Square.d5, Types_1.Square.d6, Types_1.Square.d7] // Expected moves for the white rook
        }
    },
    {
        title: "King Protection with Knight from Enemy Bishop",
        board: '8/8/7k/6b1/8/8/3N4/2K5 w - - 0 1',
        expectation: {
            from: Types_1.Square.d2,
            to: [] // Expected moves for the white knight
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook",
        board: '3k4/3p4/4P3/8/8/8/8/3RK3 b - - 0 1',
        expectation: {
            from: Types_1.Square.d7,
            to: [Types_1.Square.d6, Types_1.Square.d5] // Expected moves for the black pawn
        }
    },
    {
        title: "King Protection with Pawn from Enemy Rook (Forbidden En Passant)",
        board: '3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1',
        expectation: {
            from: Types_1.Square.d4,
            to: [Types_1.Square.d3] // Expected moves for the black pawn
        }
    }
];
(0, vitest_1.test)('King Protection Test', function () {
    var chessEngine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, games_1 = games; _i < games_1.length; _i++) {
        var game = games_1[_i];
        console.log("Testing: " + game.title);
        console.log("Board: " + game.board);
        chessEngine.createGame(game.board);
        // Test every piece and its moves
        (0, vitest_1.expect)(chessEngine.getMoves(Number(game.expectation.from))[Types_1.MoveType.Normal].sort())
            .toEqual(game.expectation.to.sort());
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
