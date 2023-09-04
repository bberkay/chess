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
 * Possible En Passant Moves
 */
const possibleEnPassantTestGames: Test[] = [
    {
        title: "En Passant Left Test",
        board: StartPosition.EnPassantLeft,
        moves: [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        expectation: {from: Square.e5, to: Square.d6}
    },
    {
        title: "En Passant Right Test",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5}
        ],
        expectation: {from: Square.d5, to: Square.e6}
    }
];

test('Possible En Passant Moves', () => {
    for(const game of possibleEnPassantTestGames)
    {
        console.log("Testing: " + game.title);
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]![0]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});

/**
 * Missed En Passant Moves, one turn limit
 * when it was possible
 */
const missedEnPassantTestGames: Test[] = [
    {
        title: "Missed En Passant Left Test",
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
        title: "Missed En Passant Right Test",
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
    }
];

test('Missed En Passant Moves', () => {
    for(const game of missedEnPassantTestGames)
    {
        console.log("Testing: " + game.title);
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});

/**
 * Forbidden En Passant Moves, enemy pawn is not play 2
 * square directly from start position
 */
const forbiddenEnPassantTestGames: Test[] = [
    {
        title: "Forbidden En Passant Left Test",
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
        title: "Forbidden En Passant Right Test",
        board: StartPosition.EnPassantRight,
        moves: [
            {from: Square.d2, to: Square.d4},
            {from: Square.e7, to: Square.e6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e6, to: Square.e5},
        ],
        expectation: {from: Square.d5, to: []}
    }
];

test("Forbidden En Passant Games Because Of Enemy Pawn's Move", () => {
    for(const game of forbiddenEnPassantTestGames)
    {
        console.log("Testing: " + game.title);
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});

/**
 * Forbidden En Passant Moves, king will be
 * in danger when en passant move done
 */
const forbiddenEnPassantGamesForKingProtectionTestGames: Test[] = [
    {
        title: "Forbidden En Passant Left Test",
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
        title: "Forbidden En Passant Right Test",
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

test('Forbidden En Passant Moves Because Of King Protection', () => {
    for(const game of forbiddenEnPassantGamesForKingProtectionTestGames)
    {
        console.log("Testing: " + game.title);
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectation.from)![MoveType.EnPassant]).toEqual(game.expectation.to);
        console.log("Passed: " + game.title);
    }
});