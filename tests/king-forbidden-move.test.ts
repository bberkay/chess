import { expect, test } from 'vitest';
import { MoveType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

// King Forbidden Moves
const kingForbiddenMovesGame: string = StartPosition.KingForbiddenMove;

// Expected moves for the white king on h8.
const kingExpectedMove = {
    "king": Square.h8,
    "expectedMoves": [Square.g8]
};

// Test king and its moves.
test('King Forbidden Moves', () => {
    const chessEngine = new ChessEngine();
    chessEngine.createGame(kingForbiddenMovesGame);

    // This test also includes capturing the forbidden piece.
    expect(chessEngine.getMoves(kingExpectedMove.king)![MoveType.Normal]!.sort()).toEqual(kingExpectedMove.expectedMoves.sort());
});