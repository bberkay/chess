/**
 * Test file for every en passant move every situation like possible,
 * missed, forbidden, etc.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { MoveType, Square, StartPosition } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Every En Passant Test Games
 */
const enPassantTestGames: TestGame[] = [
    {
        title: "Possible En Passant Left Test",
        board: StartPosition.EnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        expectation: {from: Square.e5, to: [Square.d6]} // from: En Passant Pawn, to: En Passant Move
    },
    {
        title: "Possible En Passant Right Test",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5}
        ],
        expectation: {from: Square.d5, to: [Square.e6]}
    },
    {
        title: "Enemy Pawn Moved 2 Square Directly From Start Position but after en passant pawn",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.e7, to: Square.e5},
            {from: Square.d4, to: Square.d5},
            {from: Square.a7, to: Square.a6}
        ],
        expectation: {from: Square.d5, to: []}
    },
    {
        title: "En passant move but reaching fifth rank by capturing piece also an edge case",
        board: StartPosition.Standard,
        moves: [
            {from: Square.g2, to: Square.g4},
            {from: Square.h7, to: Square.h5},
            {from: Square.g4, to: Square.h5},
            {from: Square.g7, to: Square.g5}
        ],
        expectation: {from: Square.h5, to: [Square.g6]}
    },
    {
        title: "Missed En Passant Left Because of One Turn Limit",
        board: StartPosition.EnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
            {from: Square.h2, to: Square.h3},
            {from: Square.a6, to: Square.a5},
        ],
        expectation: {from: Square.e5, to: []}
    },
    {
        title: "Missed En Passant Right Because Of One Turn Limit",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5},
            {from: Square.h2, to: Square.h3},
            {from: Square.a6, to: Square.a5},
        ],
        expectation: {from: Square.d5, to: []}
    },
    {
        title: "Forbidden Left En Passant Move Because enemy pawn is not play 2 square directly from start position",
        board: StartPosition.EnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.d7, to: Square.d6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d6, to: Square.d5},
        ],
        expectation: {from: Square.e5, to: []}
    },
    {
        title: "Forbidden Right En Passant Move Because enemy pawn is not play 2 square directly from start position",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.e7, to: Square.e6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e6, to: Square.e5},
        ],
        expectation: {from: Square.d5, to: []}
    },
    {
        title: "Forbidden Left En Passant Moves Because Of King Protection",
        board: StartPosition.ForbiddenEnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        expectation: {from: Square.e5, to: []}
    },
    {
        title: "Forbidden Right En Passant Moves Because Of King Protection",
        board: StartPosition.ForbiddenEnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5}
        ],
        expectation: {from: Square.d5, to: []}
    },
    {
        title: "En Passant With Fen Notation Informed",
        board: "rnbqkb1r/ppp1pppp/5n2/2Pp4/8/8/PP1PPPPP/RNBQKBNR w KQkq d6 0 3",
        moves: [],
        expectation: {from: Square.c5, to: [Square.d6]}
    },
    {
        title: "Fen Notation Update When En Passant Possible",
        board: StartPosition.EnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        expectation: "8/2p5/k7/3pP3/8/8/5P1K/8 w - d6 0 3"
    }
];

describe('En Passant Moves', () => {
    for(const game of enPassantTestGames)
    {
        test(game.title, () => {
            const engine = new ChessEngine();
            engine.createGame(game.board);
            console.log("Initial Board:  " + engine.getGameAsFenNotation());

            for(const move of game.moves!) {
                engine.playMove(move.from, move.to);
            }

            console.log("Final Notation: " + engine.getAlgebraicNotation());
            console.log("Final Board:    " + engine.getGameAsFenNotation());

            /**
             * Check the en passant move is equal to the expectation.
             * "from: Square" means tested pawn's square.
             * "to: []" means there is no en passant move.
             * "to: [Square]" means there is en passant move.
             */
            if(typeof game.expectation === "string")
                expect(engine.getGameAsFenNotation()).toEqual(game.expectation);
            else
                expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]).toEqual(game.expectation.to);
        });
    }
});
