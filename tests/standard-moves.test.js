"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
// Random Game
var game = 'rnbqkbnr/pppppppp/8/6B1/3P2B1/2NQ3P/PPP1PPP1/R3K1NR w KQkq - 0 1';
// Pieces and expected moves for every game.
var piecesAndMoves = (_a = {},
    _a[Types_1.Square.a1] = [Types_1.Square.b1, Types_1.Square.c1, Types_1.Square.d1],
    _a[Types_1.Square.c2] = [],
    _a[Types_1.Square.c3] = [Types_1.Square.a4, Types_1.Square.b5, Types_1.Square.d5, Types_1.Square.e4, Types_1.Square.b1, Types_1.Square.d1],
    _a[Types_1.Square.d3] = [Types_1.Square.h7, Types_1.Square.a6, Types_1.Square.b5, Types_1.Square.c4, Types_1.Square.d2, Types_1.Square.d1, Types_1.Square.e3, Types_1.Square.f3, Types_1.Square.g3, Types_1.Square.e4, Types_1.Square.f5, Types_1.Square.g6],
    _a[Types_1.Square.d4] = [Types_1.Square.d5],
    _a[Types_1.Square.e2] = [Types_1.Square.e3, Types_1.Square.e4],
    _a[Types_1.Square.g1] = [Types_1.Square.f3],
    _a[Types_1.Square.h1] = [Types_1.Square.h2],
    _a[Types_1.Square.g4] = [Types_1.Square.f5, Types_1.Square.e6, Types_1.Square.f3, Types_1.Square.d7, Types_1.Square.h5],
    _a[Types_1.Square.g5] = [Types_1.Square.h4, Types_1.Square.h6, Types_1.Square.f6, Types_1.Square.e7, Types_1.Square.f4, Types_1.Square.e3, Types_1.Square.d2, Types_1.Square.c1] // Expected moves for the white bishop on g5
,
    _a);
// Tests
(0, vitest_1.test)('Standard Moves', function () {
    var chessEngine = new ChessEngine_1.ChessEngine();
    chessEngine.createGame(game);
    // Test every piece and its moves
    for (var _i = 0, _a = Object.entries(piecesAndMoves); _i < _a.length; _i++) {
        var _b = _a[_i], piece = _b[0], moves = _b[1];
        (0, vitest_1.expect)(chessEngine.getMoves(Number(piece))[Types_1.MoveType.Normal].sort()).toEqual(moves.sort());
    }
});
