Usage
=====

For general information about the project check out [README.md](https://github.com/bberkay/chess/tree/main).

ChessPlatform(Full Version)
---------------------------

```html
<html>
  <head>
    <title>Chess Platform</title>
  </head>
  <body>
    <!-- Chess and Components -->
    <main>
      <div class="left">
        <div id="navbar"></div>
        <div id="log-console"></div>
        <div id="settings-menu"></div>
        <div id="appearance-menu"></div>
        <div id="about-menu"></div>
      </div>
      <div class="center">
        <div id="chessboard"></div>
        <div id="navigator-modal"></div>
        <div id="board-creator"></div>
      </div>
      <div class="right">
        <div id="notation-menu"></div>
        <div id="piece-creator"></div>
      </div>
    </main>

    <!-- Initiate Chess Platform -->
    <script type="module" async>
      import { ChessPlatform } from "./src/ChessPlatform";

      /**
       * If there is a game in cache, then platform
       * will load it. Otherwise, platform will create
       * a new standard game.
       */
      const chessPlatform = new ChessPlatform();
    </script>
  </body>
</html>
```

This is also current usage in [index.html](https://github.com/bberkay/chess/blob/main/client/index.html) of the [Live Demo](https://github.com/bberkay/chess/blob/main/README.md#chess-platform).

### Method List of ChessPlatform

Most (but not all) of the public methods you can use within the `ChessPlatform` class. You can see the custom `ChessPlatform` types in [here](https://github.com/bberkay/chess/blob/main/client/src/Types/index.ts) and more detailed explanation of the methods in [here](https://github.com/bberkay/chess/blob/main/client/src/ChessPlatform.ts).

```javascript
/**
 * Add custom callbacks to the WebSocket events.
 * Does not override the default callbacks.
 * */
bindSocketOperationCallbacks(
  onOpen: (() => void) | null = null,
  onMessage: (
    <T extends WsTitle>(
      wsTitle: T,
      wsData: WsData<T>
    ) => void) | null = null,
  onError: (() => void) | null = null,
  onClose: (() => void) | null = null
): void

/**
 * Establishes a WebSocket connection for
 * creating a new lobby.
 */
createLobby(
  createLobbyReqParams: CreateLobbyReqParams
): void

/**
 * Establishes a WebSocket connection for
 * joining an existing lobby.
 */
joinLobby(
  joinLobbyReqParams: JoinLobbyReqParams
): void

/**
 * Cancel the game and close the socket
 * connection.
 */
cancelLobby(): void

/**
 * Abort the game and send the abort
 * command to the server.
 */
abortGame(): void

/**
 * Resign the game and send the resign
 * command to the server.
 */
resign(): void

/**
 * Send the play again offer to
 * the opponent.
 */
sendPlayAgainOffer(): void

/**
 * Send the draw offer to the opponent.
 */
sendDrawOffer(): void

/**
 * Send the undo move offer to the
 * opponent.
 */
sendUndoOffer(): void

/**
 * Accept the draw offer from the
 * opponent.
 */
acceptDrawOffer(): void

/**
 * Accept the play again offer from
 * the opponent.
 */
acceptPlayAgainOffer(): void

/**
 * Accept the undo move offer from
 * the opponent.
 */
acceptUndoOffer(): void

/**
 * Cancel the offer that sent to
 * the opponent.
 */
cancelOffer(): void

/**
 * Decline the sent offer from
 * the opponent.
 */
declineSentOffer(): void

/**
 * Clear the last connection restore
 * the platform components.
 */
terminateConnection(resetPlatform: boolean = true): void
```

Chess (without Platform)
---------------------------

```html
<html>
  <head>
    <title>Chess without Platform</title>
  </head>
  <body>
    <div id="chessboard"></div>
    <!-- Required while using Chess -->

    <!-- Initiate Chess without Platform -->
    <script type="module" async>
      import { Chess } from '@Chess/Chess';
      import {
        BotAttributes,
        BotDifficulty,
        BotColor
      } from '@Chess/Bot';
      import { Color, Square } from '@Chess/Types';

      // If there is a game in cache, then chess
      // will load it. Otherwise, chess will
      // create a new standard game.
      const chess = new Chess();

      // Stockfish can be added to the game
      // with different difficulty levels
      // and colors.
      const botAttributes = {
          color: BotColor.Random
          difficulty: BotDifficulty.Medium
      }
      chess.addBotToCurrentGame(botAttributes);

      // Listening the moves
      document.addEventListener(ChessEvent.onPieceMoved, ((
          event
      ) => {
          console.log(event.detail.from, event.detail.to);
          console.log(chess.getGameAsFenNotation());
      }));
    </script>
  </body>
</html>
```

### Method List of Chess

Most (but not all) of the public methods you can use within the `Chess` class. You can see the custom `Chess` types from [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Types/index.ts) and more detailed explanation of the methods from [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Chess.ts).

```javascript
/**
 * Creates a new game with the given position
 * and durations.
 */
createGame(
  position: JsonNotation
          | StartPosition
          | string = StartPosition.Standard,
  durations: Durations | null = null
): void

/**
 * Creates a new piece with the given color,
 * type and square.
 */
createPiece(
  color: Color,
  type: PieceType,
  square: Square
): void

/**
 * Removes the piece on the given square.
 */
removePiece(square: Square): void

/**
 * Adds a bot to the current game with the
 * given attributes.
 */
addBotToCurrentGame(
  botAttributes: BotAttributes
): void

/**
 * Returns the last created bot's attributes
 * if there is any.
 */
getLastCreatedBotAttributes(): BotAttributes | null

/**
 * Terminates the bot if there is any.
 */
terminateBotIfExist(): void

/**
 * Takes back the last move.
 */
takeBack(
  onEngine: boolean = false,
  undoColor: Color | null = null
): void

/**
 * Takes forward the last taken back move.
 */
takeForward(): void

/**
 * Goes to the specific move by the given index.
 */
goToSpecificMove(moveIndex: number): void

/**
 * Returns the durations of the game if
 * the `durations` are set.
 */
getDurations(): Durations | null

/**
 * Returns the remaining times of the players
 * if the `durations` are set.
 */
getPlayersRemainingTime(): RemainingTimes

/**
 * Returns the color of the current turn
 * or taken back board's, if `ignoreTakeBack`
 * is `false`.
 */
getTurnColor(
  ignoreTakeBack: boolean = true
): Color

/**
 * Returns the status of the current game
 * or taken back board's.
 */
getGameStatus(
  ignoreTakeBack: boolean = true
): GameStatus

/**
 * Returns the algebraic notation of the
 * current game or taken back board's.
 */
getAlgebraicNotation(
  ignoreTakeBack: boolean = true
): ReadonlyArray<string>

/**
 * Returns the move history of the
 * current game or taken back board's.
 */
getMoveHistory(
  ignoreTakeBack: boolean = true
): ReadonlyArray<Move>

/**
 * Returns the scores of the current
 * game or taken back board's.
 */
getScores(
  ignoreTakeBack: boolean = true
): Readonly<Scores>

/**
 * Returns the fen notation of the current
 * game or taken back board's.
 */
getGameAsFenNotation(
  ignoreTakeBack: boolean = true
): string

/**
 * Returns the json notation of the current
 * game or taken back board's.
 */
getGameAsJsonNotation(
  ignoreTakeBack: boolean = true
): JsonNotation

/**
 * Returns the ASCII representation of the
 * current game or taken back board's.
 */
getGameAsAscii(
  ignoreTakeBack: boolean = true
): string

/**
 * Returns the board history of the current
 * game. After every move, the board is saved
 * as json notation.
 */
getBoardHistory(): ReadonlyArray<JsonNotation>
```

ChessBoard (Standalone)
---------------------------

```html
<html>
  <head>
    <title>Chessboard Standalone</title>
  </head>
  <body>
    <div id="chessboard"></div>
    <!-- Required while using ChessBoard -->

    <!-- Initiate Chessboard as Standalone -->
    <script type="module" async>
      import {
        ChessBoard,
        AnimationSpeed,
        Config,
      } from "@Chess/Board/ChessBoard";
      import { Square } from "@Chess/Types";

      // Standard game will be created in constructor.
      const chessBoard = new ChessBoard();

      // Set configuration of the board(optional).
      const config: Config = {
        enableSoundEffects: true,
        enablePreSelection: false,
        showHighlights: true,
        enableWinnerAnimation: true,
        animationSpeed: AnimationSpeed.Slow,
      };
      chessBoard.setConfig(config);

      // Bind move event callbacks.
      // This is a basic example:
      let selectedSquare: Square | null = null;
      let preSelectedSquare: Square | null = null;
      let preMoves: {
        selectedSquare: Square,
        targetSquare: Square,
      }[] = [];
      chessBoard.bindMoveEventCallbacks({
        onPieceSelected: (squareId: Square) => {
          selectedSquare = squareId;
        },
        onPiecePreSelected: (squareId: Square) => {
          preSelectedSquare = squareId;
        },
        onPieceMoved: (squareId: Square) => {
          console.log("Piece moved to: ", squareId);
          selectedSquare = null;
        },
        onPiecePreMoved: (
          squareId: Square,
          squareClickMode: SquareClickMode
        ) => {
          console.log("Piece pre-moved to: ", squareId);
          if (squareClickMode === SquareClickMode.PrePromote)
            chessBoard.showPromotionMenu(squareId);
          else
            preMoves.push({
              selectedSquare: preSelectedSquare,
              targetSquare: squareId,
            });
        },
        onPreMoveCanceled: () => {
          console.log("Pre-move canceled.");
          preSelectedSquare = null;
          preMoves = [];
        },
      });
    </script>
  </body>
</html>
```

### Method List of ChessBoard

Most (but not all) of the public methods you can use within the `ChessBoard` class. You can see the custom `ChessBoard` types in [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/Types/index.ts) and more detailed explanation of the methods in [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/ChessBoard.ts).

```javascript
/**
 * Set the configuration of the chess board.
 */
setConfig(
  config: Partial<ChessBoard["config"]>
): void

/**
 * Creates a new game with the given position.
 */
createGame(
  position: JsonNotation
          | StartPosition
          | string = StartPosition.Standard
): void

/**
 * Creates a new piece with the given color,
 * type and square.
 */
createPiece(
  color: Color,
  type: PieceType,
  square: Square,
  isGhost: boolean = false
): void

/**
 * Removes the piece on the given square.
 */
removePiece(
  square: HTMLDivElement
        | HTMLElement
        | Element
        | Square
): void

/**
 * Sets the turn color of the board.
 */
setTurnColor(color: Color): void

/**
 * Bind functions to the specific events
 * of the chess board. Does not override
 * the previous event bindings.
 */
bindMoveEventCallbacks(
    callbacks: {
      onPieceSelected?: (squareId: Square) => void;
      onPiecePreSelected?: (squareId: Square) => void;
      onPieceMoved?: (squareId: Square) => void;
      onPiecePreMoved?: (
        squareId: Square,
        squareClickMode: SquareClickMode
      ) => void;
      onPreMoveCanceled?: () => void
    }
): void

/**
 * Highlights the moves on the board.
 */
highlightMoves(
  moves: Moves | null = null,
  isPreMove: boolean = false
): void

/**
 * Refreshes the board.
 */
refresh(savePreMoveEffects: boolean = false): void

/**
 * Flips the board.
 */
flip(): void

/**
 * Returns whether the board is flipped or not.
 */
isFlipped(): boolean

/**
 * Locks the board.
 */
lock(
  disablePreSelection: boolean = false,
  showDisabledEffect: boolean = false
): void

/**
 * Returns whether the board is locked or not.
 */
isLocked(): boolean

/**
 * Shows the status on the board.
 */
showStatus(status: GameStatus): void

/**
 * Shows the promotion menu on the given square.
 */
showPromotionMenu(
  promotionSquare: HTMLElement | Square
): void

/**
 * Closes the promotion menu.
 */
closePromotionMenu(): void

/**
 * Returns whether the promotion menu is shown or not.
 */
isPromotionMenuShown(): boolean

/**
 * Locks the actions for the given color.
 */
lockActionsOfColor(color: Color): void

/**
 * Returns the locked color if there is any.
 */
getLockedColor(): Color | null

/**
 * Returns all the squares of the board.
 */
getAllSquares(): NodeListOf<HTMLDivElement>

/**
 * Returns all the pieces of the board.
 */
getAllPieces(): NodeListOf<HTMLDivElement>

/**
 * Returns the closest square element of the
 * given element.
 */
getClosestSquareElement(
  element: HTMLElement
): HTMLElement | null

/**
 * Returns the piece element of the given square.
 */
getPieceElementOnSquare(
  squareElement: HTMLDivElement | Element | Square
): HTMLDivElement

/**
 * Returns the selected square element if
 * there is any.
 */
getSelectedSquareElement(): HTMLDivElement | null

/**
 * Returns the color of the piece on the given
 * square.
 */
getPieceColor(
  squareOrPieceElement: HTMLDivElement | Element | Square
): Color

/**
 * Returns the type of the piece on the given square.
 */
getPieceType(
  squareOrPieceElement: HTMLDivElement | Element | Square
): PieceType

/**
 * Returns the square element of the given piece.
 */
getSquareElementOfPiece(
  pieceElement: HTMLDivElement | Element
): HTMLDivElement

/**
 * Returns the square id of the given square element.
 */
getSquareId(
  squareElement: HTMLDivElement | Element
): Square

/**
 * Returns the click mode of the given square.
 */
getSquareClickMode(
  square: Square | HTMLDivElement | Element
): SquareClickMode
```

ChessEngine(Standalone)
---------------------------

```typescript
// somefile.ts/somefile.js
import { ChessEngine } from "@Chess/Engine/ChessEngine";
import { Square } from "@Chess/Types";

// Standard game will be created in constructor.
const chessEngine = new ChessEngine();

// Get moves of the piece on the given square.
// This is optional, you don't have to use it to play move.
const moves: Moves = chessEngine.getMoves(Square.e2);
console.log(moves);
//  Example `moves` output:
//  {
//    [MoveType.Normal]: [Square.e3, Square.e4],
//    [MoveType.Castling]: [],
//    [MoveType.EnPassant]: []
//  }
//

// Play on engine(without board)
chessEngine.playMove(Square.e2, Square.e4);

// Get the fen notation of the current game
const fen: string = chessEngine.getGameAsFenNotation();
console.log(fen);
// Example `fenNotation` output:
// rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1

// Print the ASCII representation of the current game
console.log(chessEngine.getGameAsAscii());
// Example `ASCII` output:
// +---+---+---+---+---+---+---+---+
// | r   n   b   q   k   b   n   r | 8
// | p   p   p   p   p   p   p   p | 7
// | .   .   .   .   .   .   .   . | 6
// | .   .   .   .   .   .   .   . | 5
// | .   .   .   .   P   .   .   . | 4
// | .   .   .   .   .   .   .   . | 3
// | P   P   P   P   .   P   P   P | 2
// | R   N   B   Q   K   B   N   R | 1
// +---+---+---+---+---+---+---+---+
//   a   b   c   d   e   f   g   h
```

### Method List of ChessEngine

Most (but not all) of the public methods you can use within the `ChessEngine` class. You can see the custom `ChessEngine` types marked in [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/Types/index.ts) and more detailed explanation of the methods in [here](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts).

```javascript
/**
 * Creates a new game with the given position.
 */
createGame(
  position: JsonNotation
          | StartPosition
          | string = StartPosition.Standard
): void

/**
 * Creates a new piece with the given color,
 * type and square.
 */
createPiece(
  color: Color,
  type: PieceType,
  square: Square
): void

/**
 * Removes the piece on the given square.
 */
removePiece(square: Square): void

/**
 * Returns the moves of the piece on the
 * given square.
 */
getMoves(
  square: Square,
  isPreCalculation: boolean = false
): Moves | null

/**
 * Plays the move on the engine with the
 * given squares.
 */
playMove(
  from: Square,
  to: Square,
  moveType: MoveType | null = null
): void

/**
 * Takes back the last move.
 */
takeBack(undoColor: Color | null = null): void

/**
 * Returns the durations of the game if
 * the durations are set.
 */
getDurations(): Durations | null

/**
 * Returns the remaining times of the players
 * if the durations are set.
 */
getPlayersRemainingTime(): RemainingTimes

/**
 * Returns the color of the current turn.
 */
getTurnColor(): Color

/**
 * Returns the status of the current game.
 */
getGameStatus(): GameStatus

/**
 * Returns the algebraic notation of the
 * current game.
 */
getAlgebraicNotation(): ReadonlyArray<string>

/**
 * Returns the move history of the current
 * game.
 */
getMoveHistory(): ReadonlyArray<Move>

/**
 * Returns the board history of the current
 * game. After every move, the board is saved
 * as json notation.
 */
getBoardHistory(): ReadonlyArray<JsonNotation>

/**
 * Returns the scores of the current game.
 */
getScores(): Readonly<Scores>

/**
 * Returns the fen notation of the
 * current game.
 */
getGameAsFenNotation(): string

/**
 * Returns the json notation of the
 * current game.
 */
getGameAsJsonNotation(): JsonNotation

/**
 * Returns the ASCII representation of
 * the current game.
 */
getGameAsAscii(): string
```

Check [Chess.ts](https://github.com/bberkay/chess/blob/main/client/src/Chess/Chess.ts) for more ready-to-play implementation.

---

<h5 align="center"><a href="mailto:berkaykayaforbusiness@outlook.com">berkaykayaforbusiness@outlook.com</a></h5>
