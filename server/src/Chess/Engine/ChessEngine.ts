/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess
 * game(does not include board or other ui components).
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import {
    CastlingSide,
    CastlingType,
    Color,
    Durations,
    GameStatus,
    JsonNotation,
    Move,
    Moves,
    MoveType,
    PieceType,
    RemainingTimes,
    Scores,
    Square,
    StartPosition,
} from "../Types";
import { Timer } from "./Utils/Timer.ts";
import { NotationSymbol, Piece } from "./Types";
import { MoveEngine } from "./Move/MoveEngine.ts";
import { BoardManager } from "./Board/BoardManager.ts";
import { Converter } from "../Utils/Converter";
import { BoardQuerier } from "./Board/BoardQuerier.ts";
import { Locator } from "./Move/Utils/Locator.ts";
import { Flattener } from "./Move/Utils/Flattener.ts";

/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine {
    private readonly moveEngine: MoveEngine = new MoveEngine();
    private readonly boardManager: BoardManager = new BoardManager();

    private playedFrom: Square | null = null;
    private playedTo: Square | null = null;
    private moveType: MoveType | null = null;
    private moveNotation: string = "";
    private currentMoves: { [key in Square]?: Moves | null } = {};
    private timerMap: Record<
        Color,
        { intervalId: number | undefined; timer: Timer }
    > | null = null;

    private _isPromoteWaiting: boolean = false;
    private _isBoardPlayable: boolean = false;
    private _threefoldRepetitionHistory: Array<string> = [];

    public readonly logger: { save: ( log: string ) => void} | null = null;

    /**
     * Constructor of the ChessEngine
     * @param logger - Optional logging function to handle log messages.
     * If provided, it is wrapped in a save method to facilitate log saving.
     */
    constructor(logger: (( log: string ) => void) | null = null) {
        if(logger) this.logger = { save: (log: string) => { logger(log) }};
    }

    /**
     * This function creates a new game that can be played by two players.
     *
     * @param {JsonNotation|StartPosition|string} position The position of the game.
     *
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(
        position: JsonNotation | StartPosition | string = StartPosition.Standard
    ): void {
        this.clearProperties();
        this.boardManager.createBoard(
            typeof position !== "string"
                ? position
                : Converter.fenToJson(position)
        );
        this.checkGameStatus();
        this.createTimersIfGiven();
        if (this.getBoardHistory().length === 0) this.boardManager.saveCurrentBoard();
        this.logger?.save("Game is created");
    }

    /**
     * This function creates a new piece with the given color, type and square.
     */
    public createPiece(color: Color, type: PieceType, square: Square): void {
        this.boardManager.createPiece(color, type, square);
        this.checkGameStatus();
    }

    /**
     * This function removes the piece on the given square.
     */
    public removePiece(square: Square): void {
        this.boardManager.removePiece(square);
        this.checkGameStatus();
    }

    /**
     * Set the game status to the given status.
     */
    public setGameStatus(gameStatus: GameStatus): void {
        this.boardManager.setGameStatus(gameStatus);
    }

    /**
     * This function returns the current game as fen notation.
     */
    public getGameAsFenNotation(): string {
        return Converter.jsonToFen(BoardQuerier.getGame());
    }

    /**
     * This function returns the current game as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation {
        return BoardQuerier.getGame();
    }

    /**
     * This function returns the current game as ascii notation.
     */
    public getGameAsAscii(): string {
        return Converter.jsonToASCII(BoardQuerier.getGame());
    }

    /**
     * Get initial durations of the players.
     */
    public getDurations(): Durations | null {
        return BoardQuerier.getDurations();
    }

    /**
     * This function returns the remaining time of the players
     * in milliseconds.
     */
    public getPlayersRemainingTime(): RemainingTimes {
        if (!BoardQuerier.getDurations())
            throw new DurationsAreNotSet("Durations are not set");

        if (!this.timerMap) throw new TimerNotAvailableError("Timers are not available");

        return {
            [Color.White]: this.timerMap.White.timer.get(),
            [Color.Black]: this.timerMap.Black.timer.get(),
        };
    }

    /**
     * This function turn properties to their default values.
     */
    private clearProperties(): void {
        this.destroyTimersIfExist();
        this.boardManager.setGameStatus(GameStatus.NotReady);
        this.playedFrom = null;
        this.playedTo = null;
        this.moveType = null;
        this.moveNotation = "";
        this.currentMoves = {};
        this._isPromoteWaiting = false;
        this._isBoardPlayable = false;
        this._threefoldRepetitionHistory = [];
        this.logger?.save(
            "Game properties set to default on ChessEngine, timers and bot are destroyed if they are created"
        );
    }

    /**
     * Create timer for the players if the durations are set.
     */
    private createTimersIfGiven(): void {
        const durations = BoardQuerier.getDurations();
        if (!durations) return;

        this.timerMap = {
            [Color.White]: {
                timer: new Timer(
                    durations[Color.White].remaining,
                    durations[Color.White].increment
                ),
                intervalId: undefined,
            },
            [Color.Black]: {
                timer: new Timer(
                    durations[Color.Black].remaining,
                    durations[Color.Black].increment
                ),
                intervalId: undefined,
            },
        };

        this.updateTimersIfExists();
        this.logger?.save(
            "Timers are created and updated according to the turn color"
        );
    }

    /**
     * Stop and destroy the timers if they are created.
     */
    private destroyTimersIfExist(): void {
        if (!this.timerMap) return;

        this.timerMap.White.timer.destroy();
        this.timerMap.Black.timer.destroy();

        if (this.timerMap.White.intervalId)
            clearInterval(this.timerMap.White.intervalId);
        if (this.timerMap.Black.intervalId)
            clearInterval(this.timerMap.Black.intervalId);

        this.timerMap = null;
        this.logger?.save("White and Black timers are destroyed");
    }

    /**
     * This function checks and find the given move.
     * @param {Square} from The square of the piece that will be moved.
     * @param {Square} to The target square of the piece.
     * @example checkAndFindMove(Square.e2, Square.e4) // Returns MoveType.Normal
     * @example checkAndFindMove(Square.e1, Square.g1) // Returns MoveType.Castling
     * @example checkAndFindMove(Square.e7, Square.e8) // Returns MoveType.Promotion
     */
    public checkAndFindMoveType(from: Square, to: Square): MoveType | null {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if (!Object.hasOwn(this.currentMoves, from)) {
            this.logger?.save(
                "Move type is not found because there is no selected square"
            );
            return null;
        }

        // Find the given move in the currentMoves.
        for (const moveType in this.currentMoves[from]) {
            if (!this.currentMoves[from]?.[moveType as MoveType]) continue;

            for (const move of this.currentMoves[from]![
                moveType as MoveType
            ]!) {
                if (move === to) {
                    this.logger?.save(`Move type-ts-${moveType}-te- is found`);
                    return moveType as MoveType;
                }
            }
        }

        // If the given move is not in the currentMoves, return null.
        this.logger?.save(
            `Move type is not found because the given move-ts-${
                to
            }-te- is not in the current moves-ts-${JSON.stringify(
                this.currentMoves[from]
            )}-te-`
        );
        return null;
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(
        square: Square,
        isPreCalculation: boolean = false
    ): Moves | null {
        if (isPreCalculation) {
            this.logger?.save(
                `Pre-calculation of moves of the square-ts-${square}-te- is started`
            );
            return this.moveEngine.getMoves(square, !isPreCalculation);
        }

        if (!this._isBoardPlayable || !BoardQuerier.isSquareSelectable(square)) {
            this.logger?.save(
                `Moves of the square is not found because ${
                    !this._isBoardPlayable
                        ? `board is not playable`
                        : ` square[${square}] is not selectable`
                }`
            );
            return null;
        }

        this.currentMoves[square] = Object.hasOwn(this.currentMoves, square)
            ? this.currentMoves[square]
            : this.moveEngine.getMoves(square);
        this.logger?.save(
            Object.hasOwn(this.currentMoves, square)
                ? `Moves of the square-ts-${square}-te- is found from calculated moves-ts-${JSON.stringify(
                      this.currentMoves
                  )}-te-`
                : `Moves of the square-ts-${square}-te- is calculated by move engine`
        );

        // Save the moves to the calculatedMoves.
        this.logger?.save(
            `Moves of the square is saved to calculated moves-ts-${JSON.stringify(
                this.currentMoves
            )}-te-`
        );

        // Return the moves.
        this.logger?.save("Calculation of moves of the square is finished");
        return this.currentMoves[square]!;
    }

    /**
     * This function undoes the last move by taking the last - 1 board
     * from the board history and creating the board with it.
     * @param {Color|null} undoColor Take back to the last turn
     * of the given color.
     */
    public takeBack(undoColor: Color | null = null): void {
        const turnDifference = this.getTurnColor() != undoColor ? 0 : 2;
        const movesToUndo = undoColor
            ? this.getBoardHistory().findLastIndex(
                  (board) => board.turn == undoColor
              ) - turnDifference
            : 1;
        if (movesToUndo == -1)
            throw new Error("There is no board with the given last turn");

        const lastIndex = undoColor
            ? this.getBoardHistory().length - 1 - movesToUndo
            : 1;
        this.boardManager.createBoard(
            BoardQuerier.getBoardHistory().length >
                (undoColor == Color.Black ? 2 : 1)
                ? {
                      ...BoardQuerier.getBoardHistory()
                          .slice(0, -lastIndex)
                          .pop()!,
                      boardHistory: BoardQuerier.getBoardHistory().slice(
                          0,
                          -lastIndex
                      ),
                  }
                : {
                      ...BoardQuerier.getBoardHistory().pop()!,
                      boardHistory: [],
                  }
        );
        this.updateTimersIfExists();
    }

    /**
     * This function plays the given move.
     * @param {MoveType|null} moveType The type of the move to prevent recalculation
     * if calculated before.
     */
    public playMove(from: Square, to: Square, moveType: MoveType | null = null): void {
        if (
            [
                GameStatus.NotReady,
                GameStatus.Draw,
                GameStatus.WhiteVictory,
                GameStatus.BlackVictory,
            ].includes(BoardQuerier.getBoardStatus())
        ) {
            this.logger?.save(
                "Move is not played because game is not started or game is finished."
            );
            return;
        }

        if (this.getGameStatus() == GameStatus.ReadyToStart) {
            this.boardManager.setGameStatus(GameStatus.InPlay);
            this.logger?.save(
                "Game status set to in play because game is started"
            );
        }

        if (!this.currentMoves || !Object.hasOwn(this.currentMoves, from)) {
            this.currentMoves[from] = this.getMoves(from);
            this.logger?.save(
                "Moves of the square is not calculated so calculate the moves"
            );
        }

        this.playedFrom = from!;
        this.playedTo = to!;

        if (this._isPromoteWaiting) {
            /**
             * If the given move is a promote move(not promotion),
             * then promote the piece and return. Because, promote
             * move isn't a move type and when user do a promotion
             * move then the turn doesn't change and user must
             * promote the piece from board or engine.
             * @see _doPromote function.
             */
            this._doPromote(to);
            this.moveType = MoveType.Promote;
        } else {
            if(!moveType) {
                const moveType: MoveType | null = this.checkAndFindMoveType(from, to);
                if (!moveType) throw new MoveValidationError("Move is not valid");
                this.moveType = moveType;
            } else {
                this.moveType = moveType;
            }

            switch (this.moveType) {
                case MoveType.Castling:
                    this._doCastling();
                    break;
                case MoveType.EnPassant:
                    this._doEnPassant();
                    break;
                case MoveType.Promotion:
                    this._doPromotion();
                    break;
                case MoveType.Normal:
                    this._doNormalMove(from, to, true);
                    this.logger?.save(
                        `Piece moved to target square-ts-${to}-te- on engine`
                    );
                    break;
            }
        }

        /**
         * If move is promotion move, then don't change the turn.
         * Because, user must promote the piece.
         */
        if (!this._isPromoteWaiting) this.finishTurn();
    }

    /**
     * Do the normal move.
     */
    private _doNormalMove(
        from: Square,
        to: Square,
        saveToHistory: boolean = false
    ): void {
        if (saveToHistory) {
            /**
             * Set the current move for the move history.
             * @see For more information about history, see https://en.wikipedia.org/wiki/Algebraic_notation_(chess)
             */
            const piece: Piece = BoardQuerier.getPieceOnSquare(from)!;

            // If the piece is not pawn then add the piece name to the current move.
            if (piece?.getType() != PieceType.Pawn)
                this.moveNotation += Converter.pieceTypeToPieceName(
                    piece.getType(),
                    piece.getColor()
                );

            /**
             * Check if there is another piece that can move to the target square with the same type
             * and color then add the column of the piece to the current move. For example, from is
             * knight on d3 and to is e5 normally the current move is "Ne5" but if there is another
             * knight that can go to e5 then the current move is "Nde5" for distinguish the pieces.
             *
             * Pawn and king doesn't need to distinguish and bishop can only go to the same color
             * if there is more than one bishop with the same color(this situation can be only happen
             * if the player has promoted a pawn to a bishop in general).
             * @see For more https://en.wikipedia.org/wiki/Algebraic_notation_(chess)#Disambiguating_moves
             */
            if (
                [
                    PieceType.Knight,
                    PieceType.Bishop,
                    PieceType.Rook,
                    PieceType.Queen,
                ].includes(piece!.getType())
            ) {
                const sameTypePieces: Array<Piece> =
                    BoardQuerier.getPiecesWithFilter(piece?.getColor(), [
                        piece?.getType(),
                    ]);
                if (sameTypePieces.length > 1) {
                    for (const pieceItem of sameTypePieces) {
                        const pieceItemSquare: Square =
                            BoardQuerier.getSquareOfPiece(pieceItem)!;
                        if (!Object.hasOwn(this.currentMoves, pieceItemSquare))
                            this.currentMoves[pieceItemSquare] =
                                this.moveEngine.getMoves(pieceItemSquare);

                        if (
                            from != pieceItemSquare &&
                            this.currentMoves[pieceItemSquare]?.[
                                MoveType.Normal
                            ]?.includes(to)
                        ) {
                            const onSameRow: boolean =
                                Locator.getRow(from) ==
                                Locator.getRow(pieceItemSquare);
                            const onSameColumn: boolean =
                                Locator.getColumn(from) ==
                                Locator.getColumn(pieceItemSquare);
                            if (onSameRow)
                                this.moveNotation +=
                                    Converter.squareIDToSquare(from)[0];
                            if (onSameColumn)
                                this.moveNotation +=
                                    Converter.squareIDToSquare(from)[1];
                            if (
                                !onSameRow &&
                                !onSameColumn &&
                                this.moveNotation.length == 1 &&
                                sameTypePieces.length < 3
                            )
                                this.moveNotation +=
                                    Converter.squareIDToSquare(from)[0];
                        }
                    }

                    /**
                     * Summary: This fixes a bug with incorrent ordering in moveNotation that relevant to for
                     * loop's reading board from top to bottom.
                     *
                     * Detailed:
                     * This bug occurs when there is a third same type piece(e.g., d3, h3, h7) and there is a
                     * pieces that are on the same column and row(row d3 and column h7) as the moved piece(h3)
                     * and piece(h7, row 7) on the same row's value is bigger than the moved piece's row
                     * value(h3, row 3). For example, the above code should produce bh3f5 but if produce something
                     * like b3hf5 because of this problem. This code will convert it to bh3f5.
                     */
                    const rowColumnIncorrectOrderPattern =
                        /^([rnbqRNBQ])([1-8])([a-h])$/;
                    this.moveNotation = this.moveNotation.replace(
                        rowColumnIncorrectOrderPattern,
                        "$1$3$2"
                    );
                }
            }

            // If the move kill a piece then add "x" to the current move.
            if (BoardQuerier.isSquareHasPiece(to)) {
                // If the piece is pawn then add the column of the pawn to the current move.
                if (piece?.getType() == PieceType.Pawn)
                    this.moveNotation += Converter.squareIDToSquare(from)[0];
                this.moveNotation += NotationSymbol.Capture;
            }

            // Add the target square to the current move.
            this.moveNotation += Converter.squareIDToSquare(to);
        }

        // Move the piece.
        this.boardManager.movePiece(from, to);
    }

    /**
     * Do the castling move.
     */
    private _doCastling(): void {
        /**
         * Get the castling type by measuring the distance between
         * the "from"(king) and "to"(rook). If the distance is greater
         * than 3 then it is a long castling otherwise it is a short
         * castling.
         *
         * @see For more information about castling, see https://en.wikipedia.org/wiki/Castling
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        const castlingSide: CastlingSide =
            Number(this.playedFrom) > Number(this.playedTo)
                ? CastlingSide.Long
                : CastlingSide.Short;
        this.logger?.save(`Castling type determined-ts-${castlingSide}-te- on engine`);

        // Find the target rook square if it is clicked two square left or right of the king
        // instead of the rook square itself.
        if (
            castlingSide == CastlingSide.Long &&
            Locator.getColumn(Number(this.playedTo)) !== 1
        )
            this.playedTo = (Number(this.playedTo) - 2) as Square;
        else if (
            castlingSide == CastlingSide.Short &&
            Locator.getColumn(Number(this.playedTo)) !== 8
        )
            this.playedTo = (Number(this.playedTo) + 1) as Square;

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the "from" otherwise 2 squares
         * right of the "from".
         */
        const kingNewSquare: number =
            castlingSide == CastlingSide.Long
                ? Number(this.playedFrom) - 2
                : Number(this.playedFrom) + 2;
        this._doNormalMove(this.playedFrom as Square, kingNewSquare as Square);
        this.logger?.save(
            `King moved to target square-ts-${kingNewSquare}-te- on engine`
        );

        /**
         * If the castling is long then the rook's current square
         * is 4 square left of "from" and rook's new square is
         * must be 1 square right of the kingNewSquare, if the castling
         * is short then rook's current square is 3 square right of "from"
         * and rook's new square is must be 1 square left of the kingNewSquare.
         * For example, if the castling is long and the king's current square
         * is "e1" then the rook's current square is "a1" and rook's new square
         * is "d1".
         */
        const rook: number =
            castlingSide == CastlingSide.Long
                ? Number(this.playedFrom) - 4
                : Number(this.playedFrom) + 3;
        const rookNewSquare: number =
            castlingSide == CastlingSide.Long
                ? kingNewSquare + 1
                : kingNewSquare - 1;
        this._doNormalMove(rook, rookNewSquare as Square);

        // Disable the castling.
        this.boardManager.disableCastling(
            (BoardQuerier.getTurnColor() + CastlingSide.Short) as CastlingType
        );
        this.boardManager.disableCastling(
            (BoardQuerier.getTurnColor() + CastlingSide.Long) as CastlingType
        );
        this.logger?.save(
            `Rook moved to target square and castling-ts-${castlingSide}-te- move is saved.`
        );

        // Set the current move for the move history.
        this.moveNotation +=
            castlingSide == CastlingSide.Short
                ? NotationSymbol.ShortCastling
                : NotationSymbol.LongCastling;
    }

    /**
     * Do the en passant move.
     */
    private _doEnPassant(): void {
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square);
        this.logger?.save(
            `Piece moved to target square-ts-${this.playedTo}-te- on engine`
        );

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const killedPieceSquare =
            Number(this.playedTo) +
            (BoardQuerier.getPieceOnSquare(
                this.playedTo as Square
            )?.getColor() == Color.White
                ? 8
                : -8);

        // Remove the killed piece.
        this.boardManager.removePiece(killedPieceSquare);
        this.logger?.save(
            `Captured piece by en passant move is found on square-ts-${killedPieceSquare}-te- and removed on engine`
        );

        // Set the current move for the move history.
        this.moveNotation +=
            Converter.squareIDToSquare(this.playedFrom as Square)[0] +
            NotationSymbol.Capture +
            Converter.squareIDToSquare(this.playedTo as Square);
    }

    /**
     * Do the promote move.
     */
    private _doPromotion(): void {
        // Move the pawn.
        this._doNormalMove(
            this.playedFrom as Square,
            this.playedTo as Square,
            true
        );
        this.logger?.save(
            `Piece moved to target square-ts-${this.playedTo}-te- on engine`
        );
        this._isPromoteWaiting = true;
    }

    /**
     * Do the promote move.
     * @param to The square of the selected piece, engine will simulate the promotion menu.
     * @example _doPromote(Square.e8) // Creates a queen on e8(white),
     * @example _doPromote(Square.e7) // Creates a rook on e8(white)
     * @example _doPromote(Square.e6) // Creates a bishop on e8(white)
     * @example _doPromote(Square.e5) // Creates a knight on e8(white),
     * @example _doPromote(Square.e1) // Creates a queen on e1(black),
     * @example _doPromote(Square.e2) // Creates a rook on e1(black)
     * @example _doPromote(Square.e3) // Creates a bishop on e1(black)
     * @example _doPromote(Square.e4) // Creates a knight on e1(black)
     */
    private _doPromote(to: Square): void {
        /**
         * Calculate the square that promoted piece will be created(first row for white, last row for black).
         * For example, if to is Square.d7(white rook, also square id is 12) then the first square of the row is 4.
         */
        const firstSquareOfRow: Square =
            to > 8 && to < 32
                ? to - (Locator.getRow(to) - 1) * 8
                : to > 32 && to < 57
                ? to + (8 - Locator.getRow(to)) * 8
                : to;

        // Remove the pawn.
        this.boardManager.removePiece(firstSquareOfRow);
        this.logger?.save(
            `Promoted Pawn is removed from square-ts-${to}-te- on engine`
        );

        /**
         * Get the piece by clicked square's(to) row.
         * If the clicked row is 8 or 1 then the selected piece
         * type is queen, if the clicked row is 7 or 2 then the selected
         * piece type is rook, if the clicked row is 6 or 3 then the
         * selected piece type is bishop, if the clicked row is 5 or 4
         * then the selected piece type is knight(this is engine simulation/
         * version of the promotion menu)
         *
         * (4x4) ASCII representation of the promotion menu for white(. is square, Q is queen,
         * R is rook, B is bishop, K is knight):
         * --------------
         * | .  .  Q  . | 8
         * | .  .  R  . | 7
         * | .  .  B  . | 6
         * | .  .  K  . | 5
         * | .  .  .  . | 4
         * --------------
         *   a  b  c  d
         *
         * @see For more information about promotion, see https://en.wikipedia.org/wiki/Promotion_(chess)
         * @see For more information about promotion menu, see showPromotionMenu() src/Chess/Board/ChessBoard.ts
         */
        const clickedRow: number = Locator.getRow(to);
        const selectedPromote: PieceType = (([8, 1].includes(clickedRow)
            ? PieceType.Queen
            : null) ||
            ([7, 2].includes(clickedRow) ? PieceType.Rook : null) ||
            ([6, 3].includes(clickedRow) ? PieceType.Bishop : null) ||
            ([5, 4].includes(clickedRow) ? PieceType.Knight : null))!;
        this.logger?.save(
            `Promoted piece type-ts-${selectedPromote}-te- is determined by clicked row-ts-${clickedRow}-te- on engine`
        );

        // Get the player's color.
        const playerColor: Color = BoardQuerier.getTurnColor();

        // Create the new piece and increase the score of the player.
        this.boardManager.createPiece(
            playerColor,
            selectedPromote as PieceType,
            firstSquareOfRow
        );
        this.boardManager.updateScores(firstSquareOfRow);
        this.logger?.save(
            `Player's-ts-${playerColor}-te- Piece-ts-${selectedPromote}-te- created on square-ts-${to}-te- on engine`
        );

        // Finish the promotion.
        this._isPromoteWaiting = false;
        this.logger?.save("Promotion is finished on engine");

        // Set the current move for the move history.
        this.moveNotation +=
            NotationSymbol.Promotion +
            Converter.pieceTypeToPieceName(
                selectedPromote as PieceType,
                playerColor
            );
    }

    /**
     * End the turn with some controls and check the game is finished or not.
     */
    private finishTurn(): void {
        // Order of the operations is important.

        // Disable board and clear the calculated moves.
        // and check the game is finished(if game is finished here
        // then it must be a timeover).
        this.currentMoves = {};
        this._isBoardPlayable = false;
        if (
            [
                GameStatus.WhiteVictory,
                GameStatus.BlackVictory,
                GameStatus.Draw,
            ].includes(BoardQuerier.getBoardStatus())
        ) {
            // Timeover situation comes here.
            this.boardManager.saveAlgebraicNotation(this.moveNotation);
            this.boardManager.saveMove(this.playedFrom as Square, this.playedTo as Square);
            this.logger?.save(
                `Turn-ts-${BoardQuerier.getTurnColor()}-te- is finished`
            );
            return;
        }

        this.boardManager.saveMove(this.playedFrom!, this.playedTo!, this.moveType);
        this.boardManager.changeTurn();

        this.checkEnPassant();
        this.checkGameStatus();
        this.boardManager.saveAlgebraicNotation(this.moveNotation);
        this.checkCastling();

        // Game might be playing without timers
        if (this.timerMap) this.updateTimersIfExists();

        // Clear the move notation for the next turn.
        this.moveNotation = "";
        this.boardManager.saveCurrentBoard();
        this.logger?.save(
            `Turn controls done. Turn-ts-${BoardQuerier.getTurnColor()}-te- is finished`
        );
    }

    /**
     * Update the timers of the players if they are created. Start the timer
     * of the player and pause the timer of the opponent. If the player's time
     * is over then handle the timeover situation.
     */
    private updateTimersIfExists(): void {
        if (!this.timerMap) return;

        if (BoardQuerier.getMoveCount() < 2) {
            this.logger?.save(
                "Timers are not handled because move count is less than 2"
            );
            return;
        }

        const playerColor: Color = BoardQuerier.getTurnColor();
        const opponentColor: Color = BoardQuerier.getOpponentColor();

        if (this.timerMap[opponentColor].timer.isStarted()) {
            this.timerMap[opponentColor].timer.increase();
            this.timerMap[opponentColor].timer.pause();
            if (this.timerMap[opponentColor].intervalId)
                clearInterval(this.timerMap[opponentColor].intervalId);
        }

        if (this.timerMap[playerColor].intervalId)
            clearInterval(this.timerMap![playerColor].intervalId);

        if (
            this.timerMap[playerColor].timer.isPaused() ||
            !this.timerMap[playerColor].timer.isStarted()
        )
            this.timerMap[playerColor].timer.start();
        const intervalId = setInterval(() => {
            if (!this.timerMap) return;

            this.boardManager.updateRemainingTime(
                playerColor,
                this.timerMap[playerColor].timer.get()
            );
            if (this.timerMap[playerColor].timer.get() <= 0)
                this.handleTimeover();
        }, 100) as unknown as number;

        this.timerMap![playerColor].intervalId = intervalId;
        this.logger?.save(
            `Timers are handled. Player-ts-${playerColor}-te- timer is started and opponent-ts-${opponentColor}-te- timer is paused`
        );
    }

    /**
     * Handle the timeover situation. Destroys the timers and
     * set the game status to the opponent's victory then
     * finish the turn.
     */
    private handleTimeover(): void {
        this.destroyTimersIfExist();

        if (
            [
                GameStatus.WhiteVictory,
                GameStatus.BlackVictory,
                GameStatus.Draw,
            ].includes(BoardQuerier.getBoardStatus())
        )
            return;

        const winner =
            BoardQuerier.getOpponentColor() == Color.White
                ? GameStatus.WhiteVictory
                : GameStatus.BlackVictory;
        this.boardManager.setGameStatus(winner);

        this.logger?.save(
            `Player-ts-${BoardQuerier.getTurnColor()}-te- is timeover and game status is set to ${winner}`
        );
        this.finishTurn();
    }

    /**
     * Get possible en passant moves of enemy and
     * add/update them in the fen notation.
     * @see for more information about en passant https://en.wikipedia.org/wiki/En_passant
     */
    private checkEnPassant(): void {
        if(BoardQuerier.getEnPassant() !== null){
            this.boardManager.setEnPassant(null);
            this.logger?.save("undone en passant move removed from fen notation");
        }

        const moveHistoryLength = BoardQuerier.getMoveHistory().length;
        if(moveHistoryLength < 1) {
            this.logger?.save("Not enough moves for possible en passant move");
            return;
        }

        const lastMove = BoardQuerier.getMoveHistory()[moveHistoryLength - 1];
        const lastMovedPiece = BoardQuerier.getPieceOnSquare(lastMove.to);
        if(!lastMovedPiece || lastMovedPiece.getType() !== PieceType.Pawn
        || Math.abs(lastMove.to - lastMove.from) !== 16){
            this.boardManager.setEnPassant(null);
            this.logger?.save("En passant move chance is not found");
            return;
        }

        const lastMovedPawnColor = lastMovedPiece.getColor();
        if(Locator.getRow(lastMove.to) === (lastMovedPawnColor === Color.White ? 5 : 4)){
            const rightSquare = BoardQuerier.getPieceOnSquare(lastMove.to + 1);
            const leftSquare = BoardQuerier.getPieceOnSquare(lastMove.to - 1);
            if((rightSquare && rightSquare.getType() === PieceType.Pawn && rightSquare.getColor() !== lastMovedPawnColor)
            || (leftSquare && leftSquare.getType() === PieceType.Pawn && leftSquare.getColor() !== lastMovedPawnColor)){
                const enPassantMove = lastMove.to + (lastMovedPawnColor === Color.White ? 8 : -8);
                this.boardManager.setEnPassant(enPassantMove);
                this.logger?.save(`En passant move-ts-${enPassantMove}-te- is found and set on fen notation`);
                return;
            }
        }
    }

    /**
     * This function calculate the game is finished or not and set the status of the game.
     *
     * @see For more information about game status types please check the src/Chess/Types/index.ts
     */
    private checkGameStatus(): void {
        if (
            [
                GameStatus.WhiteVictory,
                GameStatus.BlackVictory,
                GameStatus.Draw,
            ].includes(BoardQuerier.getBoardStatus())
        )
            return;

        /**
         * First, check the board is on the standard position because if the board is on the
         * standard position then continue is unnecessary.
         */
        if (
            Converter.jsonToFen(BoardQuerier.getGame()) ==
            StartPosition.Standard
        ) {
            this.logger?.save(
                "Game status will not be checked because board is the standard position."
            );
            this.boardManager.setGameStatus(GameStatus.ReadyToStart);
            this._isBoardPlayable = true;
            return;
        }

        /**
         * Set game status to not ready if there is a pawn on the promotion row at the
         * start of the game.
         */
        if (this.getMoveHistory().length == 0) {
            const whitePawnOnPromotionRow = [1, 2, 3, 4, 5, 6, 7, 8].filter(
                (square) =>
                    BoardQuerier.isSquareHasPiece(
                        square,
                        Color.White,
                        PieceType.Pawn
                    )
            );
            const blackPawnOnPromotionRow = [
                57, 58, 59, 60, 61, 62, 63, 64,
            ].filter((square) =>
                BoardQuerier.isSquareHasPiece(
                    square,
                    Color.Black,
                    PieceType.Pawn
                )
            );
            if (
                whitePawnOnPromotionRow.length > 0 ||
                blackPawnOnPromotionRow.length > 0
            ) {
                this.logger?.save(
                    "Game status set to not ready because there is a pawn on the promotion row."
                );
                this.boardManager.setGameStatus(GameStatus.NotReady);
                this._isBoardPlayable = false;
                return;
            }
        }

        /**
         * If board is not on the standard position then check the board is playable or not.
         * If the board is not ready to play then continue is unnecessary.
         */
        this._isBoardPlayable = BoardQuerier.isBoardPlayable();
        if (this._isBoardPlayable) {
            this.boardManager.setGameStatus(
                BoardQuerier.getBoardStatus() != GameStatus.NotReady
                    ? BoardQuerier.getBoardStatus()
                    : GameStatus.ReadyToStart
            );
            this.logger?.save(
                `Game status set to-ts-${BoardQuerier.getBoardStatus()}-te- because board is playable.`
            );
        } else {
            this.boardManager.setGameStatus(
                [
                    GameStatus.InPlay,
                    GameStatus.WhiteInCheck,
                    GameStatus.BlackInCheck,
                ].includes(BoardQuerier.getBoardStatus())
                    ? GameStatus.Draw
                    : GameStatus.NotReady
            );
            this._isBoardPlayable = false;
            this.logger?.save(
                `Game status is not checked because board is not playable so checkGameStatus calculation is unnecessary.`
            );
            return;
        }

        /**
         * Before the checking checkmate and stalemate status, check the threefold repetition and fifty
         * move rule and if any of them is satisfied then the game will be in draw status so continue is
         * unnecessary.
         */
        this._checkFiftyMoveRule();
        this._checkThreefoldRepetition();
        if (BoardQuerier.getBoardStatus() == GameStatus.Draw) return;

        /**
         * Start the continue to check, checkmate, stalemate and check status by
         * finding necessary squares and enums.
         */
        const kingSquare: Square | null = BoardQuerier.getSquareOfPiece(
            BoardQuerier.getPiecesWithFilter(BoardQuerier.getTurnColor(), [
                PieceType.King,
            ])[0]!
        );
        const threateningSquares: Square[] = BoardQuerier.isSquareThreatened(
            kingSquare!,
            BoardQuerier.getOpponentColor(),
            true
        ) as Square[];
        this.logger?.save(
            `Threatening squares-ts-${JSON.stringify(
                threateningSquares
            )}-te- are found by king's square-ts-${kingSquare}-te-`
        );

        const checkEnum: GameStatus =
            BoardQuerier.getTurnColor() == Color.White
                ? GameStatus.WhiteInCheck
                : GameStatus.BlackInCheck;
        const checkmateEnum: GameStatus =
            BoardQuerier.getTurnColor() == Color.White
                ? GameStatus.BlackVictory
                : GameStatus.WhiteVictory;
        this.logger?.save(
            `Check-ts-${checkEnum}-te- and Checkmate-ts-${checkmateEnum}-te- enums are found by player's color-ts-${BoardQuerier.getTurnColor()}-te-`
        );

        /**
         * If the king is threatened then the game is in check status. If game
         * is in check status then continue to check the game is in checkmate
         * status or not. If the king is not threatened then the game is in
         * play status and continue to check the game is in stalemate
         * status or not.
         *
         * @see For more information about check please check the https://en.wikipedia.org/wiki/Check_(chess)
         */
        if (threateningSquares.length > 0) this.boardManager.setGameStatus(checkEnum);
        else if (
            [
                GameStatus.InPlay,
                GameStatus.WhiteInCheck,
                GameStatus.BlackInCheck,
            ].includes(this.getGameStatus())
        )
            this.boardManager.setGameStatus(GameStatus.InPlay);

        // Calculate the moves of the king and save the moves to the calculatedMoves.
        let movesOfKing: Moves | null = this.moveEngine.getMoves(kingSquare!)!;
        movesOfKing = movesOfKing ?? { Normal: [] };
        this.currentMoves[kingSquare!] = movesOfKing;
        this.logger?.save(
            `Moves of the king-ts-${kingSquare}-te- are calculated and saved to calculated moves-ts-${JSON.stringify(
                movesOfKing
            )}-te-`
        );

        // Check the checkmate and stalemate status.
        if (movesOfKing[MoveType.Normal]!.length == 0) {
            if (
                threateningSquares.length > 1 &&
                BoardQuerier.getBoardStatus() == checkEnum
            ) {
                /**
                 * Control Checkmate by Double Check
                 *
                 * Double check is a special case of checkmate. If the king is threatened by more than one piece
                 * then none of the pieces can be blocked the enemies moves. The king must move to
                 * escape check. If the king has no moves then the game is in checkmate status.
                 *
                 * @see For more information about check mate please check the https://en.wikipedia.org/wiki/Checkmate
                 */
                this.boardManager.setGameStatus(checkmateEnum);
                this.logger?.save(
                    "Game status set to checkmate because king has no moves and threatened by more than one piece(double check)"
                );
            } else {
                let isAnyMoveFound: boolean = false;

                /**
                 * Control Stalemate and Checkmate
                 *
                 * @see For more information about stalemate please check the https://en.wikipedia.org/wiki/Stalemate
                 * @see For more information about check mate please check the https://en.wikipedia.org/wiki/Checkmate
                 */
                for (const piece of BoardQuerier.getPiecesWithFilter(
                    BoardQuerier.getTurnColor()
                )) {
                    // King's moves are already calculated so skip the king.
                    if (piece.getType() == PieceType.King) continue;

                    // Calculate the moves of the piece and get squares of the moves. Also save the moves to the currentMoves for prevent unnecessary calculations.
                    const square: Square =
                        BoardQuerier.getSquareOfPiece(piece)!;
                    this.currentMoves[square] =
                        this.moveEngine.getMoves(square);
                    const moves: Square[] = Flattener.flattenSquares(
                        this.currentMoves[square]!
                    );

                    // If piece has at least one move then the game is in play status.
                    if (moves.length > 0) {
                        this.logger?.save(
                            "Doubly Check and Stalemate is not satisfied."
                        );
                        isAnyMoveFound = true;
                        break;
                    }
                }

                /**
                 * If the piece has no moves and game is in check status then the game is in checkmate status,
                 * if game is not in check status but no moves found then the game is in stalemate status.
                 */
                if (!isAnyMoveFound) {
                    if (BoardQuerier.getBoardStatus() != checkEnum) {
                        this.boardManager.setGameStatus(GameStatus.Draw);
                        this.logger?.save(
                            "Game status set to draw because king and any other pieces have no moves(stalemate)"
                        );
                    } else {
                        this.boardManager.setGameStatus(checkmateEnum);
                        this.logger?.save(
                            "Game status is set to checkmate because king has no moves and threat can't be blocked or killed by player's pieces."
                        );
                    }
                }
            }
        }

        if (BoardQuerier.getBoardStatus() === checkmateEnum)
            this.moveNotation += NotationSymbol.Checkmate;
        else if (
            BoardQuerier.getBoardStatus() === checkEnum &&
            this.moveNotation !== ""
        )
            this.moveNotation += NotationSymbol.Check;
    }

    /**
     * Check the game is finished or not by threefold repetition rule.
     */
    private _checkThreefoldRepetition(): void {
        /**
         * Get the notation of the game and check the notation is
         * repeated 3 times or not. If the notation is repeated 3
         * times then the game is in draw status.
         *
         * @see For more information about threefold repetition rule, see https://en.wikipedia.org/wiki/Threefold_repetition
         */
        this._threefoldRepetitionHistory.push(
            this.getGameAsFenNotation().split(" ")[0]
        );
        if (this._threefoldRepetitionHistory.length > 15)
            this._threefoldRepetitionHistory.shift();

        const notations: Array<string> = BoardQuerier.getAlgebraicNotation()
            .slice(-14)
            .concat(this.moveNotation);
        const currentBoard: string = this.getGameAsFenNotation().split(" ")[0];
        if (
            notations.filter((notation) => notation == this.moveNotation)
                .length > 2 &&
            this._threefoldRepetitionHistory.filter(
                (notation) => notation == currentBoard
            ).length > 2
        ) {
            // When the threefold repetition rule is satisfied then set the game status to draw.
            this.boardManager.setGameStatus(GameStatus.Draw);
            this.moveNotation = NotationSymbol.Draw;
            this.logger?.save(
                "Game status set to draw by threefold repetition rule"
            );
        }

        this.logger?.save("Threefold repetition rule is not satisfied.");
    }

    /**
     * Check the game is finished or not by fifty move rule.
     * @see For more information about half move count, see https://en.wikipedia.org/wiki/Fifty-move_rule
     */
    private _checkFiftyMoveRule(): void {
        if (BoardQuerier.getHalfMoveCount() > 101) {
            this.boardManager.setGameStatus(GameStatus.Draw);
            this.moveNotation = NotationSymbol.Draw;
            this.logger?.save("Game status set to draw by half move count");
            return;
        }
    }

    /**
     * Check the castling moves of the players and
     * update them in the fen notation.
     * @see For more information about castling, see https://en.wikipedia.org/wiki/Castling
     */
    private checkCastling(): void {
        if (
            ![
                GameStatus.InPlay,
                GameStatus.WhiteInCheck,
                GameStatus.BlackInCheck,
            ].includes(BoardQuerier.getBoardStatus())
        ) {
            this.logger?.save(
                "Castling moves are not checked because game is not playable"
            );
            return;
        }

        const color =
            BoardQuerier.getTurnColor() == Color.White
                ? Color.Black
                : Color.White;
        const shortCastling: CastlingType = (color +
            CastlingSide.Short) as CastlingType;
        const longCastling: CastlingType = (color +
            CastlingSide.Long) as CastlingType;
        if (
            !BoardQuerier.getCastling()[shortCastling] &&
            !BoardQuerier.getCastling()[longCastling]
        ) {
            this.logger?.save(`Castling moves-ts-${BoardQuerier.getCastling()}-te- are already disabled`);
            return;
        }

        const kingSquare = color == Color.White ? Square.e1 : Square.e8;
        const kingPiece = BoardQuerier.getPieceOnSquare(kingSquare);
        if (!kingPiece) {
            this.boardManager.disableCastling(shortCastling);
            this.boardManager.disableCastling(longCastling);
            this.logger?.save(
                `King-ts-${kingSquare}-te- is not it's starting square so castling moves are disabled`
            );
            return;
        }

        const longRookSquare = color == Color.White ? Square.a1 : Square.a8;
        const shortRookSquare = color == Color.White ? Square.h1 : Square.h8;
        const longRookPiece = BoardQuerier.getPieceOnSquare(longRookSquare);
        const shortRookPiece = BoardQuerier.getPieceOnSquare(shortRookSquare);
        if (!longRookPiece) {
            this.boardManager.disableCastling(longCastling);
            this.logger?.save(
                `Long rook-ts-${longCastling}-te- is not it's starting square so long castling move is disabled`
            );
        }
        if (!shortRookPiece) {
            this.boardManager.disableCastling(shortCastling);
            this.logger?.save(
                `Short rook-ts-${shortCastling}-te- is not it's starting square so short castling move is disabled`
            );
        }
    }

    /**
     * Get color of current turn.
     */
    public getTurnColor(): Color {
        return BoardQuerier.getTurnColor();
    }

    /**
     * This function returns the status of board.
     */
    public getGameStatus(): GameStatus {
        return BoardQuerier.getBoardStatus();
    }

    /**
     * This function returns the algebraic notation of the game.
     */
    public getAlgebraicNotation(): ReadonlyArray<string> {
        return BoardQuerier.getAlgebraicNotation();
    }

    /**
     * This function returns the move history of the game.
     */
    public getMoveHistory(): ReadonlyArray<Move> {
        return BoardQuerier.getMoveHistory();
    }

    /**
     * This function returns the board history of the game.
     * After every move, the board is saved.
     */
    public getBoardHistory(): ReadonlyArray<JsonNotation> {
        return BoardQuerier.getBoardHistory();
    }

    /**
     * This function returns the scores of the players.
     */
    public getScores(): Readonly<Scores> {
        return BoardQuerier.getScores();
    }
}

/**
 * MoveValidationError class is used when the given
 * move is not valid.
 */
export class MoveValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "MoveValidationError";
    }
}

/**
 * TimerNotAvailableError class is used when the timer
 * is not available(anymore) for the game.
 */
export class TimerNotAvailableError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "TimerNotAvailableError";
    }
}

/**
 * TimerNotAvailableError class is used when the timer
 * is not available(anymore) for the game.
 */
export class DurationsAreNotSet extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DurationsAreNotSet";
    }
}
