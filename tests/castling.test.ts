/**
 * Test file for every castling move.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { Test } from './Types';
import { Color, MoveType, PieceType, Square, StartPosition } from '../src/Types';
import { ChessEngine } from '../src/Engine/ChessEngine';
import { BoardQueryer } from "../src/Engine/Core/Board/BoardQueryer";

/**
 * All Castling Tests For every situation.
 */
const castlingTestGames: Test[] = [
    {
        title: 'King Side Castling',
        board: StartPosition.Castling,
        moves: [
            {from: Square.e1, to: Square.h1}
        ],
        expectation: "r3k2r/8/8/4b3/4B3/8/8/R4RK1 b Qkq - 2 1",
    },
    {
        title: 'Queen Side Castling',
        board: StartPosition.Castling,
        moves: [
            {from: Square.e1, to: Square.a1}
        ],
        expectation: "r3k2r/8/8/4b3/4B3/8/8/2KR3R b Kkq - 2 1",
    },
    {
        title: "Long Castling Forbidden Because of Enemy Bishop",
        board: StartPosition.LongCastlingCheck,
        expectation: [Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of Enemy Bishop",
        board: StartPosition.ShortCastlingCheck,
        expectation: [Square.a1]
    },
    {
        title: "Both Castling Forbidden Because of Enemy Bishop",
        board: StartPosition.BothCastlingCheck,
        expectation: []
    },
    {
        title: "Both Castling Forbidden Because King is in Check",
        board: StartPosition.CheckCastling,
        expectation: []
    },
    {
        title: "Long Castling Forbidden Because of Queen Side Rook has Moved/Not on the true position",
        board: StartPosition.Castling,
        moves: [
            {from: Square.a1, to: Square.a2},
            {from: Square.e8, to: Square.e7}, // Unimportant black move to set the turn to white
        ],
        expectation: [Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of King Side Rook has Moved/Not on the true position",
        board: StartPosition.Castling,
        moves: [
            {from: Square.h1, to: Square.h2},
            {from: Square.e8, to: Square.e7},
        ],
        expectation: [Square.a1]
    },
    {
        title: "Long Castling Forbidden Because of Queen Side Rook has Moved previously but now on the true position",
        board: StartPosition.Castling,
        moves: [
            {from: Square.a1, to: Square.a2},
            {from: Square.e8, to: Square.e7}, // Unimportant black move to set the turn to white
            {from: Square.a2, to: Square.a1},
            {from: Square.e7, to: Square.e8} // Unimportant black move to set the turn to white
        ],
        expectation: [Square.h1]
    },
    {
        title: "Short Castling Forbidden Because of King Side Rook has Moved previously but now on the true position",
        board: StartPosition.Castling,
        moves: [
            {from: Square.h1, to: Square.h2},
            {from: Square.e8, to: Square.e7},
            {from: Square.h2, to: Square.h1},
            {from: Square.e7, to: Square.e8}
        ],
        expectation: [Square.a1]
    },
    {
        title: "Both Castling Forbidden Because of King has Moved previously",
        board: StartPosition.Castling,
        moves: [
            {from: Square.e1, to: Square.e2},
            {from: Square.e8, to: Square.e7},
        ],
        expectation: []
    },
    {
        title: "Both Castling Forbidden Because of King has Moved previously but now on the true position",
        board: StartPosition.Castling,
        moves: [
            {from: Square.e1, to: Square.e2},
            {from: Square.e8, to: Square.e7},
            {from: Square.e2, to: Square.e1},
            {from: Square.e7, to: Square.e8}
        ],
        expectation: []
    }
];

// Test for every castling move.
test('Castling Moves', () => {
    const engine = new ChessEngine();
    for(const game of castlingTestGames)
    {
        console.log("Testing: " + game.title);
        console.log("Initial Board: " + game.board);
        engine.createGame(game.board);

        // Play the moves if there is any
        if(game.moves)
        {
            for(const move of game.moves)
            {
                engine.playMove(move.from, move.to);
            }
        }

        /**
         * If the expectation is string, then we will check the board is
         * equal to the expectation. If the expectation is array, then we
         * will check the castling moves of the king are equal to the expectation.
         */
        if(typeof game.expectation == "string")
            expect(engine.getGameAsFenNotation()).toEqual(game.expectation);
        else{
            // Get the square of white king
            const squareOfKing: Square = BoardQueryer.getSquareOfPiece(
                BoardQueryer.getPiecesWithFilter(Color.White, [PieceType.King])[0]
            );

            // Check the castling moves of the king are equal to the expectation.
            expect(engine.getMoves(squareOfKing)[MoveType.Castling]).toEqual(game.expectation);
        }

        console.log("Final Board: " + engine.getGameAsFenNotation());
        console.log("Passed");
        console.log("--------------------------------------------------");
    }
});