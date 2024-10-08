/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { JsonNotation, PieceType, Square, Color, StartPosition, ChessEvent, GameStatus, Durations, Move } from "./Types";
import { ChessEngine, MoveValidationError } from "./Engine/ChessEngine";
import { ChessBoard } from "./Board/ChessBoard";
import { SquareClickMode, SquareEffect } from "./Board/Types";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage.ts";
import { Converter } from "./Utils/Converter.ts";
import { Logger } from "@Services/Logger.ts";
import { Bot, BotColor, BotDifficulty } from "./Bot";

/**
 * This class provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard. Also,
 * it uses LocalStorage which provides users to save the game to the cache and load the game from the cache and Logger
 * which provides users to log the game.
 */
export class Chess {

    /**
     * Properties of the Chess class.
     */
    public readonly engine: ChessEngine = new ChessEngine();
    public readonly board: ChessBoard = new ChessBoard();

    private _bot: Bot | null = null;
    private _lastCreatedBotSettings: { botColor: Color, botDifficulty: number } | null = null;
    private _selectedSquare: Square | null = null;
    private _isPromotionScreenOpen: boolean = false;
    private _preSelectedSquare: Square | null = null;
    private _preMove: { from: Square, to: Square } | null = null;
    private _currentTakeBackCount: number = 0;
    private _isGameOver: boolean = false;

    public readonly logger: Logger = new Logger("src/Chess/Chess.ts");

    /**
     * Constructor of the Chess class.
     */
    constructor() {
        this.logger.save("Chess class initialized");
        this.checkAndLoadGameFromCache();
    }

