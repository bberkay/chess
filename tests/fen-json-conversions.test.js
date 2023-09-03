"use strict";
/**
 * Test file for FEN to JSON and JSON to FEN conversions.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var vitest_1 = require("vitest");
var Converter_1 = require("../src/Utils/Converter");
var Types_1 = require("../src/Types");
// FEN Notations
var fenNotations = [
    Types_1.StartPosition.Standard,
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
    Types_1.StartPosition.Empty,
    'r3k2r/8/8/1Pp5/8/8/8/R3K2R w Kq c6 0 2', // Every field
];
// JSON Notations
var jsonNotations = [
    {
        board: [
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.a8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Knight, square: Types_1.Square.b8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Bishop, square: Types_1.Square.c8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Queen, square: Types_1.Square.d8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.King, square: Types_1.Square.e8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Bishop, square: Types_1.Square.f8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Knight, square: Types_1.Square.g8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.h8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.a7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.b7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.c7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.d7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.e7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.f7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.g7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.h7 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.a2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.b2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.c2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.d2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.e2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.f2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.g2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.h2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.a1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Knight, square: Types_1.Square.b1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Bishop, square: Types_1.Square.c1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Queen, square: Types_1.Square.d1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.King, square: Types_1.Square.e1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Bishop, square: Types_1.Square.f1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Knight, square: Types_1.Square.g1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.h1 }
        ],
        turn: Types_1.Color.White,
        castling: {
            WhiteLong: true,
            WhiteShort: true,
            BlackLong: true,
            BlackShort: true
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    },
    {
        board: [
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.a8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Knight, square: Types_1.Square.b8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Bishop, square: Types_1.Square.c8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Queen, square: Types_1.Square.d8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.King, square: Types_1.Square.e8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Bishop, square: Types_1.Square.f8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Knight, square: Types_1.Square.g8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.h8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.a7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.b7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.c7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.d7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.e7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.f7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.g7 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.h7 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.a2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.b2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.c2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.d2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.e2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.f2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.g2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.h2 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.a1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Knight, square: Types_1.Square.b1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Bishop, square: Types_1.Square.c1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Queen, square: Types_1.Square.d1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.King, square: Types_1.Square.e1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Bishop, square: Types_1.Square.f1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Knight, square: Types_1.Square.g1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.h1 }
        ],
        turn: Types_1.Color.White,
        castling: {
            WhiteLong: false,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: false
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    },
    {
        board: [],
        turn: Types_1.Color.White,
        castling: {
            WhiteLong: false,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: false
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    },
    {
        board: [
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.a8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.King, square: Types_1.Square.e8 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Rook, square: Types_1.Square.h8 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Pawn, square: Types_1.Square.b5 },
            { color: Types_1.Color.Black, type: Types_1.PieceType.Pawn, square: Types_1.Square.c5 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.a1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.King, square: Types_1.Square.e1 },
            { color: Types_1.Color.White, type: Types_1.PieceType.Rook, square: Types_1.Square.h1 },
        ],
        turn: Types_1.Color.White,
        castling: {
            WhiteLong: true,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: true
        },
        enPassant: Types_1.Square.c6,
        halfMoveClock: 0,
        fullMoveNumber: 2
    } // With castling and en passant
];
// Convert FEN to JSON
(0, vitest_1.test)('Convert FEN to JSON', function () {
    for (var i = 0; i < fenNotations.length; i++) {
        (0, vitest_1.expect)(Converter_1.Converter.fenToJson(fenNotations[i])).toEqual(jsonNotations[i]);
    }
});
// Convert JSON to FEN
(0, vitest_1.test)('Convert JSON to FEN', function () {
    for (var i = 0; i < jsonNotations.length; i++) {
        (0, vitest_1.expect)(Converter_1.Converter.jsonToFen(jsonNotations[i])).toEqual(fenNotations[i]);
    }
});
