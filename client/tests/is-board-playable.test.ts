/**
 * Test file that check the board is playable/can be finished on start or mid-game.
 * For example: If board has no pieces expect kings, then game is not playable.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { GameStatus, Square } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';

/**
 * Games with expected status after creating board.
 */
const games: TestGame[] = [
    {
        title: "1 White King, 1 Black King",
        board: "4k3/8/8/8/8/8/8/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.NotReady
    },
    {
        title: "1 White King, 1 Black King, 1 White Pawn",
        board: "4k3/8/8/8/8/5P2/8/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.ReadyToStart
    },
    {
        title: "1 White King, 1 Black King, 1 White Bishop",
        board: "4k3/8/8/8/8/8/5B2/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.NotReady
    },
    {
        title: "1 White King, 1 Black King, 1 White Knight",
        board: "4k3/8/8/8/8/8/5N2/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.NotReady
    },
    {
        title: "1 White King, 1 Black King, 1 White Rook",
        board: "4k3/8/8/8/8/8/5R2/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.ReadyToStart
    },
    {
        title: "1 White King, 1 Black King, 1 White Bishop, 1 White Knight",
        board: "4k3/8/8/8/8/8/3N1B2/4K3 w - - 0 1",
        moves: [],
        expectation: GameStatus.ReadyToStart
    },
    {
        title: "1 White King, 1 Black King, 1 Black Knight after 1 move",
        board: "4k3/3n4/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            {from: Square.e1, to: Square.f2}
        ],
        expectation: GameStatus.Draw
    },
    {
        title: "1 White King, 1 Black King, 1 Black Bishop after 1 move",
        board: "4k3/3b4/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            {from: Square.e1, to: Square.f2}
        ],
        expectation: GameStatus.Draw
    },
    {
        title: "1 White King, 1 Black King, 1 Black Bishop, 1 Black Knight after 1 move",
        board: "4k3/3b1n2/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            {from: Square.e1, to: Square.f2}
        ],
        expectation: GameStatus.InPlay
    },
    {
        title: "1 White King, 1 Black King after 1 move",
        board: "4k3/8/8/8/8/8/5p2/4K3 w - - 0 1",
        moves: [
            {from: Square.e1, to: Square.f2}
        ],
        expectation: GameStatus.Draw
    }
]

// Test Playable/Unplayable Boards
test(`Is Board Playable`, () => {
    // Create chess engine
    const chessEngine = new ChessEngine();

    // Test every game
    for (const game of games) {
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        chessEngine.createGame(game.board);

        // Make moves(if any)
        if(game.moves!.length > 0){
            for (const move of game.moves!) {
                chessEngine.playMove(move.from, move.to);
            }
        }

        expect(chessEngine.getGameStatus()).toBe(game.expectation);

        console.log("--------------------------------------------------");
    }
});