    /**
     * This function resets the properties of the Chess class.
     */
    private resetProperties(): void {
        this._selectedSquare = null;
        this._isGameOver = false;
        this._lastCreatedBotSettings = null;
        this._isPromotionScreenOpen = false;
        this._preSelectedSquare = null;
        this._preMove = null;
        this._currentTakeBackCount = 0;
        this.terminateBotIfExist();
        this.logger.save("Properties reset");
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check src/Services/LocalStorage.ts
     */
    public checkAndLoadGameFromCache(): void {
        // If there is a game in the cache, load it.
        if (LocalStorage.isExist(LocalStorageKey.LastBoard)) {
            this.logger.save("Game loading from cache...");
            this.createGame(LocalStorage.load(LocalStorageKey.LastBoard));
            if (LocalStorage.isExist(LocalStorageKey.LastBot)) {
                const { color, difficulty } = LocalStorage.load(LocalStorageKey.LastBot);
                this.addBotToCurrentGame(color, difficulty);
                this.logger.save(`Bot[${JSON.stringify({ color, difficulty })}] found in cache and added to the game`);
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
     * If "position" is JsonNotation and includes "durations" but also "durations" parameter 
     * is given then "durations" in theJsonNotation will be OVERRIDEN by the "durations" 
     * parameter. If position is string/fen/StartPosition then it will be converted to 
     * JsonNotation and if "durations" parameter is given then "durations" will be ADDED 
     * to the created JsonNotation that is converted from the string/fen/StartPosition.
     * 
     * @see For more information about StartPosition and JsonNotation check src/Chess/Types/index.ts
     */
    public createGame(
        position: JsonNotation | StartPosition | string = StartPosition.Standard,
        durations: Durations | null = null
    ): void {
        LocalStorage.clear(LocalStorageKey.LastBot);
        LocalStorage.clear(LocalStorageKey.LastBoard);
        this.resetProperties();
        this.logger.save("Cache cleared and properties reset before creating a new game");

        if (typeof position === "string") {
            position = Converter.fenToJson(position);
            this.logger.save(`Given position converted to json notation.`);
        }

        if (durations)
            position.durations = durations;

        this.engine.createGame(position);
        this.logger.save(`Game successfully created on ChessEngine`);

        this.board.createGame(position);
        this.board.setTurnColor(this.engine.getTurnColor());
        this.board.showStatus(this.engine.getGameStatus());

        const lastMove = this.engine.getMoveHistory()[this.engine.getMoveHistory().length - 1];
        if (lastMove) {
            this.board.addSquareEffects(lastMove.from, SquareEffect.From);
            this.board.addSquareEffects(lastMove.to, SquareEffect.To);
        }

        this.logger.save(`Game successfully created on Chessboard and status[${this.engine.getGameStatus()}] shown`);

        this.initBoardListener();
        this.initEngineListener();

        LocalStorage.save(LocalStorageKey.LastBoard, position);
        this.logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`);

        document.dispatchEvent(new Event(ChessEvent.onGameCreated));
    }

    /**
     * This function creates a new game against the bot with the 
     * given position(fen notation/string, StartPosition/string or 
     * JsonNotation).
     */
    public addBotToCurrentGame(botColor: BotColor | Color, botDifficulty: BotDifficulty): void {
        this._bot = new Bot(botColor, botDifficulty);
        this._bot.start();

        this._lastCreatedBotSettings = { botColor: this._bot.color, botDifficulty };
        this.board.disablePreSelectionFor(this._bot.color);
        this.logger.save(`Bot[${this._bot.color}] created with difficulty[${botDifficulty}]`);

        // First move
        if (botColor == this.engine.getTurnColor()) {
            this.board.lock(false);
            this.playBotIfExist();
        }

        LocalStorage.save(LocalStorageKey.LastBot, { color: this._bot.color, difficulty: botDifficulty });
        document.dispatchEvent(new CustomEvent(ChessEvent.onBotAdded, { detail: { color: this._bot.color } }));
    }

    /**
     * This function returns the bot if it exists.
     */
    public getBotSettings(): {botColor: Color, botDifficulty: number} | null {
        if(!this._bot)
            return this._lastCreatedBotSettings;

        return { botColor: this._bot.color, botDifficulty: this._bot.difficulty };
    }

    /**
     * This function terminates the bot if it exists.
     */
    private terminateBotIfExist(): void {
        if (!this._bot)
            return;

        this._bot.terminate();
        this._bot = null;
        LocalStorage.clear(LocalStorageKey.LastBot);
        this.logger.save("Bot terminated");
    }

    /**
     * Create a piece on the board and engine.
     */
    public createPiece(color: Color, pieceType: PieceType, square: Square): void {
        this.board.createPiece(color, pieceType, square);
        this.engine.createPiece(color, pieceType, square);
        this.logger.save(`Piece[${JSON.stringify({ color, pieceType, square })}] created on board and engine`);
        document.dispatchEvent(new CustomEvent(
            ChessEvent.onPieceCreated, { detail: { square: square } }
        ));
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
    }

    /**
     * Remove a piece from the board and engine.
     */
    public removePiece(square: Square): void {
        this.board.removePiece(square);
        this.engine.removePiece(square);
        this.logger.save(`Piece[${square}] removed from board and engine`);
        document.dispatchEvent(new CustomEvent(
            ChessEvent.onPieceRemoved, { detail: { square: square } }
        ));
        LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
    }

    /**
     * This function initializes the listener for user's
     * actions on chessboard to make a move on engine and board.
     */
    private initBoardListener(): void {
        this.board.bindMoveEventCallbacks({
            onPieceSelected: (squareId: Square, isPreSelected: boolean) => {
                this.handleOnPieceSelected(squareId, isPreSelected);
            },
            onPieceMoved: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPieceMoved(squareId, squareClickMode);
            },
            onPreMoveCanceled: () => {
                this._preSelectedSquare = null;
                this._preMove = null;
                this.logger.save("Pre-move canceled");
            }
        });

        this.logger.save("Moves listener initialized");
    }

    /**
     * This function initializes the listener for engine's
     * actions on chessboard to make a move on engine and board.
     */
    private initEngineListener(): void {
        const interval = setInterval(() => {
            if ([
                GameStatus.BlackVictory,
                GameStatus.WhiteVictory,
                GameStatus.Draw
            ].includes(this.engine.getGameStatus()) && !this._isGameOver) {
                clearInterval(interval);
                this.finishTurn();
                this.logger.save("Game finished because of one of the player has no more time");
            }
        }, 1000);

        this.logger.save("Engine listener initialized");
    }

    /**
     * Handle the selected piece on the board.
     */
    private handleOnPieceSelected(squareId: Square, isPreSelected: boolean): void {
        if (isPreSelected)
            this._preSelectedSquare = squareId;
        else
            this._selectedSquare = squareId;

        const selectedSquare = isPreSelected ? this._preSelectedSquare : this._selectedSquare;
        this.board.highlightMoves(
            this.engine.getMoves(
                selectedSquare!,
                isPreSelected
            ),
            isPreSelected
        );
        this.logger.save(`Piece[${squareId}] selected on the board`);
        document.dispatchEvent(new CustomEvent(ChessEvent.onPieceSelected, { detail: { square: squareId } }));
    }

    /**
     * Handle the moved piece on the board.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void {
        if ([SquareClickMode.Play,
        SquareClickMode.Promote,
        SquareClickMode.Promotion,
        SquareClickMode.Castling,
        SquareClickMode.EnPassant
        ].includes(squareClickMode)) {
            this._isPromotionScreenOpen = squareClickMode == SquareClickMode.Promotion;
            this.playMove(this._selectedSquare!, squareId);
            if (this._bot) this.board.lock(false);
            document.dispatchEvent(new CustomEvent(
                ChessEvent.onPieceMovedByPlayer, { detail: { from: this._selectedSquare!, to: squareId } }
            ));
        }
        else if ([SquareClickMode.PrePlay,
        SquareClickMode.PrePromote,
        SquareClickMode.PrePromotion,
        SquareClickMode.PreCastling,
        SquareClickMode.PreEnPassant
        ].includes(squareClickMode)) {
            this._preMove = { from: this._preSelectedSquare!, to: squareId }
            this.logger.save(`Pre-move[${JSON.stringify({ from: this._preSelectedSquare!, to: squareId })}] saved`);
            document.dispatchEvent(new CustomEvent(ChessEvent.onPieceSelected, { detail: { square: squareId } }));
        }
    }

    /**
     * Play the bot's move if it exists and it is 
     * bot's turn.
     */
    private playBotIfExist(): void {
        if (!this._bot || this.engine.getTurnColor() != this._bot.color)
            return;

        this._bot.getMove(this.engine.getGameAsFenNotation()).then((move) => {
            // If found move is promotion then move will be Move[].
            // Check _doPromote() function in ChessEngine.ts for more 
            // information.
            if (!Array.isArray(move))
                move = [move];

            move.forEach((moveObject: Move) => {
                this.playMove(moveObject.from, moveObject.to);
            });

            this.board.unlock();
        });
    }

    /**
     * Play a move on the board and engine.
     */
    public playMove(from: Square, to: Square): void {
        try {
            this.engine.playMove(from, to);
            this._preSelectedSquare = null;
        } catch (e) {
            if (!(e instanceof MoveValidationError && this._preSelectedSquare)) {
                throw e;
            }
        }

        this.board.playMove(from, to);
        setTimeout(() => {
            this.logger.save(`Move[${JSON.stringify({ from, to })}] played on board and engine`);
            this.finishTurn();
            document.dispatchEvent(new CustomEvent(ChessEvent.onPieceMoved, { detail: { from: from, to: to } }));
        }, 100);
    }

    /**
     * Play the pre-move if it exists.
     */
    private playPreMoveIfExist(): void {
        if (!this._preMove)
            return;

        const { from, to } = this._preMove;
        this._preMove = null;
        this.playMove(from, to);
        this.logger.save(`Pre-move[${JSON.stringify(this._preMove)}] played`);
        document.dispatchEvent(new CustomEvent(
            ChessEvent.onPieceMovedByPlayer, { detail: { from: from, to: to } }
        ));
    }

    /**
     * 
     */
    public takeBack(onEngine: boolean = false): void {
        const lastMove = this.engine.getMoveHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount];
        if (!lastMove)
            return;

        this.board.playMove(lastMove.to, lastMove.from, true);
        if (onEngine) {
            this.engine.playMove(lastMove.to, lastMove.from);
        } else {
            this.board.lock(true);
            this._currentTakeBackCount++;
        }
    }

    /**
     * 
     */
    public takeForward(): void {
        const lastMove = this.engine.getMoveHistory()[this.engine.getMoveHistory().length - this._currentTakeBackCount];
        if (!lastMove) {
            this.board.unlock();
            return;
        }

        this.board.playMove(lastMove.from, lastMove.to);
        this._currentTakeBackCount--;
    }

    /**
     * 
     */
    public goToSpecificMove(moveIndex: number): void {
        if (moveIndex < 0 || moveIndex >= this.engine.getMoveHistory().length)
            return;

        const newTakeBackCount = this.engine.getMoveHistory().length - 1 - moveIndex;
        this._currentTakeBackCount = newTakeBackCount;

        this.board.removePieces();
        this.board.removeEffectFromAllSquares();
        this.board.createPieces(
            Converter.fenToJson(moveIndex == 0
                ? StartPosition.Standard
                : this.engine.getFenHistory()[moveIndex - 1]
            ).board
        );

        const lastMove = this.engine.getMoveHistory()[moveIndex];
        this.board.playMove(lastMove.from, lastMove.to);
        
        // this.board.showStatus(this.engine.getGameStatus());
    }

    /**
     * This function returns the game as fen notation.
     */
    public finishTurn(): void {
        const gameStatus = this.engine.getGameStatus();
        this.board.showStatus(gameStatus);

        if ([GameStatus.BlackVictory,
        GameStatus.WhiteVictory,
        GameStatus.Draw
        ].includes(gameStatus)) {
            this.logger.save("Game updated in cache after move");
            LocalStorage.clear(LocalStorageKey.LastBoard);
            this.terminateBotIfExist();
            this.logger.save("Game over");
            document.dispatchEvent(new Event(ChessEvent.onGameOver));
            this._isGameOver = true;
            return;
        }

        this._selectedSquare = this._isPromotionScreenOpen ? this._selectedSquare : null;
        if (!this._isPromotionScreenOpen) {
            this.board.setTurnColor(this.engine.getTurnColor());
            this.playBotIfExist();
            this.playPreMoveIfExist();
            this.logger.save("Game updated in cache after move");
            LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
        }
    }
}
