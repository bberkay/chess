/**
 * Test file for mandatory moves for example: If a king is in check
 * then the player must make a move that takes the king out of check.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { describe, expect, test } from 'vitest';
import { TestGame } from './types';
import { Moves, MoveType, Square } from '@Chess/Types';
import { ChessEngine } from '@Chess/Engine/ChessEngine';


const mandatoryMovesTests: TestGame[] = [
    {
        title: "White King must move because threat can't be captured",
        board: "7K/5R2/6n1/8/8/8/8/4k3 w - - 0 1",
        expectation: [
            {
                from: Square.h8,
                to: [Square.g8, Square.g7, Square.h7] // Expected moves of white king.
            },
            {
                from: Square.f7,
                to: null // Expected move of white rook.
            }
        ]
    },
    {
        title: "White King must move or white bishop must capture enemy knight",
        board: "7K/5R2/6n1/8/8/8/2B5/4k3 w - - 0 1",
        expectation: [
            {
                from: Square.h8,
                to: [Square.g8, Square.g7, Square.h7] // Expected moves of white king.
            },
            {
                from: Square.f7,
                to: null // Expected move of white rook
            },
            {
                from: Square.c2,
                to: [Square.g6] // Expected move of white bishop.
            }
        ]
    },
    {
        title: "White rook must block the check of the black rook",
        board: "K7/8/4RP2/8/8/8/1r5k/r7 w - - 0 1",
        expectation: [
            {
                from: Square.a8,
                to: null // Expected move of white king.
            },
            {
                from: Square.e6,
                to: [Square.a6] // Expected move of white rook.
            },
            {
                from: Square.f6,
                to: null // Expected move of white pawn.
            }
        ]
    },
    {
        title: "White king must move because of double check",
        board: "4K3/8/3n4/4R2q/8/8/7k/8 w - - 0 1",
        expectation: [
            {
                from: Square.e8,
                to: [Square.d8, Square.d7, Square.e7, Square.f8]
            },
            {
                from: Square.e5,
                to: null // Expected move of white rook.
            }
        ]
    }
];

/**
 * Test file for move notation by playing a random game
 */
describe('Mandatory Moves Test', () => {

    for(const game of mandatoryMovesTests) {
        test(game.title, () => {
            const engine = new ChessEngine();
            engine.createGame(game.board);
            console.log("Initial Board:  " + engine.getGameAsFenNotation());

            // Test every piece and its moves
            for(const expectation of game.expectation){
                const moves: Moves = engine.getMoves(Number(expectation.from) as Square)!;
                console.log("From: " + expectation.from + " Moves: " + JSON.stringify(moves));
                if(expectation.to === null){
                    const isOneOfThemTrue = moves === null || (moves && moves.Normal && moves.Normal.length === 0);
                    expect(isOneOfThemTrue).toBe(true);
                }
                else{
                    expect(moves![MoveType.Normal]!.sort()).toEqual(expectation.to.sort());
                }
            }
        });
    }
});
