/**
 * Test for threefold repetition. The game is drawn if the same position occurs three times.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { GameStatus, Square } from '../Types';
import { ChessEngine } from '../Engine/ChessEngine';

/**
 * Board with expected repetition moves.
 */
const game: Test = {
    title: "Threefold Repetition Test",
    board: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", // Standard start position
    moves: [
        { from: Square.d2, to: Square.d4 },
        { from: Square.d7, to: Square.d5 },
        { from: Square.e1, to: Square.d2 },
        { from: Square.e8, to: Square.d7 },
        { from: Square.d2, to: Square.e1 },
        { from: Square.d7, to: Square.e8 },
        { from: Square.e1, to: Square.d2 },
        { from: Square.e8, to: Square.d7 },
        { from: Square.d2, to: Square.e1 },
        { from: Square.d7, to: Square.e8 },
        { from: Square.e1, to: Square.d2 },
        { from: Square.e8, to: Square.d7 },
    ],
    expectation: GameStatus.Draw
}

/**
 * Test for threefold repetition.
 */
test('Threefold Repetition Test', () => {
    console.log("Testing:        " + game.title);
    console.log("Initial Board:  " + game.board);

    const engine = new ChessEngine();
    engine.createGame(game.board);

    // Play moves
    for(const move of game.moves!){
        engine.playMove(move.from, move.to);
    }

    console.log("Final Notation: " + engine.getNotation());
    console.log("Final Board:    " + engine.getGameAsFenNotation());

    // Check if the game is drawn
    expect(engine.getStatusOfGame()).toEqual(game.expectation);

    console.log("Passed");
    console.log("--------------------------------------------------");
});