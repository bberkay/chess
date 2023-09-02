"use strict";
var _a, _b, _c, _d, _e;
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
// Games
var games = [
    '3k4/3q4/8/8/8/8/3R4/3K4 w - - 0 1',
    '3k4/3q4/8/8/8/8/3R4/3K4 b - - 0 1',
    '8/8/7k/6b1/8/8/3N4/2K5 w - - 0 1',
    '3k4/3p4/4P3/8/8/8/8/3RK3 b - - 0 1',
    '3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1' // Forbidden En passant
];
// Pieces and expected moves for every game.
var piecesAndMoves = [
    (_a = {},
        _a[Types_1.Square.d2] = [Types_1.Square.d3, Types_1.Square.d4, Types_1.Square.d5, Types_1.Square.d6, Types_1.Square.d7],
        _a),
    (_b = {},
        _b[Types_1.Square.d7] = [Types_1.Square.d6, Types_1.Square.d5, Types_1.Square.d4, Types_1.Square.d3, Types_1.Square.d2],
        _b),
    (_c = {},
        _c[Types_1.Square.d2] = [] // Expected moves for the white knight
    ,
        _c),
    (_d = {},
        _d[Types_1.Square.d7] = [Types_1.Square.d6, Types_1.Square.d5] // Expected moves for the white pawn
    ,
        _d),
    (_e = {},
        _e[Types_1.Square.d4] = [Types_1.Square.d3] // Expected moves for the black pawn
    ,
        _e)
];
// Tests
(0, vitest_1.test)('King Protection', function () {
    for (var i = 0; i < games.length; i++) {
        var chessEngine = new ChessEngine_1.ChessEngine();
        chessEngine.createGame(games[i]);
        // Test every piece and its moves
        for (var _i = 0, _a = Object.entries(piecesAndMoves[i]); _i < _a.length; _i++) {
            var _b = _a[_i], piece = _b[0], moves = _b[1];
            (0, vitest_1.expect)(chessEngine.getMoves(Number(piece))[Types_1.MoveType.Normal].sort()).toEqual(moves.sort());
        }
    }
});
