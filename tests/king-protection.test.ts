import { expect, test } from 'vitest';
import {MoveType, Square, StartPosition} from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';

// Games
const games: string[] = [
    StartPosition.ProtectKing, // White Rook and Black Queen face to face while kings behind them.
    '8/8/7k/6b1/8/8/3N4/2K5 w - - 0 1', // White Knight protects the king from the bishop.
    '3k4/3p4/4P3/8/8/8/8/3RK3 b - - 0 1', // Forbidden Pawn Capture
    '3k4/8/8/8/3pP3/8/8/3RK3 b - e3 0 1' // Forbidden En passant
];

// Pieces and expected moves for every game.
const piecesAndMoves = [
    {
        [Square.d2]: [Square.d3, Square.d4, Square.d5, Square.d6, Square.d7] , // Expected moves for the white rook
    },
    {
        [Square.d2]: [] // Expected moves for the white knight
    },
    {
        [Square.d7]: [Square.d6, Square.d5] // Expected moves for the white pawn
    },
    {
        [Square.d4]: [Square.d3] // Expected moves for the black pawn
    }
];

// Tests
test('King Protection', () => {
    for(let i = 0; i < games.length; i++){
        const chessEngine = new ChessEngine();
        chessEngine.createGame(games[i]);

        // Test every piece and its moves
        for(const [piece, moves] of Object.entries(piecesAndMoves[i]))
            expect(chessEngine.getMoves(Number(piece) as Square)[MoveType.Normal].sort()).toEqual(moves.sort());
    }
});