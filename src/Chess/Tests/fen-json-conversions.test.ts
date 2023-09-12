/**
 * Test file for FEN to JSON and JSON to FEN conversions.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { Converter } from '../Utils/Converter';
import { Color, PieceType, Square, StartPosition } from '../Types';

/**
 * FEN Notation tests with expected JSON notation.
 */
const fenToJsonTest: Test[] = [
    {
        title: "Standard Position",
        board: StartPosition.Standard,
        expectation:  {
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
        }
    },
    {
        title: "Empty Board",
        board: StartPosition.Empty,
        expectation: {
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
        },
    },
    {
        title: "With Castling and En Passant",
        board: "r3k2r/8/8/1Pp5/8/8/8/R3K2R w Kq c6 0 2",
        expectation: {
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
                WhiteLong: false,
                WhiteShort: true,
                BlackLong: true,
                BlackShort: false
            },
            enPassant: Square.c6,
            halfMoveClock: 0,
            fullMoveNumber: 2
        }
    }
]

// Convert FEN to JSON
test('Convert FEN to JSON', () => {
    fenToJsonTest.forEach(({title, board, expectation}) => {
        console.log(`Testing: ${title}`);
        expect(Converter.fenToJson(board as string)).toEqual(expectation);
        console.log(`Passed`);
        console.log("--------------------------------------------------");
    });
});

/**
 * JSON Notation tests with expected FEN notation.
 */

// NOTE: We don't need to create tests again because we can just use the same tests as above and reverse the parameters.
// Convert JSON to FEN
test('Convert JSON to FEN', () => {
    fenToJsonTest.forEach(({title, board, expectation}) => {
        console.log(`Testing: ${title}`);
        expect(Converter.jsonToFen(expectation)).toEqual(board);
        console.log(`Passed`);
        console.log("--------------------------------------------------");
    });
});