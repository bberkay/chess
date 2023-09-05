"use strict";
/**
 * Test file for every castling move.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Types_1 = require("../src/Types");
var ChessEngine_1 = require("../src/Engine/ChessEngine");
var BoardQueryer_1 = require("../src/Engine/Core/Board/BoardQueryer");
/**
 * All Castling Tests For every situation.
 */
var castlingTestGames = [
    {
        title: 'King Side Castling',
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.h1 }
        ],
        expectation: "r3k2r/8/8/4b3/4B3/8/8/R4RK1 b Qkq - 2 1",
    },
    {
        title: 'Queen Side Castling',
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.a1 }
        ],
        expectation: "r3k2r/8/8/4b3/4B3/8/8/2KR3R b Kkq - 2 1",
    },
    {
        title: "Long Castling Forbidden Because of Enemy Bishop",
        board: Types_1.StartPosition.LongCastlingCheck,
        expectation: [Types_1.Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of Enemy Bishop",
        board: Types_1.StartPosition.ShortCastlingCheck,
        expectation: [Types_1.Square.a1]
    },
    {
        title: "Both Castling Forbidden Because of Enemy Bishop",
        board: Types_1.StartPosition.BothCastlingCheck,
        expectation: []
    },
    {
        title: "Both Castling Forbidden Because King is in Check",
        board: Types_1.StartPosition.CheckCastling,
        expectation: []
    },
    {
        title: "Long Castling Forbidden Because of Queen Side Rook has Moved/Not on the true position",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.a1, to: Types_1.Square.a2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 }, // Unimportant black move to set the turn to white
        ],
        expectation: [Types_1.Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of King Side Rook has Moved/Not on the true position",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.h1, to: Types_1.Square.h2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 },
        ],
        expectation: [Types_1.Square.a1]
    },
    {
        title: "Long Castling Forbidden Because of Queen Side Rook has Moved previously but now on the true position",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.a1, to: Types_1.Square.a2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 },
            { from: Types_1.Square.a2, to: Types_1.Square.a1 },
            { from: Types_1.Square.e7, to: Types_1.Square.e8 } // Unimportant black move to set the turn to white
        ],
        expectation: [Types_1.Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of King Side Rook has Moved previously but now on the true position",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.h1, to: Types_1.Square.h2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 },
            { from: Types_1.Square.h2, to: Types_1.Square.h1 },
            { from: Types_1.Square.e7, to: Types_1.Square.e8 }
        ],
        expectation: [Types_1.Square.a1]
    },
    {
        title: "Both Castling Forbidden Because of King has Moved previously",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.e2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 },
        ],
        expectation: []
    },
    {
        title: "Both Castling Forbidden Because of King has Moved previously but now on the true position",
        board: Types_1.StartPosition.Castling,
        moves: [
            { from: Types_1.Square.e1, to: Types_1.Square.e2 },
            { from: Types_1.Square.e8, to: Types_1.Square.e7 },
            { from: Types_1.Square.e2, to: Types_1.Square.e1 },
            { from: Types_1.Square.e7, to: Types_1.Square.e8 }
        ],
        expectation: []
    }
];
// Test for every castling move.
(0, vitest_1.test)('Castling Moves', function () {
    var engine = new ChessEngine_1.ChessEngine();
    for (var _i = 0, castlingTestGames_1 = castlingTestGames; _i < castlingTestGames_1.length; _i++) {
        var game = castlingTestGames_1[_i];
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);
        // Play the moves if there is any
        if (game.moves) {
            for (var _a = 0, _b = game.moves; _a < _b.length; _a++) {
                var move = _b[_a];
                engine.playMove(move.from, move.to);
            }
        }
        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());
        /**
         * If the expectation is string, then we will check the board is
         * equal to the expectation. If the expectation is array, then we
         * will check the castling moves of the king are equal to the expectation.
         */
        if (typeof game.expectation == "string")
            (0, vitest_1.expect)(engine.getGameAsFenNotation()).toEqual(game.expectation);
        else {
            // Get the square of white king
            var squareOfKing = BoardQueryer_1.BoardQueryer.getSquareOfPiece(BoardQueryer_1.BoardQueryer.getPiecesWithFilter(Types_1.Color.White, [Types_1.PieceType.King])[0]);
            // Check the castling moves of the king are equal to the expectation.
            (0, vitest_1.expect)(engine.getMoves(squareOfKing)[Types_1.MoveType.Castling]).toEqual(game.expectation);
        }
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});
