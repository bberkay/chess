import { expect, test } from 'vitest';
import { MoveType, Square } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

// Random Game
const game: string = 'rnbqkbnr/pppppppp/8/6B1/3P2B1/2NQ3P/PPP1PPP1/R3K1NR w KQkq - 0 1';

// Pieces and expected moves for every game.
const piecesAndMoves = {
    [Square.a1]: [Square.b1, Square.c1, Square.d1], // Expected moves for the white rook on a1,
    [Square.c2]: [], // Expected moves for the white pawn on c2,
    [Square.c3]: [Square.a4, Square.b5, Square.d5, Square.e4, Square.b1, Square.d1], // Expected moves for the white knight on c3,
    [Square.d3]: [Square.h7, Square.a6, Square.b5, Square.c4, Square.d2, Square.d1, Square.e3, Square.f3, Square.g3, Square.e4, Square.f5, Square.g6], // Expected moves for the white queen on d3
    [Square.d4]: [Square.d5], // Expected moves for the white pawn on d4
    [Square.e2]: [Square.e3, Square.e4], // Expected moves for the white pawn on e2
    [Square.g1]: [Square.f3], // Expected moves for the white king on g1
    [Square.h1]: [Square.h2], // Expected moves for the white rook on h1
    [Square.g4]: [Square.f5, Square.e6, Square.f3, Square.d7, Square.h5], // Expected moves for the white bishop on g4,
    [Square.g5]: [Square.h4, Square.h6, Square.f6, Square.e7, Square.f4, Square.e3, Square.d2, Square.c1] // Expected moves for the white bishop on g5
};

// Tests
test('Standard Moves', () => {
    const chessEngine = new ChessEngine();
    chessEngine.createGame(game);

    // Test every piece and its moves
    for(const [piece, moves] of Object.entries(piecesAndMoves))
        expect(chessEngine.getMoves(Number(piece) as Square)![MoveType.Normal]!.sort()).toEqual(moves.sort());
});