import {expect, test} from 'vitest';
import {GameStatus} from '../src/Types';
import {ChessEngine} from '../src/Engine/ChessEngine';

// Fen Notations with expected GameStatus
const games: Record<string, GameStatus> = {
    "rnbqkbnr/pppppQpp/8/8/2B5/8/PPPPPPPP/RNB1K1NR b KQkq - 0 1": GameStatus.WhiteVictory,
    "rnb1k1nr/pppppppp/8/2b5/8/8/PPPPPqPP/RNBQKBNR w KQkq - 0 1": GameStatus.BlackVictory,
    "rnbqk1nr/pppppppp/8/8/7b/5P2/PPPPP1PP/RNBQKBNR w KQkq - 0 1": GameStatus.WhiteInCheck,
    "rnbqkbnr/ppppp1pp/5p2/7B/8/8/PPPPPPPP/RNBQK1NR b KQkq - 0 1": GameStatus.BlackInCheck,
    "k7/5R2/8/6p1/6P1/8/7K/1R6 b - - 0 1": GameStatus.Draw, // Stalemate
    "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 50 1": GameStatus.Draw, // 50 move rule,
    "r3k1n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R2QK2R w KQq - 0 1": GameStatus.InPlay,
    "r5n1/ppp1pp1p/3p4/6p1/2P1P3/8/PP2PPPP/R3K2R w KQa - 0 1": GameStatus.NotStarted, // Black/White King missing
}

// Test every status of the game
test(`Game status`, () => {
    // Create chess engine
    const chessEngine = new ChessEngine();

    // Test each fen notation
    for (const fen in games) {
        chessEngine.createGame(fen);
        expect(chessEngine.getStatus()).toBe(games[fen]);
    }
});
