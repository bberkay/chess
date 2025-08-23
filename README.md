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
    *   Abort, Resign, Draw, Undo and Play again offers.
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

![](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Client-Side-Architecture.png)

### Server

![](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Server-Side-Architecture.png)

Installation
------------

Check out [INSTALLATION.md](https://github.com/bberkay/chess/blob/main/docs/INSTALLATION.md) for more information about installation.

1. Clone the repository.
   ```bash
   git clone https://github.com/bberkay/chess.git
   cd chess
   ```

2. Set up environment variables.
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Run with Docker Compose.
   ```bash
   docker-compose up --build
   ```

4. Access the application
   - **Client:** [http://localhost:4173](http://localhost:4173)
   - **Server:** [http://localhost:3000](http://localhost:3000)

Usage
-----

Check out [USAGE.md](https://github.com/bberkay/chess/blob/main/docs/USAGE.md) for more information about usage and method list of classes.

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

Testing
-------

Chess Platform is tested with _Vitest_. Both [client](https://github.com/bberkay/chess/tree/main/client/tests) and [server](https://github.com/bberkay/chess/tree/main/server/tests) tests can be found under their own dirs. Client tests mostly consist of engine tests, and there are no UI tests yet. I tried to make the server tests as comprehensive as possible.


All the tests can be run with the following command.
`bun run test`

Or run a specific test with the following command.
`bun run test en-passant`


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
