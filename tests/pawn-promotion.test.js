"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
var BoardQueryer_1 = require("../src/Engine/Core/Board/BoardQueryer");
// Promotion Move Game.
var promotionMoveGame = {
    "board": Types_1.StartPosition.Promotion,
    "moves": [
        { from: Types_1.Square.e6, to: Types_1.Square.e7 },
        { from: Types_1.Square.a6, to: Types_1.Square.a5 }
    ],
    "expectedPromotionMove": { from: Types_1.Square.e7, to: Types_1.Square.e8 }
};
// Promote moves.
var promoteMoves = {
    from: Types_1.Square.e8,
    to: [Types_1.Square.e8, Types_1.Square.e7, Types_1.Square.e6, Types_1.Square.e5] // Promote to every option one by one.
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
    for (var _i = 0, _a = promoteMoves.to; _i < _a.length; _i++) {
        var promoteTo = _a[_i];
        var chessEngine = new ChessEngine_1.ChessEngine();
        chessEngine.createGame(promotionMoveGame.board);
        // Go to the 7th row.
        for (var _b = 0, _c = promotionMoveGame.moves; _b < _c.length; _b++) {
            var move = _c[_b];
            chessEngine.playMove(move.from, move.to);
        }
        // Check if the promotion move is available.
        (0, vitest_1.expect)(chessEngine.getMoves(promotionMoveGame.expectedPromotionMove.from)[Types_1.MoveType.Promotion][0])
            .toEqual(promotionMoveGame.expectedPromotionMove.to);
        // Go to the promotion move/8th row.
        chessEngine.playMove(promotionMoveGame.expectedPromotionMove.from, promotionMoveGame.expectedPromotionMove.to);
        // Promote pawn.
        chessEngine.playMove(promoteMoves.from, promoteTo);
        // Check if the piece is promoted to current type of promote.
        var promotedPawn = BoardQueryer_1.BoardQueryer.getPieceOnSquare(promoteMoves.from);
        (0, vitest_1.expect)({ color: promotedPawn.getColor(), type: promotedPawn.getType() })
            .toEqual({ color: Types_1.Color.White, type: promoteScheme[promoteTo] });
    }
});
