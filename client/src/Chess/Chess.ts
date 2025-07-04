/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by
 * connecting `ChessEngine` and `ChessBoard` with `Store`.
 * @author Berkay Kaya <berkaykayaforbusiness@gmail.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import {
    JsonNotation,
    PieceType,
    Square,
    Color,
    StartPosition,
    ChessEvent,
    GameStatus,
    Durations,
    Move,
    Scores,
    MoveType,
    RemainingTimes,
} from "./Types";
import { ChessEngine, MoveValidationError } from "./Engine/ChessEngine";
import { ChessBoard } from "./Board/ChessBoard";
import { SquareClickMode, SquareEffect } from "./Board/Types";
import { Store, StoreKey } from "@Services/Store";
import { Converter } from "./Utils/Converter.ts";
import { Logger } from "@Services/Logger.ts";
import { Bot, BotAttributes } from "./Bot";

/**
 * Delay time for the pre-move. Pre move will be played
 * after this delay time if it exists.
 */
const PRE_MOVE_DELAY = 100;

/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses Store which provides users to save the game to the cache and load the game from the cache and Logger
 * which provides users to log the game.
 */
export class Chess {
    /**
     * Properties of the Chess class.
     */
    public readonly engine: ChessEngine;
    public readonly board: ChessBoard;

    private _isNonDomMove: boolean = true;
    private _isLastNonDomMovePromotion: boolean = false;
    private _selectedSquare: Square | null = null;
    private _preSelectedSquare: Square | null = null;
    private _preMoves: { [key in Color]: Move[] } = {
        [Color.Black]: [],
        [Color.White]: [],
    };
    private _bot: Bot | null = null;
    private _lastCreatedBotAttributes: BotAttributes | null = null;
    private _currentTakeBackCount: number = 0;
    private _gameTimeMonitorIntervalId: number = -1;

    public readonly logger: Logger = new Logger("src/Chess/Chess.ts");

    /**
     * Constructor of the Chess class.
     */
    constructor() {
        const engineLogger = new Logger("src/Chess/Engine/ChessEngine.ts");
        this.engine = new ChessEngine((log: string) => { engineLogger.save(log) } );
        const boardLogger =  new Logger("src/Chess/Board/ChessBoard.ts");
        this.board = new ChessBoard((log: string) => { boardLogger.save(log) } );
        this.logger.save("Chess class initialized");
        this.checkAndLoadGameFromCache();
    }

