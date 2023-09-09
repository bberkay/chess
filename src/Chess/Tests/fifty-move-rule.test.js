"use strict";
/**
 * Fifty-move rule test
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
var Types_1 = require("../src/Types");
var BoardQueryer_1 = require("../src/Engine/Core/Board/BoardQueryer");
/**
 * Test the fifty-move rule (50 moves without a capture
 * or a pawn move is a draw)
 */
var fiftyMoveRuleTestGames = [
    {
        title: "Fifty-move rule is reset by capture/pawn move",
        board: '3k4/1r6/8/5n2/8/6N1/1P6/4K3 w - - 0 1',
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.e2 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e2, to: Types_1.Square.e1 },
            { from: Types_1.Square.b7, to: Types_1.Square.b2 }, // Rook capture pawn on b2, half move count is reset.
        ],
        expectation: 0 // Expected half move clock.
    },
    {
        title: 'Fifty-move rule in progress',
        board: '3k4/1r6/8/5n2/8/6N1/1P6/4K3 w - - 0 1',
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.e2 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e2, to: Types_1.Square.e1 },
        ],
        expectation: 3 // Expected half move clock.
    },
    {
        title: 'Fifty-move rule completed',
        board: '3k4/1r6/8/5n2/8/6N1/1P6/4K3 w - - 0 1',
        moves: [
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.g3, to: Types_1.Square.e4 },
            { from: Types_1.Square.f5, to: Types_1.Square.g7 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 },
            { from: Types_1.Square.e4, to: Types_1.Square.g3 },
            { from: Types_1.Square.g7, to: Types_1.Square.f5 }, // 50 moves without a capture or pawn move.
        ],
        expectation: Types_1.GameStatus.Draw
    }
];
// Convert FEN to JSON
(0, vitest_1.test)('Fifty Move Rule Test', function () {
    var engine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, fiftyMoveRuleTestGames_1 = fiftyMoveRuleTestGames; _i < fiftyMoveRuleTestGames_1.length; _i++) {
        var game = fiftyMoveRuleTestGames_1[_i];
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
        /**
         * Check if the expectation is a number, if it is, then
         * check if the half move count is equal to the expectation.
         * If it is not, then check if the game status is equal to the expectation.
         */
        if (typeof game.expectation === "number")
            (0, vitest_1.expect)(BoardQueryer_1.BoardQueryer.getHalfMoveCount()).toBe(game.expectation);
        else
            (0, vitest_1.expect)(engine.getStatusOfGame()).toBe(game.expectation);
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
