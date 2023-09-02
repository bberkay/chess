"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
// King Forbidden Moves
var kingForbiddenMovesGame = Types_1.StartPosition.KingForbiddenMove;
// Expected moves for the white king on h8.
var kingExpectedMove = {
    "king": Types_1.Square.h8,
    "expectedMoves": [Types_1.Square.g8]
};
// Test king and its moves.
(0, vitest_1.test)('King Forbidden Moves', function () {
    var chessEngine = new ChessEngine_1.ChessEngine();
    chessEngine.createGame(kingForbiddenMovesGame);
    // This test also includes capturing the forbidden piece.
    (0, vitest_1.expect)(chessEngine.getMoves(kingExpectedMove.king)[Types_1.MoveType.Normal].sort()).toEqual(kingExpectedMove.expectedMoves.sort());
});