    /**
     * This function resets the properties of the Chess class.
     */
    private resetProperties(): void {
        this._isNonDomMove = true;
        this._isLastNonDomMovePromotion = false;
        this._selectedSquare = null;
        this._preSelectedSquare = null;
        this._preMoves = { [Color.Black]: [], [Color.White]: [] };
        this.terminateBotIfExist();
        this._lastCreatedBotAttributes = null;
        this._currentTakeBackCount = 0;
        if (this._gameTimeMonitorIntervalId !== -1)
            clearInterval(this._gameTimeMonitorIntervalId);
        this._gameTimeMonitorIntervalId = -1;
        this.logger.save("Properties reset");
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check `src/Services/Store`
     */
    public checkAndLoadGameFromCache(): void {
        // If there is a game in the cache, load it.
        if (Store.isExist(StoreKey.LastBoard)) {
            this.logger.save("Game loading from cache...");
            this.createGame(
                Store.load(StoreKey.LastBoard) as JsonNotation
            );
            if (Store.isExist(StoreKey.LastBot)) {
                const botAttributes = Store.load(
                    StoreKey.LastBot
                )!;
                this.addBotToCurrentGame(botAttributes);
                this.logger.save(
                    `Bot-ts-${JSON.stringify(
                        botAttributes
                    )}-te- found in cache and added to the game`
                );
            }
            this.logger.save("Game loaded from cache");
        } else {
            this.createGame();
            this.logger.save("No game found in cache, created a standard game");
        }
    }

    /**
     * This function creates a new game with the given position(fen notation/string,
     * StartPosition/string or JsonNotation).
     *
     * If `position` is JsonNotation and includes `durations` but also `durations` parameter
     * is given then `durations` in the JsonNotation will be OVERRIDEN by the `durations`
     * parameter. If `position` is string/fen/StartPosition then it will be converted to
     * JsonNotation and if `durations` parameter is given then `durations` will be ADDED
     * to the created JsonNotation that is converted from the string/fen/StartPosition.
     *
     * @see For more information about `StartPosition` and `JsonNotation` check `src/Chess/Types/index.ts`
     */
    public createGame(
        position:
            | JsonNotation
            | StartPosition
            | string = StartPosition.Standard,
        durations: Durations | null = null
    ): void {
        this.resetProperties();
        this.logger.save(
            "Cache cleared and properties reset before creating a new game"
        );

        if (typeof position === "string") {
            position = Converter.fenToJson(position);
            this.logger.save(`Given position converted to json notation.`);
        }

        if (durations) position.durations = durations;

        this.engine.createGame(position);
        this.logger.save(`Game successfully created on ChessEngine`);

        this.board.createGame(position);
        this.board.setTurnColor(this.engine.getTurnColor());
        this.board.showStatus(this.engine.getGameStatus());

        const lastMove =
            this.engine.getMoveHistory()[
                this.engine.getMoveHistory().length - 1
            ];
        if (lastMove) {
            this.board.addSquareEffects(lastMove.from, SquareEffect.From);
            this.board.addSquareEffects(lastMove.to, SquareEffect.To);
        }

        this.logger.save(
            `Game successfully created on Chessboard and status-ts-${this.engine.getGameStatus()}-te- shown`
        );

        this.initBoardListener();
        this.monitorPlayerDurationsIfExist();

        Store.save(
            StoreKey.LastBoard,
            this.getGameAsJsonNotation()
        );
        Store.save(
            StoreKey.LastCreatedBoard,
            this.getGameAsFenNotation()
        )

        this.logger.save(`Game saved to cache as json notation`);

        document.dispatchEvent(new Event(ChessEvent.onGameCreated));
    }

    /**
     * This function creates a new game against the bot with the
     * given position(fen notation/string, `StartPosition/string` or
     * `JsonNotation`).
     */
    public addBotToCurrentGame(botAttributes: BotAttributes): void {
        this._bot = new Bot(botAttributes);
        this._bot.start();

        this._lastCreatedBotAttributes = this._bot.getAttributes();
        this.board.lockActionsOfColor(this._bot.color);
        this.logger.save(
            `Bot-ts-${this._bot.color}-te- created with difficulty-ts-${this._bot.difficulty}-te-`
        );

        // First move
        if (this._bot.color == this.engine.getTurnColor()) {
            this.board.lock();
            this.playBotIfExist();
        }

        Store.save(StoreKey.LastBot, this._bot.getAttributes());
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onBotAdded, {
                detail: { color: this._bot.color },
            })
        );
    }

    /**
     * This function returns the attributes of bot if it exists or created before.
     */
    public getLastCreatedBotAttributes(): BotAttributes | null {
        if (!this._bot) return this._lastCreatedBotAttributes;

        return this._bot.getAttributes();
    }

    /**
     * This function terminates the bot if it exists.
     */
    private terminateBotIfExist(): void {
        if (!this._bot) return;

        this._bot.terminate();
        this._bot = null;
        Store.clear(StoreKey.LastBot);
        this.logger.save("Bot terminated");
    }

    /**
     * Create a piece on the board and engine.
     */
    public createPiece(
        color: Color,
        pieceType: PieceType,
        square: Square
    ): void {
        this.board.createPiece(color, pieceType, square);
        this.engine.createPiece(color, pieceType, square);
        this.logger.save(
            `Piece-ts-${JSON.stringify({
                color,
                pieceType,
                square,
            })}-te- created on board and engine`
        );
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceCreated, {
                detail: { square: square },
            })
        );
        Store.save(
            StoreKey.LastBoard,
            this.engine.getGameAsJsonNotation()
        );
        Store.save(
            StoreKey.LastCreatedBoard,
            this.engine.getGameAsFenNotation()
        );
    }

    /**
     * Remove a piece from the board and engine.
     */
    public removePiece(square: Square): void {
        this.board.removePiece(square);
        this.engine.removePiece(square);
        this.logger.save(
            `Piece-ts-${square}-te- removed from board and engine`
        );
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceRemoved, {
                detail: { square: square },
            })
        );
        Store.save(
            StoreKey.LastBoard,
            this.engine.getGameAsJsonNotation()
        );
    }

    /**
     * This function initializes the listener for user's
     * actions on chessboard to make a move on engine and board.
     */
    private initBoardListener(): void {
        this.board.bindMoveEventCallbacks({
            onPieceSelected: (squareId: Square) => {
                this.handleOnPieceSelected(squareId);
            },
            onPiecePreSelected: (squareId: Square) => {
                this.handleOnPiecePreSelected(squareId);
            },
            onPieceMoved: (squareId: Square) => {
                this.handleOnPieceMoved(squareId);
            },
            onPiecePreMoved: (
                squareId: Square,
                squareClickMode: SquareClickMode
            ) => {
                this.handleOnPiecePreMoved(squareId, squareClickMode);
            },
            onPreMoveCanceled: () => {
                this._preSelectedSquare = null;
                this._preMoves[
                    this.engine.getTurnColor() === Color.White
                        ? Color.Black
                        : Color.White
                ] = [];
                this.board.closePromotionMenu();
                this.logger.save("Pre-move canceled");
            },
        });

        this.logger.save("Moves listener initialized");
    }

    /**
     * This function monitors the players' durations
     * if game has durations.
     */
    private monitorPlayerDurationsIfExist(): void {
        if (
            this.engine.getDurations() === null &&
            this._gameTimeMonitorIntervalId !== -1
        )
            return;

        this._gameTimeMonitorIntervalId = setInterval(() => {
            if (
                [
                    GameStatus.BlackVictory,
                    GameStatus.WhiteVictory,
                    GameStatus.Draw,
                ].includes(this.engine.getGameStatus())
            ) {
                clearInterval(this._gameTimeMonitorIntervalId);
                this._gameTimeMonitorIntervalId = -1;
                this.finishTurn();
                this.logger.save(
                    "Game over. Game time monitor interval cleared"
                );
            }
        }, 1000) as unknown as number;

        this.logger.save("Engine listener initialized");
    }

    /**
     * Handle the selected piece on the board and engine.
     */
    private handleOnPieceSelected(squareId: Square): void {
        this._selectedSquare = squareId;
        this.board.highlightMoves(this.engine.getMoves(this._selectedSquare!));
        this.logger.save(`Piece-ts-${squareId}-te- selected on the board`);
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceSelected, {
                detail: { square: squareId },
            })
        );
    }

    /**
     * Handle the pre-selected piece on the board and engine.
     */
    private handleOnPiecePreSelected(squareId: Square): void {
        this._preSelectedSquare = squareId;
        this.board.highlightMoves(
            this.engine.getMoves(this._preSelectedSquare!, true),
            true
        );
        this.logger.save(`Piece-ts-${squareId}-te- pre selected on the board`);
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceSelected, {
                detail: { square: squareId },
            })
        );
    }

    /**
     * Handle the moved piece on the board and engine.
     */
    private handleOnPieceMoved(squareId: Square): void {
        this._isNonDomMove = false;
        this.playMove(this._selectedSquare!, squareId);
        this._isNonDomMove = true;

        if (this.board.getLockedColor())
            this.board.lock();

        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceMovedByPlayer, {
                detail: { from: this._selectedSquare!, to: squareId },
            })
        );
    }

    /**
     * Handle the pre-moved piece on the board and engine.
     */
    private handleOnPiecePreMoved(
        squareId: Square,
        squareClickMode: SquareClickMode
    ): void {
        const preMove: Move = { from: this._preSelectedSquare!, to: squareId };

        switch (squareClickMode) {
            case SquareClickMode.PrePromote:
                preMove.type = MoveType.Promote;
                this.board.closePromotionMenu();
                break;
            case SquareClickMode.PrePromotion:
                preMove.type = MoveType.Promotion;
                this.board.showPromotionMenu(preMove.to);
                break;
            case SquareClickMode.PreCastling:
                preMove.type = MoveType.Castling;
                break;
            case SquareClickMode.PreEnPassant:
                preMove.type = MoveType.EnPassant;
                break;
        }

        this._preMoves[
            this.engine.getTurnColor() === Color.White
                ? Color.Black
                : Color.White
        ].push(preMove);
        this.logger.save(`Pre-move-ts-${JSON.stringify(preMove)}-te- saved`);
        document.dispatchEvent(
            new CustomEvent(ChessEvent.onPieceSelected, {
                detail: { square: squareId },
            })
        );
    }

    /**
     * Play a move on the board and engine.
     */
    public async playMove(from: Square, to: Square): Promise<void> {
        let moveType: MoveType | null = null;
        try {
            if (this._isNonDomMove) {
                if(this._isLastNonDomMovePromotion) {
                    moveType = MoveType.Promote
                    this.logger.save(
                        `Non-dom move wanted to play from ${from} to ${to}. So, move type is found-ts-${moveType}-te- without needing to pre-calculation`
                    );
                } else {
                    moveType = this.engine.checkAndFindMoveType(from, to);
                    if (moveType === null) {
                        const preCalculatedMoves = this.engine.getMoves(from);
                        moveType = this.engine.checkAndFindMoveType(from, to);
                        this.logger.save(
                            `Non-dom move wanted to play from ${from} to ${to}. So, moves are pre-calculated-ts-${JSON.stringify(
                                preCalculatedMoves
                            )}-te- and move type is found-ts-${moveType}-te-`
                        );
                    } else {
                        this.logger.save(
                            `Non-dom move wanted to play from ${from} to ${to}. So, move type is found-ts-${moveType}-te- without needing to pre-calculation`
                        );
                    }
                }

                this._isLastNonDomMovePromotion = moveType === MoveType.Promotion;
            }

            this.engine.playMove(from, to, moveType);
            this._preSelectedSquare = null;
        } catch (e) {
            if (
                !(e instanceof MoveValidationError && this._preSelectedSquare)
            ) {
                this.board.refresh();
                this._preMoves[this.engine.getTurnColor()] = [];
                throw e;
            }
        }

        this.board.playMove(from, to, moveType).then(() => {
            this.logger.save(
                `Move-ts-${JSON.stringify({
                    from,
                    to,
                })}-te- played on board and engine`
            );
            this.finishTurn();
            document.dispatchEvent(
                new CustomEvent(ChessEvent.onPieceMoved, {
                    detail: { from: from, to: to },
                })
            );
        });
    }

    /**
     * Play the bot's move if it exists and it is
     * bot's turn.
     */
    private playBotIfExist(): void {
        if (!this._bot || this.engine.getTurnColor() != this._bot.color) return;

        this._bot.getMove(this.engine.getGameAsFenNotation()).then((move) => {
            // If found move is promotion then move will be Move[].
            // Check _doPromote() function in ChessEngine.ts for more
            // information.
            if (!Array.isArray(move)) move = [move];

            move.forEach((moveObject: Move) => {
                this.playMove(moveObject.from, moveObject.to);
            });

            this.board.unlock();
            document.dispatchEvent(
                new CustomEvent(ChessEvent.onPieceMovedByOpponent, {
                    detail: { from: move[move.length - 1].from, to: move[move.length - 1].to },
                })
            );
        });
    }

    /**
     * Play the pre-move if it exists.
     */
    private async playPreMoveIfExist(): Promise<void> {
        const preMovesOfPlayer = this._preMoves[this.engine.getTurnColor()];
        if (preMovesOfPlayer.length == 0) return;

        const { from, to, type } = preMovesOfPlayer[0];
        this._preMoves[this.engine.getTurnColor()] =
            preMovesOfPlayer.length > 1 ? preMovesOfPlayer.slice(1) : [];

        setTimeout(async () => {
            try {
                await this.playMove(from, to);
                this.logger.save(
                    `Pre-move-ts-${JSON.stringify({ from, to, type })}-te- played`
                );
                document.dispatchEvent(
                    new CustomEvent(ChessEvent.onPieceMovedByPlayer, {
                        detail: { from, to, type },
                    })
                );
            } catch (err) {
                if (!(err instanceof MoveValidationError))
                    throw err;
            }
        }, PRE_MOVE_DELAY);
    }

    /**
     * Go back to the previous move.
     * @param {boolean} onEngine - If it is true then it
     * will go back to the previous move on the engine not
     * just on the board.
     * @param {Color|null} undoColor - If it is not null then
     * it will go back to the previous move of the given color.
     * on the engine and board.
     */
    public takeBack(
        onEngine: boolean = false,
        undoColor: Color | null = null
    ): void {
        if (!onEngine && undoColor != null)
            throw new Error(
                "The 'undoColor' parameter must be null when the 'onEngine' parameter is false. Please try to use 'goToSpecificMove' function instead if you want to go to the specific move."
            );

        if (this.engine.getMoveHistory().length == 0) return;

        if (onEngine) {
            this._currentTakeBackCount =
                undoColor === this.engine.getTurnColor()
                    ? 0
                    : this._currentTakeBackCount + 1;
            let moveIndex = undoColor
                ? this.engine
                      .getBoardHistory()
                      .findLastIndex((board) => board.turn == undoColor)
                : this.engine.getBoardHistory().length;

            moveIndex =
                moveIndex -
                (!undoColor || undoColor === this.engine.getTurnColor()
                    ? 2
                    : 0);
            this._goToSpecificMove(moveIndex, false);
            this.engine.takeBack(undoColor);

            this.board.unlock();
            this.board.setTurnColor(this.engine.getTurnColor());

            Store.save(
                StoreKey.LastBoard,
                this.engine.getGameAsJsonNotation()
            );

            document.dispatchEvent(
                new CustomEvent(ChessEvent.onTakeBack, {
                    detail: { undoColor },
                })
            );
        } else {
            this.goToSpecificMove(
                this.engine.getMoveHistory().length -
                    1 -
                    this._currentTakeBackCount -
                    1
            );
        }
    }

    /**
     * Go forward to the next move.
     */
    public takeForward(): void {
        if (
            this.engine.getMoveHistory().length == 0 ||
            this._currentTakeBackCount == 0
        )
            return;

        this.goToSpecificMove(
            this.engine.getMoveHistory().length -
                1 -
                this._currentTakeBackCount +
                1
        );
    }

    /**
     * Go to the specific move by the given move index.
     */
    public goToSpecificMove(moveIndex: number): void {
        this._goToSpecificMove(moveIndex);

        if (moveIndex == this.engine.getMoveHistory().length - 1)
            this.board.unlock();

        document.dispatchEvent(new Event(ChessEvent.onTakeBackOrForward));
    }

    /**
     * Go to the specific move by the given move index.
     * @param {number} moveIndex - The index of the move
     * @param {boolean} showMoveReanimation - If it is true
     * then it will create the pieces on the board by the
     * given `move index - 1` and reanimate the `move index` board
     * 's last move. If it is false then it will just create the
     * pieces on the board by the given `move index`.
     */
    private _goToSpecificMove(
        moveIndex: number,
        showMoveReanimation: boolean = true
    ): void {
        const newTakeBackCount =
            this.engine.getMoveHistory().length - 1 - moveIndex;

        if (
            moveIndex < 0 ||
            newTakeBackCount === this._currentTakeBackCount ||
            moveIndex > this.engine.getMoveHistory().length
        )
            return;

        if (moveIndex !== this.engine.getMoveHistory().length - 1)
            this.board.lock(true);

        const snapshotMove = showMoveReanimation
            ? this.engine.getMoveHistory()[moveIndex]
            : null;
        let snapshot =
            this.engine.getBoardHistory()[
                moveIndex +
                    (snapshotMove && snapshotMove.type === MoveType.Promote
                        ? 1
                        : 0)
            ];
        this.board.removePieces();
        this.board.removeEffectFromAllSquares();
        this.board.createPieces(snapshot.board);

        if (snapshotMove && snapshotMove.type !== MoveType.Promote) {
            this.board.playMove(
                snapshotMove.from,
                snapshotMove.to,
                snapshotMove.type!
            );
            snapshot =
                this.engine.getBoardHistory()[
                    moveIndex == 0 ? 0 : moveIndex + 1
                ];
        } else if (!showMoveReanimation) {
            const lastMove = this.engine.getMoveHistory()[moveIndex - 1];
            if (lastMove) {
                this.board.addSquareEffects(lastMove.from, SquareEffect.From);
                this.board.addSquareEffects(lastMove.to, SquareEffect.To);
            }
        }

        this.board.showStatus(snapshot.gameStatus!);
        this._currentTakeBackCount = newTakeBackCount;
    }

    /**
     * This function returns the game as fen notation.
     */
    public finishTurn(): void {
        const gameStatus = this.engine.getGameStatus();
        this.board.showStatus(gameStatus);

        if (
            [
                GameStatus.BlackVictory,
                GameStatus.WhiteVictory,
                GameStatus.Draw,
            ].includes(gameStatus)
        ) {
            this.logger.save("Game updated in cache after move");
            Store.clear(StoreKey.LastBoard);
            this.terminateBotIfExist();
            this.logger.save("Game over");
            if (this._gameTimeMonitorIntervalId !== -1)
                clearInterval(this._gameTimeMonitorIntervalId);
            document.dispatchEvent(new Event(ChessEvent.onGameOver));
            return;
        }

        this._selectedSquare = this.board.isPromotionMenuShown()
            ? this._selectedSquare
            : null;
        if (!this.board.isPromotionMenuShown()) {
            this.board.setTurnColor(this.engine.getTurnColor());
            this.playBotIfExist();
            this.playPreMoveIfExist();
            this.logger.save("Game updated in cache after move");
            Store.save(
                StoreKey.LastBoard,
                this.engine.getGameAsJsonNotation()
            );
        }
    }

    /**
     * Get scores of the given board.
     */
    public getScores(ignoreTakeBack: boolean = true): Scores {
        const isFirst = this.engine.getMoveHistory().length == 0;
        if (ignoreTakeBack || this._currentTakeBackCount == 0 || isFirst)
            return this.engine.getScores();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ].scores!;
    }

    /**
     * Get the turn color of current board.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getTurnColor(ignoreTakeBack: boolean = true): Color {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getTurnColor();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ].turn!;
    }

    /**
     * Get the game status of the current board.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getGameStatus(ignoreTakeBack: boolean = true): GameStatus {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getGameStatus();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ].gameStatus!;
    }

    /**
     * Get algebraic notation of the current board.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getAlgebraicNotation(
        ignoreTakeBack: boolean = true
    ): ReadonlyArray<string> {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getAlgebraicNotation();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ].algebraicNotation!;
    }

    /**
     * Get the move history of the current board.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getMoveHistory(ignoreTakeBack: boolean = true): ReadonlyArray<Move> {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getMoveHistory();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ].moveHistory!;
    }

    /**
     * This function returns the current game as fen notation.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getGameAsFenNotation(ignoreTakeBack: boolean = true): string {
        const isFirst = this.engine.getMoveHistory().length == 0;
        if (ignoreTakeBack || this._currentTakeBackCount == 0 || isFirst)
            return this.engine.getGameAsFenNotation();

        return Converter.jsonToFen(
            this.engine.getBoardHistory()[
                this.engine.getMoveHistory().length - this._currentTakeBackCount
            ]
        );
    }

    /**
     * This function returns the current game as json notation.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getGameAsJsonNotation(ignoreTakeBack: boolean = true): JsonNotation {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getGameAsJsonNotation();

        return this.engine.getBoardHistory()[
            this.engine.getMoveHistory().length - this._currentTakeBackCount
        ];
    }

    /**
     * This function returns the current game as ascii notation.
     *
     * @param {boolean} ignoreTakeBack If it is true then it will ignore
     * the current take back count and return the turn color of the latest
     * board. If it is false then it will return the turn color of the taken
     * back board.
     */
    public getGameAsAscii(ignoreTakeBack: boolean = true): string {
        if (ignoreTakeBack || this._currentTakeBackCount == 0)
            return this.engine.getGameAsAscii();

        return Converter.jsonToASCII(
            this.engine.getBoardHistory()[
                this.engine.getMoveHistory().length - this._currentTakeBackCount
            ]
        );
    }

    /**
     * Get initial durations of the players.
     */
    public getDurations(): Durations | null {
        return this.engine.getDurations();
    }

    /**
     * This function returns the remaining time of the players
     * in milliseconds.
     */
    public getPlayersRemainingTime(): RemainingTimes {
        return this.engine.getPlayersRemainingTime();
    }

    /**
     * This function returns the board history of the game.
     * After every move, the board is saved.
     */
    public getBoardHistory(): ReadonlyArray<JsonNotation> {
        return this.engine.getBoardHistory();
    }
}
