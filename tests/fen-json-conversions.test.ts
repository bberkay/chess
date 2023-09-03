/**
 * Test file for FEN to JSON and JSON to FEN conversions.
 */

import { expect, test } from 'vitest';
import { Converter } from '../src/Utils/Converter';
import { Color, JsonNotation, PieceType, Square, StartPosition } from '../src/Types';

// FEN Notations
const fenNotations: Array<string> = [
    StartPosition.Standard,
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR', // Just board field
    StartPosition.Empty,
    'r3k2r/8/8/1Pp5/8/8/8/R3K2R w Kq c6 0 2', // Every field
];

// JSON Notations
const jsonNotations: JsonNotation[] = [
    {
        board: [
            {color: Color.Black, type: PieceType.Rook, square: Square.a8},
            {color: Color.Black, type: PieceType.Knight, square: Square.b8},
            {color: Color.Black, type: PieceType.Bishop, square: Square.c8},
            {color: Color.Black, type: PieceType.Queen, square: Square.d8},
            {color: Color.Black, type: PieceType.King, square: Square.e8},
            {color: Color.Black, type: PieceType.Bishop, square: Square.f8},
            {color: Color.Black, type: PieceType.Knight, square: Square.g8},
            {color: Color.Black, type: PieceType.Rook, square: Square.h8},
            {color: Color.Black, type: PieceType.Pawn, square: Square.a7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.b7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.c7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.d7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.e7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.f7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.g7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.h7},
            {color: Color.White, type: PieceType.Pawn, square: Square.a2},
            {color: Color.White, type: PieceType.Pawn, square: Square.b2},
            {color: Color.White, type: PieceType.Pawn, square: Square.c2},
            {color: Color.White, type: PieceType.Pawn, square: Square.d2},
            {color: Color.White, type: PieceType.Pawn, square: Square.e2},
            {color: Color.White, type: PieceType.Pawn, square: Square.f2},
            {color: Color.White, type: PieceType.Pawn, square: Square.g2},
            {color: Color.White, type: PieceType.Pawn, square: Square.h2},
            {color: Color.White, type: PieceType.Rook, square: Square.a1},
            {color: Color.White, type: PieceType.Knight, square: Square.b1},
            {color: Color.White, type: PieceType.Bishop, square: Square.c1},
            {color: Color.White, type: PieceType.Queen, square: Square.d1},
            {color: Color.White, type: PieceType.King, square: Square.e1},
            {color: Color.White, type: PieceType.Bishop, square: Square.f1},
            {color: Color.White, type: PieceType.Knight, square: Square.g1},
            {color: Color.White, type: PieceType.Rook, square: Square.h1}
        ],
        turn: Color.White,
        castling: {
            WhiteLong: true,
            WhiteShort: true,
            BlackLong: true,
            BlackShort: true
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    }, // Standard
    {
        board: [
            {color: Color.Black, type: PieceType.Rook, square: Square.a8},
            {color: Color.Black, type: PieceType.Knight, square: Square.b8},
            {color: Color.Black, type: PieceType.Bishop, square: Square.c8},
            {color: Color.Black, type: PieceType.Queen, square: Square.d8},
            {color: Color.Black, type: PieceType.King, square: Square.e8},
            {color: Color.Black, type: PieceType.Bishop, square: Square.f8},
            {color: Color.Black, type: PieceType.Knight, square: Square.g8},
            {color: Color.Black, type: PieceType.Rook, square: Square.h8},
            {color: Color.Black, type: PieceType.Pawn, square: Square.a7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.b7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.c7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.d7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.e7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.f7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.g7},
            {color: Color.Black, type: PieceType.Pawn, square: Square.h7},
            {color: Color.White, type: PieceType.Pawn, square: Square.a2},
            {color: Color.White, type: PieceType.Pawn, square: Square.b2},
            {color: Color.White, type: PieceType.Pawn, square: Square.c2},
            {color: Color.White, type: PieceType.Pawn, square: Square.d2},
            {color: Color.White, type: PieceType.Pawn, square: Square.e2},
            {color: Color.White, type: PieceType.Pawn, square: Square.f2},
            {color: Color.White, type: PieceType.Pawn, square: Square.g2},
            {color: Color.White, type: PieceType.Pawn, square: Square.h2},
            {color: Color.White, type: PieceType.Rook, square: Square.a1},
            {color: Color.White, type: PieceType.Knight, square: Square.b1},
            {color: Color.White, type: PieceType.Bishop, square: Square.c1},
            {color: Color.White, type: PieceType.Queen, square: Square.d1},
            {color: Color.White, type: PieceType.King, square: Square.e1},
            {color: Color.White, type: PieceType.Bishop, square: Square.f1},
            {color: Color.White, type: PieceType.Knight, square: Square.g1},
            {color: Color.White, type: PieceType.Rook, square: Square.h1}
        ],
        turn: Color.White,
        castling: {
            WhiteLong: false,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: false
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    }, // Standard, just board
    {
        board: [],
        turn: Color.White,
        castling: {
            WhiteLong: false,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: false
        },
        enPassant: null,
        halfMoveClock: 0,
        fullMoveNumber: 1
    }, // Empty board
    {
        board: [
            {color: Color.Black, type: PieceType.Rook, square: Square.a8},
            {color: Color.Black, type: PieceType.King, square: Square.e8},
            {color: Color.Black, type: PieceType.Rook, square: Square.h8},
            {color: Color.White, type: PieceType.Pawn, square: Square.b5},
            {color: Color.Black, type: PieceType.Pawn, square: Square.c5},
            {color: Color.White, type: PieceType.Rook, square: Square.a1},
            {color: Color.White, type: PieceType.King, square: Square.e1},
            {color: Color.White, type: PieceType.Rook, square: Square.h1},
        ],
        turn: Color.White,
        castling: {
            WhiteLong: true,
            WhiteShort: false,
            BlackLong: false,
            BlackShort: true
        },
        enPassant: Square.c6,
        halfMoveClock: 0,
        fullMoveNumber: 2
    } // With castling and en passant
];

// Convert FEN to JSON
test('Convert FEN to JSON', () => {
    for(let i = 0; i < fenNotations.length; i++){
        expect(Converter.fenToJson(fenNotations[i])).toEqual(jsonNotations[i]);
    }
});

// Convert JSON to FEN
test('Convert JSON to FEN', () => {
    for(let i = 0; i < jsonNotations.length; i++){
        expect(Converter.jsonToFen(jsonNotations[i])).toEqual(fenNotations[i]);
    }
});