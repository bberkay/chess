/****************************************************
 *
 *  GAME ENUMS
 *  The enums below are used for the game logic like
 *  the player colors, piece types, castling types etc.
 *
 ****************************************************/

/**
 * Enum for the color of the chess pieces and the players.
 * @enum {string}
 */
enum Color{
    White = "White",
    Black = "Black"
}

/**
 * Enum for
 * @enum {number}
 */
enum Square{
    a1 = 57, a2 = 49, a3 = 41, a4 = 33, a5 = 25, a6 = 17, a7 = 9, a8 = 1,
    b1 = 58, b2 = 50, b3 = 42, b4 = 34, b5 = 26, b6 = 18, b7 = 10, b8 = 2,
    c1 = 59, c2 = 51, c3 = 43, c4 = 35, c5 = 27, c6 = 19, c7 = 11, c8 = 3,
    d1 = 60, d2 = 52, d3 = 44, d4 = 36, d5 = 28, d6 = 20, d7 = 12, d8 = 4,
    e1 = 61, e2 = 53, e3 = 45, e4 = 37, e5 = 29, e6 = 21, e7 = 13, e8 = 5,
    f1 = 62, f2 = 54, f3 = 46, f4 = 38, f5 = 30, f6 = 22, f7 = 14, f8 = 6,
    g1 = 63, g2 = 55, g3 = 47, g4 = 39, g5 = 31, g6 = 23, g7 = 15, g8 = 7,
    h1 = 64, h2 = 56, h3 = 48, h4 = 40, h5 = 32, h6 = 24, h7 = 16, h8 = 8
}

/**
 * Enum for the type of the chess pieces.
 * @enum {string}
 */
enum PieceType{
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King"
}

/**
 * Enum for the castling types.
 * @enum {string}
 */
enum CastlingType{
    WhiteLong = "WhiteLong",
    WhiteShort = "WhiteShort",
    BlackLong = "BlackLong",
    BlackShort = "BlackShort",
    Long = "Long",
    Short = "Short"
}


/**
 * Enum for the en passant directions
 * @enum {string}
 */
enum EnPassantDirection{
    Left = "Left",
    Right = "Right"
}

/**
 * Enum for the route of the move.
 * @enum {string}
 */
enum MoveRoute{
    BottomLeft = "BottomLeft",
    BottomRight = "BottomRight",
    TopLeft = "TopLeft",
    TopRight = "TopRight",
    Left = "Left",
    Right = "Right",
    Top = "Top",
    Bottom = "Bottom"
}


/****************************************************
 *
 *  BOARD ENUMS
 *  The enums below are used for the board like the
 *  square effects, square click modes etc. So they
 *  are used for the chess board visualization and player
 *  interaction.
 *
 ****************************************************/

/**
 * Enum for the effects of the move/square
 * @enum {string}
 */
enum SquareEffect{
    Checked = "Checked",
    Killable = "Killable",
    Playable = "Playable",
    Selected = "Selected",
    Disabled = "Disabled",
}

/**
 * Enum for the click modes of the chess board.
 */
enum SquareClickMode{
    Select = "Select",
    Play = "Play",
    Clear = "Clear",
    Promote = "Promote",
    Disable = "Disable"
}

/****************************************************
 *
 *  SESSION ENUMS
 *  The enums below are used for the current session
 *  like the cache layers, session types etc.
 *
 ****************************************************/

/**
 * Enum for the cache layers.
 * @enum {string}
 */
enum CacheLayer{
    Game = "Game",
    UI = "UI"
}

/****************************************************
 *
 *  UI ENUMS
 *  The enums below are used for the UI elements like
 *  the Alerts, Forms etc.
 *
 ****************************************************/

/**
 * Enum for some(ready-made) alert messages.
 * @enum {string}
 */
enum AlertMessage{
    WhiteKingAlreadyCreated = "White king is already created.",
    BlackKingAlreadyCreated = "Black king is already created.",
    KingsNotCreated = "You can't start a game without white and black kings.",
    WhiteWon = "White won the game.",
    BlackWon = "Black won the game.",
    Stalemate = "Game ended with a stalemate. No winner.",
}

