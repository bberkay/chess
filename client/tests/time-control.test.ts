/**
 * Test for time control logic.
 *
 * @see For more information about vitest, check https://vitest.dev/
 */

import { expect, test } from 'vitest';
import { TestGame } from './types';
import { Square, StartPosition, Color, GameStatus } from '@Chess/Types';
import { ChessEngine, TimerNotAvailableError } from '@Chess/Engine/ChessEngine';
import { Converter } from '@ChessPlatform/Chess/Utils/Converter';

const REMAINING_DURATION = 10 * 1000;
const INCREMENT_DURATION = 1000;

/**
 * Board with expected moves for protectors of the king.
 */
const remainingTimeGames: TestGame[] = [
    {
        title: "White wins, black's time is over.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
        ],
        expectation: GameStatus.WhiteVictory
    },
    {
        title: "Black wins, white's time is over.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
            { from: Square.g7, to: Square.g5 },
        ],
        expectation: GameStatus.BlackVictory
    },
]

test('Remaining time Test', async () => {
    const engine = new ChessEngine();

    for (const game of remainingTimeGames) {
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        engine.createGame(
            { ...Converter.fenToJson(game.board as string), durations: game.durations }
        );

        // Play moves
        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        const someTime = REMAINING_DURATION / 10;
        await new Promise(resolve => setTimeout(resolve, someTime));

        const playerRemainingTimes = engine.getPlayersRemainingTime();
        console.log(`Some time ${someTime} has passed.`);
        expect(engine.getGameStatus()).not.toEqual(game.expectation);
        expect(playerRemainingTimes.White).toBeLessThan(REMAINING_DURATION);
        expect(playerRemainingTimes.Black).toBeLessThan(REMAINING_DURATION);
        expect(playerRemainingTimes.White).toBeGreaterThan(someTime);
        expect(playerRemainingTimes.Black).toBeGreaterThan(someTime);

        const enoughTime = REMAINING_DURATION + 1000;
        await new Promise(resolve => setTimeout(resolve, enoughTime));
        console.log(`Enough time ${enoughTime} has passed.`);
        expect(engine.getGameStatus()).toEqual(game.expectation);
        expect(() => engine.getPlayersRemainingTime()).toThrowError(TimerNotAvailableError);

        console.log("--------------------------------------------------");
    }
}, 30_000);

const incrementTimeGames: TestGame[] = [
    {
        title: "White remaining time should be higher than black remaining time because of the increment.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: REMAINING_DURATION },
            [Color.White]: { remaining: REMAINING_DURATION, increment: REMAINING_DURATION }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
            { from: Square.g7, to: Square.g5 },
            { from: Square.b1, to: Square.c3 },
        ],
        expectation: {
            gameStatus: GameStatus.InPlay,
            remainingTimes: (white: number, black: number) => white > black
        }
    },
    {
        title: "Black remaining time should be higher than white remaining time because of the increment.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: REMAINING_DURATION },
            [Color.White]: { remaining: REMAINING_DURATION, increment: REMAINING_DURATION }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
            { from: Square.g7, to: Square.g5 },
            { from: Square.b1, to: Square.c3 },
            { from: Square.g8, to: Square.h6 },
        ],
        expectation: {
            gameStatus: GameStatus.InPlay,
            remainingTimes: (white: number, black: number) => white < black
        }
    },
]

test(`Increment time test`, async () => {
    const engine = new ChessEngine();

    for(const game of incrementTimeGames){
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        engine.createGame(
            { ...Converter.fenToJson(game.board as string), durations: game.durations }
        );

        // Play moves
        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getAlgebraicNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        const someTime = REMAINING_DURATION / 10;
        await new Promise(resolve => setTimeout(resolve, someTime));

        const playerRemainingTimes = engine.getPlayersRemainingTime();
        console.log(`Some time ${someTime} has passed.`);
        expect(engine.getGameStatus()).toEqual(game.expectation.gameStatus);
        expect(playerRemainingTimes.White).toBeGreaterThan(REMAINING_DURATION);
        expect(playerRemainingTimes.Black).toBeGreaterThan(REMAINING_DURATION);

        const isIncrementCorrect = game.expectation.remainingTimes(playerRemainingTimes.White, playerRemainingTimes.Black);
        expect(isIncrementCorrect).toEqual(true);

        console.log("--------------------------------------------------");
    }
}, 30_000);

const timerStartGames: TestGame[] = [
    {
        title: "Timers should not be started because there is no move",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [],
        expectation: {
            gameStatus: GameStatus.ReadyToStart,
            shouldWhiteDurationBeLessThanRemaining: false,
            shouldBlackDurationBeLessThanRemaining: false,
        }
    },
    {
        title: "Timers should not be started because there is not enough move.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
        ],
        expectation: {
            gameStatus: GameStatus.InPlay,
            shouldWhiteDurationBeLessThanRemaining: false,
            shouldBlackDurationBeLessThanRemaining: false,
        }
    },
    {
        title: "Timers should be started because there is enough move.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
        ],
        expectation: {
            gameStatus: GameStatus.InPlay,
            shouldWhiteDurationBeLessThanRemaining: true,
            shouldBlackDurationBeLessThanRemaining: false,
        }
    },
    {
        title: "Timers should be started because there is enough move.",
        board: StartPosition.Standard,
        durations: {
            [Color.Black]: { remaining: REMAINING_DURATION, increment: 0 },
            [Color.White]: { remaining: REMAINING_DURATION, increment: 0 }
        },
        moves: [
            { from: Square.e2, to: Square.e4 },
            { from: Square.e7, to: Square.e5 },
            { from: Square.b2, to: Square.b4 },
        ],
        expectation: {
            gameStatus: GameStatus.InPlay,
            shouldWhiteDurationBeLessThanRemaining: true,
            shouldBlackDurationBeLessThanRemaining: true,
        }
    },
]

test(`Timer's should not be started, until first moves are played.`, async () => {
    const engine = new ChessEngine();

    for(const game of timerStartGames){
        console.log("Testing: " + game.title);
        console.log("Board:   " + game.board);
        engine.createGame(
            { ...Converter.fenToJson(game.board as string), durations: game.durations }
        );

        // Play moves
        for (const move of game.moves!) {
            engine.playMove(move.from, move.to);
        }

        console.log("Final Notation: " + engine.getAlgebraicNotation());
        console.log("Final Board:    " + engine.getGameAsFenNotation());

        const someTime = REMAINING_DURATION / 2;
        await new Promise(resolve => setTimeout(resolve, someTime));

        const playerRemainingTimes = engine.getPlayersRemainingTime();
        console.log(`Some time ${someTime} has passed.`);
        expect(engine.getGameStatus()).toEqual(game.expectation.gameStatus);
        expect(playerRemainingTimes.White < REMAINING_DURATION)
            .toEqual(game.expectation.shouldWhiteDurationBeLessThanRemaining);
        expect(playerRemainingTimes.Black < REMAINING_DURATION)
            .toEqual(game.expectation.shouldBlackDurationBeLessThanRemaining);

        console.log("--------------------------------------------------");
    }
}, 30_000);
