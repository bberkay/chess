<h2>Architecture</h2>
<p>For general information about the project check out <a href="https://github.com/bberkay/chess/tree/main">README.md</a>.

<h3>Client</h3>
<ul>
  <li><b><a href="https://github.com/bberkay/chess/blob/main/client/src/ChessPlatform.ts">ChessPlatform</a></b>
      <br/>The main class on the client-side. It creates and controls the Chess and Platform based on user interactions. It connects to the server-side using websockets to enable online play. Events triggered through <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Types/index.ts">SocketEvent</a></code> can be listened to, and variables such as the server address and port can be modified through <a href="https://github.com/bberkay/chess/blob/main/client/src/Consts/index.ts">Consts</a>.
    <ul>
      <li><b>WsCommand</b>: Located under ChessPlatform, this defines the communication language between the client-side and server-side.</li>
    </ul>
  </li>
  <li>
    <b><a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Chess.ts">Chess</a></b>
     <br/> Provides a playable chess experience on the web using <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Board/ChessBoard.ts">ChessBoard</a></code> and <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts">ChessEngine</a></code> classes. It also supports <a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Bot/index.ts">Stockfish</a>. Manages game storage locally through <a href="https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts">Store</a>, and events triggered with <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Types/index.ts">ChessEvent</a></code> can be listened to. It does not interact with any external classes outside of services.
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/tree/main/client/src/Chess/Board">ChessBoard:</a></b> Provides the chessboard, pieces, sound effects, square effects, promotion menu, and game end animation. Does not interact with any mechanism or external classes, and is implemented as a standalone class without sub/helper classes, except for <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts">Logger</a></code>.</li>
      <li><b><a href="https://github.com/bberkay/chess/tree/main/client/src/Chess/Engine">ChessEngine:</a></b> Provides mechanisms for board control (such as piece positions), move calculation, and time control. It has sub/helper classes like <code>MoveEngine</code>, <code>BoardManager</code>, and <code>PieceModel</code>, which are used only within the <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Chess/Engine/ChessEngine.ts">ChessEngine</a></code>. Only the <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts">Logger</a></code> service is used externally.</li>
    </ul>
  </li>
  <li>
    <b><a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Platform.ts">Platform</a></b> 
      <br/>Provides components aimed at enhancing the user experience by allowing the methods of the Chess class to be used in the interface. For example, the <code>NotationMenu</code> uses methods like <code>chess.takeForward</code> and <code>chess.takeBack</code> to view move history, or <code>BoardEditor</code> uses methods like <code>chess.createPiece</code> and <code>chess.removePiece</code> to create a board. Events triggered with <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Types/index.ts">PlatformEvent</a></code> can be listened to, and component IDs and other variables can be modified through <a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Consts/index.ts">Consts</a>.
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/tree/main/client/src/Platform/Components">Components:</a></b> Components derive from the <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Component.ts">Component</a></code> class and are rendered in the index.html file using HTML, CSS, and JavaScript. Components can communicate with the Chess class but do not communicate with other classes, including each other. They may use services.
        <ul>
          <li><b><a href="https://github.com/bberkay/chess/tree/main/client/src/Platform/Components/NavbarComponents">NavbarComponents:</a></b> A subcomponent type that derives from the <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/NavbarComponents/NavbarComponent.ts">NavbarComponent</a></code> class. These components are located under the <code><a href="https://github.com/bberkay/chess/blob/main/client/src/Platform/Components/Navbar.ts">navbar</a></code> and differ from other classes only by being under the navbar.</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>
    <b><a href="https://github.com/bberkay/chess/tree/main/client/src/Services">Services</a></b> 
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/client/src/Services/Logger.ts">Logger:</a></b> A simple logging system that stores messages as objects with source and message keys, dispatching a <code>LoggerEvent.LogAdded</code> event for new logs.</li>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/client/src/Services/Store.ts">Store:</a></b> A strict storage mechanism that operates with predefined keys and types, not allowing the creation of new or invalid keys.</li>
    </ul>
  </li>
  <li>
    <b><a href="https://github.com/bberkay/chess/tree/main/client/src/Global">Global</a></b> 
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/client/src/Global/Page.ts">Page:</a></b> Controls the title and URL. Changes the page title based on events like <code>ChessEvent</code> and <code>PlatformEvent</code>. For example, when an event like <code>ChessEvent.onGameStarted</code> is dispatched, the page title is set to <code>PageTitle.GameStarted</code>.</li>
    </ul>
  </li>
</ul>
<img src="https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Client-Side-Architecture.png">

<h3>Server</h3>
<ul>
  <li><b><a href="https://github.com/bberkay/chess/blob/main/server/src/main.ts">Main</a></b>
      <br/>This is the main file on the server-side. It handles all HTTP and websocket requests. It has a copy of the <code><a href="https://github.com/bberkay/chess/tree/main/server/src/Chess">ChessEngine</a></code> on the client-side to facilitate gameplay between players. Variables such as allowed origins and CORS headers can be modified via <a href="">Consts</a>.
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/server/src/main.ts">WsCommand:</a></b> Like <code>ChessEngine</code>, this is a copy of <code>WsCommand</code> under <code>ChessPlatform</code> on the client-side.</li>
    </ul>
  </li>
  <li>
    <b><a href="https://github.com/bberkay/chess/tree/main/server/src/Managers">Managers</a></b>
    <ul>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/server/src/Managers/LobbyManager.ts">LobbyManager:</a></b> This is the main class responsible for managing lobbies, such as creating new lobbies, adding players to lobbies, and deleting lobbies that are no longer in use. It is only used by the main file and does not interact with any other class.</li>
      <li><b><a href="https://github.com/bberkay/chess/blob/main/server/src/Managers/SocketManager.ts">SocketManager</a></b>: Stores the sockets of users connected to a lobby according to lobby IDs and makes websocket connections accessible for both sides.</li>
    </ul>
  </li>
  <li><b><a href="https://github.com/bberkay/chess/blob/main/server/src/Lobby/index.ts">Lobby</a></b>
  <br/>This class represents the lobby, hosts players, and enables gameplay using <code>ChessEngine</code>. Each lobby corresponds to a lobby instance. It does not interact with any other class.
  </li>
</ul>
<img src="https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Server-Side-Architecture.png">

<h3>Diagrams</h3>
<h4>Creating Lobby and Joining Lobby</h4>
<p>This diagram outlines the setup process for starting an online game session between two player, from creating lobby to
startings game</p>
<img src="https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Preparing-Online-Game.png">

<h4>Playing A Complete Game</h4>
<p>This diagram illustrates the core flow of gameplay, detailing how player moves/offers are sent 
from one client to the server, validated, and then transmitted to the opponent.</p>
<img src="https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Playing-Online-Game.png">

<h4>Disconnection and Reconnection</h4>
<p>This diagram covers the reconnection mechanism, showing how players can resume the game seamlessly after a disconnection, maintaining game state continuity</p>
<img src="https://raw.githubusercontent.com/bberkay/chess/refs/heads/main/docs/chess-platform-Disconnection-Reconnection.png">

<hr>
<h5 align="center"><a href="mailto:berkaykayaforbusiness@outlook.com">berkaykayaforbusiness@outlook.com</a></h5>