/**
 * Enum for some(ready-made) confirm messages
 * @enum {string}
 */
enum ConfirmMessage{
    StartCustomGame = "Are you sure you want to start a custom game?",
    StartStandardGame = "Are you sure you want to start a standard game?",
    StartEmptyGame = "Are you sure you want to start an empty game?",
    StartPositionGame = "Are you sure you want to start a game from a position?",
}

/**
 * Enum for the LOG types.
 * @enum {string}
 */
enum LogType{
    Info = "Info",
    Warning = "Warning",
    Error = "Error"
}

/****************************************************
 *
 *  POSITION ENUMS
 *  The enums below are used for test some moves and
 *  positions. Like the castling, en passant etc.
 *
 ****************************************************/

/**
 * Enum for the start positions
 * @enum {Array<Object>}
 */
const StartPosition = {
    Standard: [
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.a1},
        {"color": Color.White, "piece": PieceType.Knight, "position": Square.b1},
        {"color": Color.White, "piece": PieceType.Bishop, "position": Square.c1},
        {"color": Color.White, "piece": PieceType.Queen, "position": Square.d1},
        {"color": Color.White, "piece": PieceType.King, "position": Square.e1},
        {"color": Color.White, "piece": PieceType.Bishop, "position": Square.f1},
        {"color": Color.White, "piece": PieceType.Knight, "position": Square.g1},
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.h1},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.a2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.b2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.c2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.d2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.e2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.f2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.g2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.h2},
        {"color": Color.Black, "piece": PieceType.Rook, "position": Square.a8},
        {"color": Color.Black, "piece": PieceType.Knight, "position": Square.b8},
        {"color": Color.Black, "piece": PieceType.Bishop, "position": Square.c8},
        {"color": Color.Black, "piece": PieceType.Queen, "position": Square.d8},
        {"color": Color.Black, "piece": PieceType.King, "position": Square.e8},
        {"color": Color.Black, "piece": PieceType.Bishop, "position": Square.f8},
        {"color": Color.Black, "piece": PieceType.Knight, "position": Square.g8},
        {"color": Color.Black, "piece": PieceType.Rook, "position": Square.h8},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.a7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.b7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.c7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.d7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.e7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.f7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.g7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.h7},
    ],
    Empty: [],
    EnPassantRight: [
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.e2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.f2},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.d7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.c7},
        {"color": Color.White, "piece": PieceType.King, "position": Square.h1},
        {"color": Color.Black, "piece": PieceType.King, "position": Square.a8}
    ],
    EnPassantLeft: [
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.c2},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.d2},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.e7},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.f7},
        {"color": Color.White, "piece": PieceType.King, "position": Square.h1},
        {"color": Color.Black, "piece": PieceType.King, "position": Square.a8}
    ],
    Check:[
        {"color": Color.Black, "piece": PieceType.King, "position": Square.e1},
        {"color": Color.White, "piece": PieceType.Queen, "position": Square.h5},
        {"color": Color.Black, "piece": PieceType.Rook, "position": Square.g2},
        {"color": Color.White, "piece": PieceType.King, "position": Square.h8},
    ],
    Checkmate:[
        {"color": Color.Black, "piece": PieceType.King, "position": Square.a8},
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.b1},
        {"color": Color.Black, "piece": PieceType.Rook, "position": Square.e6},
        {"color": Color.White, "piece": PieceType.King, "position": Square.h2},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.f6},
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.b2},
    ],
    Stalemate:[
        {"color": Color.Black, "piece": PieceType.King, "position": Square.a8},
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.b1},
        {"color": Color.White, "piece": PieceType.Rook, "position": Square.f6},
        {"color": Color.White, "piece": PieceType.King, "position": Square.h2}
    ],
    Promotion:[
        {"color": Color.Black, "piece": PieceType.King, "position": Square.c8},
        {"color": Color.White, "piece": PieceType.Pawn, "position": Square.e7},
        {"color": Color.White, "piece": PieceType.King, "position": Square.e1},
        {"color": Color.Black, "piece": PieceType.Pawn, "position": Square.c2}
    ]
}