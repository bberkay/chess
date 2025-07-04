## Architecture

For general information about the project check out [README.md](https://github.com/bberkay/chess/tree/main).

### Client

- **[ChessPlatform](https://github.com/bberkay/chess/blob/main/client/src/ChessPlatform.ts)**  
  The main class on the client-side. It creates and controls the Chess and Platform based on user interactions. It connects to the server-side using websockets to enable online play. Events triggered through [`SocketEvent`](https://github.com/bberkay/chess/blob/main/client/src/Types/index.ts) can be listened to, and variables such as the server address and port can be modified through [Consts](https://github.com/bberkay/chess/blob/main/client/src/Consts/index.ts).
  - **WsCommand**: Located under ChessPlatform, this defines the communication language between the client-side and server-side.

- **[Chess](https://github.com/bberkay/chess/blob/main/client/src/Chess/Chess.ts)**  
  Provides a playable chess experience on the web using [`ChessBoard`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/ChessBoard.ts) and [`ChessEngine`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts) classes. It also supports [Stockfish](https://github.com/bberkay/chess/blob/main/client/src/Chess/Bot/index.ts). Manages game storage locally through [Store](https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts), and events triggered with [`ChessEvent`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Types/index.ts) can be listened to. It does not interact with any external classes outside of services.
  - **[ChessBoard:](https://github.com/bberkay/chess/tree/main/client/src/Chess/Board)** Provides the chessboard, pieces, sound effects, square effects, promotion menu, and game end animation. Does not interact with any mechanism or external classes, and is implemented as a standalone class without sub/helper classes, except for [`Logger`](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts).
  - **[ChessEngine:](https://github.com/bberkay/chess/tree/main/client/src/Chess/Engine)** Provides mechanisms for board control (such as piece positions), move calculation, and time control. It has sub/helper classes like `MoveEngine`, `BoardManager`, and `PieceModel`, which are used only within the [`ChessEngine`](https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts). Only the [`Logger`](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts) service is used externally.

- **[Platform](https://github.com/bberkay/chess/blob/main/client/src/Platform/Platform.ts)**  
  Provides components aimed at enhancing the user experience by allowing the methods of the Chess class to be used in the interface. For example, the `NotationMenu` uses methods like `chess.takeForward` and `chess.takeBack` to view move history, or `BoardEditor` uses methods like `chess.createPiece` and `chess.removePiece` to create a board. Events triggered with [`PlatformEvent`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Types/index.ts) can be listened to, and component IDs and other variables can be modified through [Consts](https://github.com/bberkay/chess/blob/main/client/src/Platform/Consts/index.ts).
  - **[Components:](https://github.com/bberkay/chess/tree/main/client/src/Platform/Components)** Components derive from the [`Component`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Component.ts) class and are rendered in the index.html file using HTML, CSS, and JavaScript. Components can communicate with the Chess class but do not communicate with other classes, including each other. They may use services.
    - **[NavbarComponents:](https://github.com/bberkay/chess/tree/main/client/src/Platform/Components/NavbarComponents)** A subcomponent type that derives from the [`NavbarComponent`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/NavbarComponent.ts) class. These components are located under the [`navbar`](https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Navbar.ts) and differ from other classes only by being under the navbar.

- **[Services](https://github.com/bberkay/chess/tree/main/client/src/Services)**
  - **[Logger:](https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts)** A simple logging system that stores messages as objects with source and message keys, dispatching a `LoggerEvent.LogAdded` event for new logs.
  - **[Store:](https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts)** A strict storage mechanism that operates with predefined keys and types, not allowing the creation of new or invalid keys.

- **[Global](https://github.com/bberkay/chess/tree/main/client/src/Global)**
  - **[Page:](https://github.com/bberkay/chess/blob/main/client/src/Global/Page.ts)** Controls the title and URL. Changes the page title based on events like `ChessEvent` and `PlatformEvent`. For example, when an event like `ChessEvent.onGameStarted` is dispatched, the page title is set to `PageTitle.GameStarted`.

![Client Side Architecture](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Client-Side-Architecture.png)

### Server

- **[Main](https://github.com/bberkay/chess/blob/main/server/src/main.ts)**  
  This is the main file on the server-side. It handles all HTTP and websocket requests. It has a copy of the [`ChessEngine`](https://github.com/bberkay/chess/tree/main/server/src/Chess) on the client-side to facilitate gameplay between players. Variables such as allowed origins and CORS headers can be modified via Consts.
  - **[WsCommand:](https://github.com/bberkay/chess/blob/main/server/src/main.ts)** Like `ChessEngine`, this is a copy of `WsCommand` under `ChessPlatform` on the client-side.

- **[Managers](https://github.com/bberkay/chess/tree/main/server/src/Managers)**
  - **[LobbyManager:](https://github.com/bberkay/chess/blob/main/server/src/Managers/LobbyManager.ts)** This is the main class responsible for managing lobbies, such as creating new lobbies, adding players to lobbies, and deleting lobbies that are no longer in use. It is only used by the main file and does not interact with any other class.
  - **[SocketManager:](https://github.com/bberkay/chess/blob/main/server/src/Managers/SocketManager.ts)** Stores the sockets of users connected to a lobby according to lobby IDs and makes websocket connections accessible for both sides.

- **[Lobby](https://github.com/bberkay/chess/blob/main/server/src/Lobby/index.ts)**  
  This class represents the lobby, hosts players, and enables gameplay using `ChessEngine`. Each lobby corresponds to a lobby instance. It does not interact with any other class.

![Server Side Architecture](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Server-Side-Architecture.png)

### Diagrams

#### Creating Lobby and Joining Lobby

This diagram outlines the setup process for starting an online game session between two player, from creating lobby to startings game

![Creating Lobby and Joining Lobby](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Preparing-Online-Game.png)

#### Playing A Complete Game

This diagram illustrates the core flow of gameplay, detailing how player moves/offers are sent from one client to the server, validated, and then transmitted to the opponent.

![Playing A Complete Game](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Playing-Online-Game.png)

#### Disconnection and Reconnection

This diagram covers the reconnection mechanism, showing how players can resume the game seamlessly after a disconnection, maintaining game state continuity

![Disconnection and Reconnection](https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Disconnection-Reconnection.png)

---

<h5 align="center"><a href="mailto:berkaykayaforbusiness@gmail.com">berkaykayaforbusiness@gmail.com</a></h5>
