"use strict";
/**
 * Test for pawn promotion.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
var BoardQueryer_1 = require("../src/Engine/Core/Board/BoardQueryer");
/**
 * Random game with that contains promotion move
 * for one white pawn.
 */
var game = {
    title: "Pawn Promotion",
    board: Types_1.StartPosition.Promotion,
    moves: [
        { from: Types_1.Square.e6, to: Types_1.Square.e7 },
        { from: Types_1.Square.a6, to: Types_1.Square.a5 }
    ],
    expectation: {
        "promotionMove": {
            "from": Types_1.Square.e7,
            "to": Types_1.Square.e8 // Expected move of pawn on e7 as promotion move.
        },
        "promoteOptions": [Types_1.Square.e8, Types_1.PieceType.Rook, Types_1.Square.e6, Types_1.PieceType.Knight]
    }
};
/**
 * Promote with square.
 * @see for more information, check _doPromote() in src/Engine/ChessEngine.ts
 */
var promoteScheme = (_a = {},
    _a[Types_1.Square.e8] = Types_1.PieceType.Queen,
    _a[Types_1.Square.e7] = Types_1.PieceType.Rook,
    _a[Types_1.Square.e6] = Types_1.PieceType.Bishop,
    _a[Types_1.Square.e5] = Types_1.PieceType.Knight,
    _a);
// Test for promotion move.
(0, vitest_1.test)('Promote pawn to the every promotion option', function () {
    var chessEngine = new ChessEngine_1.ChessEngine();
    console.log("Testing: " + game.title);
    // Promote pawn to the every promotion option.
    for (var _i = 0, _a = game.expectation.promoteOptions; _i < _a.length; _i++) {
        var promotionOption = _a[_i];
        chessEngine.createGame(game.board);
        // Go to the 7th row.
        for (var _b = 0, _c = game.moves; _b < _c.length; _b++) {
            var move = _c[_b];
            chessEngine.playMove(move.from, move.to);
        }
        /**
         * Get the pawn before promotion move and expected promotion move.
         * For example, before promotion move, pawn is on e7 and promotion
         * move must be e8.
         */
        var promoteFrom = game.expectation.promotionMove.from; // current square of pawn: e7
        var promoteTo = game.expectation.promotionMove.to; // expected promotion square: e8
        /**
         * Check if the promotion move is available(pawn on e7 and
         * expected promotion move is e8).
         */
        (0, vitest_1.expect)(chessEngine.getMoves(promoteFrom)[Types_1.MoveType.Promotion][0])
            .toEqual(promoteTo);
        // Go to the promotion move(e8).
        chessEngine.playMove(promoteFrom, promoteTo);
        // Promote pawn on e8 to the current type of promote.
        chessEngine.playMove(promoteTo, promotionOption);
        // Check if the piece is promoted to expected type of promote.
        var promotedPawn = BoardQueryer_1.BoardQueryer.getPieceOnSquare(promoteTo);
        (0, vitest_1.expect)({
            color: promotedPawn.getColor(),
            type: promotedPawn.getType() // Current type of promoted pawn.
        }).toEqual({
            color: Types_1.Color.White,
            type: typeof promotionOption == "number" ? promoteScheme[promotionOption] : promotionOption // Expected type of promoted pawn.
        });
    }
    console.log("Board: " + chessEngine.getGameAsFenNotation());
    console.log("Passed: " + game.title);
    console.log("--------------------------------------------------");
});
