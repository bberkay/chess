"use strict";
/**
 * Test for pawn promotion.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
/**
 * Random game with that contains promotion move
 * for one white pawn.
 */
var promotionTestGames = [
    {
        title: "Promote Pawn To Queen on e8",
        board: Types_1.StartPosition.Promotion,
        moves: [
            { from: Types_1.Square.e6, to: Types_1.Square.e7 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e8 },
            { from: Types_1.Square.e8, to: Types_1.Square.e8 } // Promote to queen (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4Q3/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Rook on e8 By Capture Black Rook",
        board: Types_1.StartPosition.PromotionByCapture,
        moves: [
            { from: Types_1.Square.e6, to: Types_1.Square.e7 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
            { from: Types_1.Square.e7, to: Types_1.Square.d8 },
            { from: Types_1.Square.d8, to: Types_1.Square.d7 } // Promote to rook (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "3R4/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Bishop on e8",
        board: Types_1.StartPosition.Promotion,
        moves: [
            { from: Types_1.Square.e6, to: Types_1.Square.e7 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
            { from: Types_1.Square.e7, to: Types_1.Square.e8 },
            { from: Types_1.Square.e8, to: Types_1.Square.e6 } // Promote to bishop (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "4B3/8/8/k7/8/8/8/4K3 b - - 0 2",
    },
    {
        title: "Promote Pawn To Knight on e8 By Capture Black Rook",
        board: Types_1.StartPosition.PromotionByCapture,
        moves: [
            { from: Types_1.Square.e6, to: Types_1.Square.e7 },
            { from: Types_1.Square.a6, to: Types_1.Square.a5 },
            { from: Types_1.Square.e7, to: Types_1.Square.d8 },
            { from: Types_1.Square.d8, to: Types_1.Square.d5 } // Promote to knight (check _doPromote() in src/Engine/ChessEngine.ts)
        ],
        expectation: "3N4/8/8/k7/8/8/8/4K3 b - - 0 2",
    }
];
// Test for promotion move.
(0, vitest_1.test)('Promote pawn to the every promotion option', function () {
    var engine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, promotionTestGames_1 = promotionTestGames; _i < promotionTestGames_1.length; _i++) {
        var game = promotionTestGames_1[_i];
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);
        // Play moves
        for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
            var move = _b[_a];
            engine.playMove(move.from, move.to);
        }
        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());
        // Check the pawn is promoted to the current type of promotion.
        (0, vitest_1.expect)(engine.getGameAsFenNotation()).toEqual(game.expectation);
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
