import { expect, test } from 'vitest';
import { MoveType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

// Possible En Passant Moves
const possibleEnPassantGames = [
    {
        "board": StartPosition.EnPassantLeft,
        "moves": [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        "expectedEnPassantMove": {from: Square.e5, to: Square.d6}
    },
    {
        "board": StartPosition.EnPassantRight,
        "moves": [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5}
        ],
        "expectedEnPassantMove": {from: Square.d5, to: Square.e6}
    }
];

test('Possible En Passant Moves', () => {
    for(const game of possibleEnPassantGames) {
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectedEnPassantMove.from)![MoveType.EnPassant]![0]).toEqual(game.expectedEnPassantMove.to);
    }
});

// Missed En Passant Moves(one turn limit when it was possible)
const missedEnPassantGames = [
    {
        "board": StartPosition.EnPassantLeft,
        "moves": [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
            {from: Square.h2, to: Square.h3},
            {from: Square.a6, to: Square.a5},
        ],
        "expectedEnPassantMove": {from: Square.e5, to: []}
    },
    {
        "board": StartPosition.EnPassantRight,
        "moves": [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5},
            {from: Square.h2, to: Square.h3},
            {from: Square.a6, to: Square.a5},
        ],
        "expectedEnPassantMove": {from: Square.d5, to: []}
    }
];

test('Missed En Passant Moves', () => {
    for(const game of missedEnPassantGames) {
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectedEnPassantMove.from)![MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});

// Forbidden En Passant Moves (enemy pawn is not play 2 square directly from start position)
const forbiddenEnPassantGames = [
    {
        "board": StartPosition.EnPassantLeft,
        "moves": [
            {from: Square.e2, to: Square.e4},
            {from: Square.d7, to: Square.d6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d6, to: Square.d5},
        ],
        "expectedEnPassantMove": {from: Square.e5, to: []}
    },
    {
        "board": StartPosition.EnPassantRight,
        "moves": [
            {from: Square.d2, to: Square.d4},
            {from: Square.e7, to: Square.e6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e6, to: Square.e5},
        ],
        "expectedEnPassantMove": {from: Square.d5, to: []}
    }
];

test("Forbidden En Passant Games Because Of Enemy Pawn's Move", () => {
    for(const game of forbiddenEnPassantGames) {
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectedEnPassantMove.from)![MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});

// Forbidden En Passant Moves (because king will be in danger when en passant move done)
const forbiddenEnPassantGamesForKingProtection = [
    {
        "board": StartPosition.ForbiddenEnPassantLeft,
        "moves": [
            {from: Square.e2, to: Square.e4},
            {from: Square.a7, to: Square.a6},
            {from: Square.e4, to: Square.e5},
            {from: Square.d7, to: Square.d5},
        ],
        "expectedEnPassantMove": {from: Square.e5, to: []}
    },
    {
        "board": StartPosition.ForbiddenEnPassantRight,
        "moves": [
            {from: Square.d2, to: Square.d4},
            {from: Square.a7, to: Square.a6},
            {from: Square.d4, to: Square.d5},
            {from: Square.e7, to: Square.e5}
        ],
        "expectedEnPassantMove": {from: Square.d5, to: []}
    }
];

test('Forbidden En Passant Moves Because Of King Protection', () => {
    for(const game of forbiddenEnPassantGamesForKingProtection) {
        const engine = new ChessEngine();
        engine.createGame(game.board);

        for(const move of game.moves) {
            engine.playMove(move.from, move.to);
        }

        expect(engine.getMoves(game.expectedEnPassantMove.from)![MoveType.EnPassant]).toEqual(game.expectedEnPassantMove.to);
    }
});