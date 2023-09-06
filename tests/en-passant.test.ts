/**
 * Test file for every en passant move every situation like possible,
 * missed, forbidden, etc.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { MoveType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

/**
 * Every En Passant Test Games
 */
const enPassantTestGames: Test[] = [
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
        title: "Missed En Passant Left Because Of One Turn Limit",
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
    }
];

test('En Passant Moves', () => {
    const engine = new ChessEngine();
    for(const game of enPassantTestGames)
    {
        console.log("Testing:        " + game.title);
        console.log("Initial Board:  " + game.board);
        engine.createGame(game.board);

        for(const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        /**
         * Check the en passant move is equal to the expectation.
         * "from: Square" means tested pawn's square.
         * "to: []" means there is no en passant move.
         * "to: [Square]" means there is en passant move.
         */
        expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]).toEqual(game.expectation.to);

        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});