<h1 align="center">Chess Platform</h1>

[Live Demo](https://chess-pearl-xi.vercel.app). (Server connections may be slow since I uploaded the server-side to a free render account. To avoid problems that may arise due to a slow connection and to be able to use features that are not available in the demo, I recommend that you download the project to your machine and try it.)

Table of Contents
-----------------

1.  [Introduction](#introduction)
2.  [Features](#features)
3.  [Architecture](#architecture)
4.  [Installation](#installation)
5.  [Usage](#usage)
6.  [Testing](#testing)
7.  [Epilogue](#epilogue)
8.  [Sources](#sources)

Introduction
------------

Chess Platform is a web application (a portfolio project) that allows you to play chess against yourself, a friend, or the Stockfish engine with adjustable difficulty levels. While the project does not use advanced chess programming techniques (such as 0x88 or bitboards), it fully implements all chess rules. The application is divided into three main components: Chess Platform, Platform, and Chess. Detailed information about these parts can be found in the [Architecture](#architecture) section. The client side is developed entirely in **TypeScript** and tested with **Vitest**, while the server side is built using **Bun.js**.

![chess-platform-preview](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-preview.png)

Features
--------

*   **Standard Mechanics:**
    *   Move Calculation/Validation and special moves like [Castling](https://en.wikipedia.org/wiki/Castling), [Promotion](https://en.wikipedia.org/wiki/Promotion_(chess)), [En Passant](https://en.wikipedia.org/wiki/En_passant).
    *   Check, Checkmate, Stalemate, [Threefold Repetition](https://en.wikipedia.org/wiki/Threefold_repetition), [Fifty-move Rule](https://en.wikipedia.org/wiki/Fifty-move_rule), [Insufficient Material](https://support.chess.com/en/articles/8705277-what-does-insufficient-mating-material-mean).
    *   [Score Calculation](https://en.wikipedia.org/wiki/Chess_piece_relative_value), [Fen Notation](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation), [Algebraic Notation](https://en.wikipedia.org/wiki/Algebraic_notation_(chess)).
    *   Time Control
*   **Extended Mechanics:**
    *   Pre-Move for every type of move like normal, castling, en passant and promotion/promote (to any type of piece). Supports multiple pre-moves and can be canceled of course.
    *   Abort, Resign and Draw, Undo and Play again offers.
    *   Going back and forward in the move history.
*   **Board:**
    *   Includes animations and sounds for normal moves and pre-moves. Can be flipped. Supports drag-and-drop on both desktop and mobile. Easily [customizable](https://github.com/bberkay/chess/blob/main/client/public/css/chessboard.css) and [configurable](https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/Types/index.ts).
*   **Game Modes:**
    *   **Play by Yourself**: Play by yourself or against a friend on the same device.
    *   **Play against Friend**: Play against a friend on different devices by creating a lobby or joining an existing one.
    *   **Play against Bot**: Play against the Stockfish engine with [adjustable](https://github.com/bberkay/chess/blob/main/client/src/Chess/Bot/index.ts) difficulty levels.
*   **Components:**
    *   [**Notation Table**](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NotationMenu.ts): Shows move history and provides navigation on it. Also, shows the scores, players, durations and provides actions according to the game mode like draw if it is multiplayer game or abort if it is solo game.
    *   [**Board Editor**](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/BoardEditor.ts): Provides editable board for creating custom positions and starting games from them.
    *   [**Log Console**](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/LogConsole.ts): Shows the log of every operation and their details that are done
    *   [**Appearance Menu**](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/AppearanceMenu.ts): Provides board and theme customization without changing the css file.
    *   [**Settings Menu**](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/SettingsMenu.ts): For changing the configurations of the board and components like closing sound effects or changing the notation style.
*   **Others:**
    *   Responsive design for different devices.
    *   Light, Dark and System theme support.
    *   Cache system for saving the game, custom settings or appearance etc.
    *   Reconnection system for multiplayer games.

Architecture
------------

Check out [ARCHITECTURE.md](https://github.com/bberkay/chess/blob/main/docs/ARCHITECTURE.md) for more information about architecture and state diagrams.

### Client

*   **[ChessPlatform](https://github.com/bberkay/chess/blob/main/client/src/ChessPlatform.ts)**
    The main class on the client-side. It creates and controls the Chess and Platform based on user interactions. It connects to the server-side using websockets to enable online play. Events triggered through [`SocketEvent`](https://github.com/bberkay/chess/blob/main/client/src/Types/index.ts)` can be listened to, and variables such as the server address and port can be modified through [Consts](https://github.com/bberkay/chess/blob/main/client/src/Consts/index.ts).
    *   **WsCommand**: Located under ChessPlatform, this defines the communication language between the client-side and server-side.
*   **[Chess](https://github.com/bberkay/chess/blob/main/client/src/Chess/Chess.ts)**
    Provides a playable chess experience on the web using [`ChessBoard`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/ChessBoard.ts) and [`ChessEngine`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts) classes. It also supports [Stockfish](https://github.com/bberkay/chess/blob/main/client/src/Chess/Bot/index.ts). Manages game storage locally through [Store](https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts), and events triggered with [`ChessEvent`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Types/index.ts) can be listened to. It does not interact with any external classes outside of services.
    *   **[ChessBoard:](https://github.com/bberkay/chess/tree/main/client/src/Chess/Board)** Provides the chessboard, pieces, sound effects, square effects, promotion menu, and game end animation. Does not interact with any mechanism or external classes, and is implemented as a standalone class without sub/helper classes, except for [`Logger`](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts).
    *   **[ChessEngine:](https://github.com/bberkay/chess/tree/main/client/src/Chess/Engine)** Provides mechanisms for board control (such as piece positions), move calculation, and time control. It has sub/helper classes like `MoveEngine`, `BoardManager`, and `PieceModel`, which are used only within the [`ChessEngine`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts). Only the [`Logger`](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts) service is used externally.
*   **[Platform](https://github.com/bberkay/chess/blob/main/client/src/Platform/Platform.ts)**
    Provides components aimed at enhancing the user experience by allowing the methods of the Chess class to be used in the interface. For example, the `NotationMenu` uses methods like `chess.takeForward` and `chess.takeBack` to view move history, or `BoardEditor` uses methods like `chess.createPiece` and `chess.removePiece` to create a board. Events triggered with [`PlatformEvent`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Types/index.ts) can be listened to, and component IDs and other variables can be modified through [Consts](https://github.com/bberkay/chess/blob/main/client/src/Platform/Consts/index.ts).
    *   **[Components:](https://github.com/bberkay/chess/tree/main/client/src/Platform/Components)** Components derive from the [`Component`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Component.ts) class and are rendered in the index.html file using HTML, CSS, and JavaScript. Components can communicate with the Chess class but do not communicate with other classes, including each other. They may use services.
        *   **[NavbarComponents:](https://github.com/bberkay/chess/tree/main/client/src/Platform/Components/NavbarComponents)** A subcomponent type that derives from the [`NavbarComponent`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/NavbarComponent.ts) class. These components are located under the [`navbar`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Navbar.ts) and differ from other classes only by being under the navbar.
*   **[Services](https://github.com/bberkay/chess/tree/main/client/src/Services)**
    *   **[Logger:](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts)** A simple logging system that stores messages as objects with source and message keys, dispatching a `LoggerEvent.LogAdded` event for new logs.
    *   **[Store:](https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts)** A strict storage mechanism that operates with predefined keys and types, not allowing the creation of new or invalid keys.
*   **[Global](https://github.com/bberkay/chess/tree/main/client/src/Global)**
    *   **[Page:](https://github.com/bberkay/chess/blob/main/client/src/Global/Page.ts)** Controls the title and URL. Changes the page title based on events like `ChessEvent` and `PlatformEvent`. For example, when an event like `ChessEvent.onGameStarted` is dispatched, the page title is set to `PageTitle.GameStarted`.

![](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Client-Side-Architecture.png)

### Server

*   **[Main](https://github.com/bberkay/chess/blob/main/server/src/main.ts)**
    This is the main file on the server-side. It handles all HTTP and websocket requests. It has a copy of the [`ChessEngine`](https://github.com/bberkay/chess/tree/main/server/src/Chess) on the client-side to facilitate gameplay between players. Variables such as allowed origins and CORS headers can be modified via Consts.
    *   **[WsCommand:](https://github.com/bberkay/chess/blob/main/server/src/main.ts)** Like `ChessEngine`, this is a copy of `WsCommand` under `ChessPlatform` on the client-side.
*   **[Managers](https://github.com/bberkay/chess/tree/main/server/src/Managers)**
    *   **[LobbyManager:](https://github.com/bberkay/chess/blob/main/server/src/Managers/LobbyManager.ts)** This is the main class responsible for managing lobbies, such as creating new lobbies, adding players to lobbies, and deleting lobbies that are no longer in use. It is only used by the main file and does not interact with any other class.
    *   **[SocketManager](https://github.com/bberkay/chess/blob/main/server/src/Managers/SocketManager.ts)**: Stores the sockets of users connected to a lobby according to lobby IDs and makes websocket connections accessible for both sides.
*   **[Lobby](https://github.com/bberkay/chess/blob/main/server/src/Lobby/index.ts)**
    This class represents the lobby, hosts players, and enables gameplay using `ChessEngine`. Each lobby corresponds to a lobby instance. It does not interact with any other class.

![](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Server-Side-Architecture.png)

Installation
------------

1.  Clone the repository.
    `git clone https://github.com/bberkay/chess.git`
2.  Server
    1.  Go to the server directory.
        `cd server`
    2.  Install the dependencies.
        `bun install`
    3.  Run the server.
        `bun run src/main.ts`
3.  Client
    1.  Go to the client directory.
        `cd client`
    2.  Install the dependencies.
        `bun install`
    3.  Run the project with `bun run dev`
        or
        Build the project and preview with `bun run build && bun run preview`

Usage
-----

Check out [USAGE.md](https://github.com/bberkay/chess/blob/main/docs/USAGE.md) for more information about usage and method list of classes.

### Chess Platform (Full Version)

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

### Chess (without Platform)

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

### ChessBoard (Standalone)

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

### ChessEngine (Standalone)

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

Testing
-------

Chess Platform is tested with _Vitest_. Tests consist mostly of engine tests like **move calculation**, **move validation**, **checkmate**, **stalemate**, etc. Also, there are some tests for converting operations like **fen notation** to [`JsonNotation`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Types/index.ts)

All the tests can be run with the following command.
`bun run test`

Or run a specific test with the following command.
`bun run test en-passant`

All tests can be found in the [tests](https://github.com/bberkay/chess/tree/main/client/tests) directory.

Epilogue
--------

When I started this project, it was both to practice Javascript DOM and to test myself to see how I could write a chess algorithm. My main purpose was simply to write a board and a move engine that is as simple as possible, based entirely on functional programming, and contained within a single file. It was meant to be a project I could complete in 2-3 days/nights without needing much planning(and it did too).

However, some time after developing the project, I decided to switch from Javascript to TypeScript and from functional programming to OOP to practice TypeScript and OOP, as well as to add mechanics like playing online and against Stockfish, which I had been intending to implement.

But I had probably made the wrong decision, because the project's current infrastructure wasn't well-suited for implementing these features, and solving the resulting implementation issues made the project more complex than it should have been.

When I started the project, my goal was to practice, and I did. Maybe if I hadn't underestimated the project and had done the necessary planning from the start, I could have done even better, but perhaps the lack of planning worked out better because I encountered many problems and had to try and learn a lot of things to solve them.

At the end of the day, I feel that I improved my JavaScript/TypeScript skills, and no matter how big or small the project is, I have experienced the kinds of issues that can arise from not defining the requirements/goals and ignoring the need to make a plan accordingly.

If you have reviewed the project and noticed any areas that are missing, incorrect, or could be improved, please don't hesitate to reach out. [Contact](mailto:berkaykayaforbusiness@gmail.com) me, and thank you in advance for giving me the opportunity to improve myself

Sources
-------

*   [Stockfish.js (Bot)](https://github.com/lichess-org/stockfish.js)
*   [Pieces](https://github.com/lichess-org/lila/tree/master/public/piece/maestro)
*   [Sounds #1](https://github.com/lichess-org/lila/tree/master/public/sound/standard)
*   [Sounds #2](https://www.chess.com/forum/view/general/chessboard-sound-files)
*   [Board Effect](https://www.transparenttextures.com/)
*   [King Icon](https://commons.wikimedia.org/wiki/Category:SVG_chess_pieces)

* * *

<h5 align="center"><a href="mailto:berkaykayaforbusiness@gmail.com">berkaykayaforbusiness@gmail.com</a></h5>
