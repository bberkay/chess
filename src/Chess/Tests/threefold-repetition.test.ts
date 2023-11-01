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
        {from: Square.g1, to: Square.f3},
        {from: Square.g8, to: Square.f6},
        {from: Square.f3, to: Square.g1},
        {from: Square.f6, to: Square.g8},
        {from: Square.g1, to: Square.f3},
        {from: Square.g8, to: Square.f6},
        {from: Square.f3, to: Square.g1},
        {from: Square.f6, to: Square.g8},
        {from: Square.g1, to: Square.f3},
        {from: Square.g8, to: Square.f6},
        {from: Square.f3, to: Square.g1},
        {from: Square.f6, to: Square.g8},
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
    expect(engine.getGameStatus()).toEqual(game.expectation);

    console.log("Passed");
    console.log("--------------------------------------------------");
});