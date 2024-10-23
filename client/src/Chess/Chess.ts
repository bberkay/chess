/**
 * @module Chess
 * @description This module provides users to a playable chess game on the web by connecting ChessEngine and ChessBoard with CacheManager.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { JsonNotation, PieceType, Square, Color, StartPosition, ChessEvent, GameStatus, Durations, Move, Scores, MoveType, RemainingTimes } from "./Types";
import { ChessEngine, MoveValidationError } from "./Engine/ChessEngine";
import { ChessBoard } from "./Board/ChessBoard";
import { SoundEffect, SquareClickMode, SquareEffect } from "./Board/Types";
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
    private _preMoves: {[key in Color]: Move[]} = { [Color.Black]: [], [Color.White]: [] };
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
        this._preMoves = { [Color.Black]: [], [Color.White]: [] };
        this._currentTakeBackCount = 0;
        this.terminateBotIfExist();
        this.logger.save("Properties reset");
    }

    /**
     * This function checks the cache and loads the game from the cache if there is a game in the cache.
     * @returns Returns true if there is a game in the cache, otherwise returns false.
     * @see For more information about cache management check `src/Services/LocalStorage.ts`
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
     * If `position` is JsonNotation and includes `durations` but also `durations` parameter 
     * is given then `durations` in the JsonNotation will be OVERRIDEN by the `durations` 
     * parameter. If `position` is string/fen/StartPosition then it will be converted to 
     * JsonNotation and if `durations` parameter is given then `durations` will be ADDED 
     * to the created JsonNotation that is converted from the string/fen/StartPosition.
     * 
     * @see For more information about `StartPosition` and `JsonNotation` check `src/Chess/Types/index.ts`
     */
    public createGame(
        position: JsonNotation | StartPosition | string = StartPosition.Standard,
        durations: Durations | null = null
    ): void {
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
        this.monitorGameTimeExpiration();

        LocalStorage.save(LocalStorageKey.LastBoard, this.getGameAsJsonNotation());
        this.logger.save(`Game saved to cache as json notation[${JSON.stringify(position)}]`);

        document.dispatchEvent(new Event(ChessEvent.onGameCreated));
    }

    /**
     * This function creates a new game against the bot with the 
     * given position(fen notation/string, `StartPosition/string` or 
     * `JsonNotation`).
     */
    public addBotToCurrentGame(botColor: BotColor | Color, botDifficulty: BotDifficulty): void {
        this._bot = new Bot(botColor, botDifficulty);
        this._bot.start();

        this._lastCreatedBotSettings = { botColor: this._bot.color, botDifficulty };
        this.board.disablePreSelection(this._bot.color);
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
            onPieceSelected: (squareId: Square) => {
                this.handleOnPieceSelected(squareId);
            },
            onPiecePreSelected: (squareId: Square) => {
                this.handleOnPiecePreSelected(squareId);
            },
            onPieceMoved: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPieceMoved(squareId, squareClickMode);
            },
            onPiecePreMoved: (squareId: Square, squareClickMode: SquareClickMode) => {
                this.handleOnPiecePreMoved(squareId, squareClickMode);
            },
            onPreMoveCanceled: () => {
                this._preSelectedSquare = null;
                this._preMoves[this.engine.getTurnColor() === Color.White ? Color.Black : Color.White] = [];
                this.board.closePromotionMenu();
                this.logger.save("Pre-move canceled");
            }
        });

        this.logger.save("Moves listener initialized");
    }

    /**
     * This function initializes the listener for engine's
     * actions on chessboard to make a move on engine and board.
     */
    private monitorGameTimeExpiration(): void {
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
     * Handle the selected piece on the board and engine.
     */
    private handleOnPieceSelected(squareId: Square): void {
        this._selectedSquare = squareId;
        this.board.highlightMoves(this.engine.getMoves(this._selectedSquare!));
        this.logger.save(`Piece[${squareId}] selected on the board`);
        document.dispatchEvent(new CustomEvent(ChessEvent.onPieceSelected, { detail: { square: squareId } }));
    }

    /**
     * Handle the pre-selected piece on the board and engine.
     */
    private handleOnPiecePreSelected(squareId: Square): void {
        this._preSelectedSquare = squareId;
        this.board.highlightMoves(this.engine.getMoves(this._preSelectedSquare!, true), true);
        this.logger.save(`Piece[${squareId}] pre selected on the board`);
        document.dispatchEvent(new CustomEvent(ChessEvent.onPieceSelected, { detail: { square: squareId } }));
    }

    /**
     * Handle the moved piece on the board and engine.
     */
    private handleOnPieceMoved(squareId: Square, squareClickMode: SquareClickMode): void {
        this._isPromotionScreenOpen = squareClickMode == SquareClickMode.Promotion;
        
        this.playMove(this._selectedSquare!, squareId);
        
        if (this._bot) 
            this.board.lock(false);

        document.dispatchEvent(new CustomEvent(
            ChessEvent.onPieceMovedByPlayer, { detail: { from: this._selectedSquare!, to: squareId } }
        ));
    }

    /**
     * Handle the pre-moved piece on the board and engine.
     */
    private handleOnPiecePreMoved(squareId: Square, squareClickMode: SquareClickMode): void {
        const preMove: Move = {from: this._preSelectedSquare!, to: squareId};

        switch(squareClickMode){
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
        
        this._preMoves[this.engine.getTurnColor() === Color.White ? Color.Black : Color.White].push(preMove);
        this.logger.save(`Pre-move[${JSON.stringify(preMove)}] saved`);
        document.dispatchEvent(new CustomEvent(ChessEvent.onPieceSelected, { detail: { square: squareId } }));
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

            /**
             * Get the piece type of the given square.
             */
            const getPieceType = (square: Square): PieceType | undefined => {
                for (const piece of this.engine.getGameAsJsonNotation().board) {
                    if (piece.square === square) {
                        return piece.type;
                    }
                }
                return;
            };

            if(getPieceType(move[0].from) == PieceType.King && Math.abs(move[0].from - move[0].to) > 1)
                move[0].type = MoveType.Castling;
            
            move.forEach((moveObject: Move) => {
                this.playMove(moveObject.from, moveObject.to, Object.hasOwn(moveObject, "type") ? moveObject.type : null);
            });

            this.board.unlock();
        });
    }

    /**
     * Play a move on the board and engine.
     * @param {MoveType|null} moveType - If it is not given the function will determine the 
     * move type by checking the square click mode of the target square(`to`). Mostly, this 
     * parameter is used by the bot/system/server etc. so try to avoid using it.
     */
    public async playMove(from: Square, to: Square, moveType: MoveType | null = null): Promise<void> {
        try {
            this.engine.playMove(from, to);
            this._preSelectedSquare = null;
        } catch (e) {
            if (!(e instanceof MoveValidationError && this._preSelectedSquare)) {
                this.board.refresh();
                this._preMoves[this.engine.getTurnColor()] = [];
                throw e;
            }
        }

        await this.board.playMove(from, to, moveType);
        this.logger.save(`Move[${JSON.stringify({ from, to })}] played on board and engine`);
        this.finishTurn();
        document.dispatchEvent(new CustomEvent(ChessEvent.onPieceMoved, { detail: { from: from, to: to } }));
    }

    /**
     * Play the pre-move if it exists.
     */
    private async playPreMoveIfExist(): Promise<void> {
        const preMovesOfPlayer = this._preMoves[this.engine.getTurnColor()];
        if (preMovesOfPlayer.length == 0)
            return;
        
        const { from, to, type } = preMovesOfPlayer[0];
        this._preMoves[this.engine.getTurnColor()] = preMovesOfPlayer.length > 1 ? preMovesOfPlayer.slice(1) : [];

        setTimeout(async () => {
            await this.playMove(from, to, type);
            this.logger.save(`Pre-move[${JSON.stringify({from, to, type})}] played`);
            document.dispatchEvent(new CustomEvent(
                ChessEvent.onPieceMovedByPlayer, { detail: { from, to, type } }
            ));
        }, 100);
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
    public takeBack(onEngine: boolean = false, undoColor: Color | null = null): void {
        if(!onEngine && undoColor != null)
            throw new Error("The 'undoColor' parameter must be null when the 'onEngine' parameter is false. Please try to use 'goToSpecificMove' function instead if you want to go to the specific move.");

        if(this.engine.getMoveHistory().length == 0)
            return;
        
        if (onEngine) {
            this._currentTakeBackCount = undoColor === this.engine.getTurnColor() 
                ? 0 
                : this._currentTakeBackCount + 1;
            let moveIndex = undoColor 
                ? this.engine.getBoardHistory().findLastIndex((board) => board.turn == undoColor) 
                : this.engine.getBoardHistory().length;
                
            moveIndex = moveIndex - (!undoColor || undoColor === this.engine.getTurnColor() ? 2 : 0);
            this.goToSpecificMove(moveIndex, false);
            this.engine.takeBack(undoColor);

            this.board.unlock();
            this.board.setTurnColor(this.engine.getTurnColor());
            LocalStorage.save(LocalStorageKey.LastBoard, this.engine.getGameAsJsonNotation());
        } else {
            this.goToSpecificMove((this.engine.getMoveHistory().length - 1) - this._currentTakeBackCount - 1);
        }
    }

    /**
     * Go forward to the next move. 
     */
    public takeForward(): void {
        if(this.engine.getMoveHistory().length == 0 || this._currentTakeBackCount == 0)
            return;

        this.goToSpecificMove((this.engine.getMoveHistory().length - 1) - this._currentTakeBackCount + 1);
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
    public goToSpecificMove(moveIndex: number, showMoveReanimation: boolean = true): void {
        const newTakeBackCount = (this.engine.getMoveHistory().length - 1) - moveIndex; 

        if (moveIndex < 0 || newTakeBackCount === this._currentTakeBackCount || moveIndex > this.engine.getMoveHistory().length)
            return;
        
        if (moveIndex !== this.engine.getMoveHistory().length - 1)
            this.board.lock();
        
        let snapshotMove = showMoveReanimation ? this.engine.getMoveHistory()[moveIndex] : null;
        let snapshot = this.engine.getBoardHistory()[
            moveIndex + (snapshotMove && snapshotMove.type === MoveType.Promote ? 1 : 0)
        ];
        this.board.removePieces();
        this.board.removeEffectFromAllSquares();
        this.board.createPieces(
            snapshot.board
        );
        
        if(snapshotMove && snapshotMove.type !== MoveType.Promote){
            this.board.playMove(snapshotMove.from, snapshotMove.to, snapshotMove.type!);
            snapshot = this.engine.getBoardHistory()[moveIndex == 0 ? 0 : moveIndex + 1];
        } else if(!showMoveReanimation){
            const lastMove = this.engine.getMoveHistory()[moveIndex - 1];
            if(lastMove){
                this.board.addSquareEffects(lastMove.from, SquareEffect.From);
                this.board.addSquareEffects(lastMove.to, SquareEffect.To);
            }
        }

        this.board.showStatus(snapshot.gameStatus!);
        this._currentTakeBackCount = newTakeBackCount;

        if (moveIndex == this.engine.getMoveHistory().length - 1)
            this.board.unlock();
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
            this.board.playSound(SoundEffect.End);
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

    /**
     * Get scores of the current board.
     * 
     * @param {boolean} shownBoard Retrieves the scores of the current board, 
     * even if it reflects a previous state. For example, if the player has 
     * taken back 2 moves, this method will return the scores of the board 
     * after those 2 moves have been undone. If `shownBoard` is false, it
     * will return the scores of the latest board.
     */
    public getScores(shownBoard: boolean = false): Scores {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getScores();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount].scores!;
    }
    
    /**
     * Get the turn color of current board.
     * 
     * @param {boolean} shownBoard Retrieves the color of the current turn,
     * even if it reflects a previous state. For example, if the player has
     * taken back 2 moves, this method will return the color of the board
     * after those 2 moves have been undone. If `shownBoard` is false, it
     * will return the color of the latest board.
     */
    public getTurnColor(shownBoard: boolean = false): Color {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getTurnColor();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount].turn!;
    }

    /**
     * Get the game status of the current board.
     * 
     * @param {boolean} shownBoard Retrieves the game status of the current board,
     * even if it reflects a previous state. For example, if the player has taken
     * back 2 moves, this method will return the game status of the board after
     * those 2 moves have been undone. If `shownBoard` is false, it will return
     * the game status of the latest board.
     */
    public getGameStatus(shownBoard: boolean = false): GameStatus {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getGameStatus();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount].gameStatus!;
    }

    /**
     * Get algebraic notation of the current board.
     * 
     * @param {boolean} shownBoard Retrieves the algebraic notation of the current
     * board, even if it reflects a previous state. For example, if the player has 
     * taken back 2 moves, this method will return the algebraic notation of the board 
     * after those 2 moves have been undone. If `shownBoard` is false, it will return 
     * the algebraic notation of the latest board.
     */
    public getAlgebraicNotation(shownBoard: boolean = false): ReadonlyArray<string> {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getAlgebraicNotation();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount].algebraicNotation!;
    }

    /**
     * Get the move history of the current board.
     * 
     * @param {boolean} shownBoard Retrieves the move history of the current board,
     * even if it reflects a previous state. For example, if the player has taken back
     * 2 moves, this method will return the move history of the board after those 2 moves
     * have been undone. If `shownBoard` is false, it will return the move history of
     * the latest board.
     */
    public getMoveHistory(shownBoard: boolean = false): ReadonlyArray<Move> {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getMoveHistory();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount].moveHistory!;
    }

    /**
     * This function returns the current game as fen notation.
     * 
     * @param {boolean} shownBoard Retrieves the fen notation of the current board,
     * even if it reflects a previous state. For example, if the player has taken back
     * 2 moves, this method will return the fen notation of the board after those 2 moves
     * have been undone. If `shownBoard` is false, it will return the fen notation of
     * the latest board.
     */
    public getGameAsFenNotation(shownBoard: boolean = false): string
    {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getGameAsFenNotation();

        return Converter.jsonToFen(this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount]);
    }

    /**
     * This function returns the current game as json notation.
     * 
     * @param {boolean} shownBoard Retrieves the json notation of the current board,
     * even if it reflects a previous state. For example, if the player has taken back
     * 2 moves, this method will return the json notation of the board after those 2 moves
     * have been undone. If `shownBoard` is false, it will return the json notation of
     * the latest board.
     */
    public getGameAsJsonNotation(shownBoard: boolean = false): JsonNotation
    {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getGameAsJsonNotation();

        return this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount];
    }

    /**
     * This function returns the current game as ascii notation.
     * 
     * @param {boolean} shownBoard Retrieves the ascii notation of the current board,
     * even if it reflects a previous state. For example, if the player has taken back
     * 2 moves, this method will return the ascii notation of the board after those 2 moves
     * have been undone. If `shownBoard` is false, it will return the ascii notation of
     * the latest board.
     */
    public getGameAsASCII(shownBoard: boolean = false): string
    {
        if (!shownBoard || this._currentTakeBackCount == 0)
            return this.engine.getGameAsASCII();

        return Converter.jsonToASCII(this.engine.getBoardHistory()[this.engine.getMoveHistory().length - 1 - this._currentTakeBackCount]);
    }

    /**
     * Get initial durations of the players.
     */
    public getDurations(): Durations | null
    {
        return this.engine.getDurations();
    }

    /**
     * This function returns the remaining time of the players
     * in milliseconds.
     */
    public getPlayersRemainingTime(): RemainingTimes
    {
        return this.engine.getPlayersRemainingTime();
    }

    /**
     * This function returns the board history of the game.
     * After every move, the board is saved.
     */
    public getBoardHistory(): ReadonlyArray<JsonNotation>
    {
        return this.engine.getBoardHistory();
    }
}
