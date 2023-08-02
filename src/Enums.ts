/****************************************************
 *
 *  CHESS ENUMS
 *  The export enums below are used for the game logic like
 *  the player colors, piece types, castling types etc.
 *
 ****************************************************/

/**
 * export enum for the color of the chess pieces and the players.
 * @export enum {string}
 */
export enum Color{
    White = "White",
    Black = "Black"
}

/**
 * export enum for
 * @export enum {number}
 */
export enum Square{
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
 * export enum for the type of the chess pieces.
 * @export enum {string}
 */
export enum PieceType{
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King"
}

/**
 * export enum for the castling types.
 * @export enum {string}
 */
export enum CastlingType{
    WhiteLong = "WhiteLong",
    WhiteShort = "WhiteShort",
    BlackLong = "BlackLong",
    BlackShort = "BlackShort",
    Long = "Long",
    Short = "Short"
}


/**
 * export enum for the en passant directions
 * @export enum {string}
 */
export enum EnPassantDirection{
    Left = "Left",
    Right = "Right",
    Both = "Both"
}

/**
 * export enum for the route of the move.
 * @export enum {string}
 */
export enum MoveRoute{
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
 *  BOARD export enumS
 *  The export enums below are used for the board like the
 *  square effects, square click modes etc. So they
 *  are used for the chess board visualization and player
 *  interaction.
 *
 ****************************************************/

/**
 * export enum for the effects of the move/square
 * @export enum {string}
 */
export enum SquareEffect{
    Checked = "Checked",
    Killable = "Killable",
    Playable = "Playable",
    Selected = "Selected",
    Disabled = "Disabled",
}

/**
 * export enum for the click modes of the chess board.
 */
export enum SquareClickMode{
    Select = "Select",
    Play = "Play",
    Clear = "Clear",
    Promote = "Promote",
    Disable = "Disable"
}

/****************************************************
 *
 *  SESSION export enumS
 *  The export enums below are used for the current session
 *  like the cache layers, session types etc.
 *
 ****************************************************/

/**
 * export enum for the cache layers.
 * @export enum {string}
 */
export enum CacheLayer{
    Game = "Game",
    UI = "UI"
}

/****************************************************
 *
 *  UI export enumS
 *  The export enums below are used for the UI elements like
 *  the Alerts, Forms etc.
 *
 ****************************************************/

/**
 * export enum for some(ready-made) alert messages.
 * @export enum {string}
 */
export enum AlertMessage{
    WhiteKingAlreadyCreated = "White king is already created.",
    BlackKingAlreadyCreated = "Black king is already created.",
    KingsNotCreated = "You can't start a game without white and black kings.",
    WhiteWon = "White won the game.",
    BlackWon = "Black won the game.",
    Stalemate = "Game ended with a stalemate. No winner.",
}

/**
 * export enum for some(ready-made) confirm messages
 * @export enum {string}
 */
export enum ConfirmMessage{
    StartCustomGame = "Are you sure you want to start a custom game?",
    StartStandardGame = "Are you sure you want to start a standard game?",
    StartEmptyGame = "Are you sure you want to start an empty game?",
    StartPositionGame = "Are you sure you want to start a game from a position?",
}

/**
 * export enum for the LOG types.
 * @export enum {string}
 */
export enum LogType{
    Info = "Info",
    Warning = "Warning",
    Error = "Error"
}

/****************************************************
 *
 *  POSITION export enumS
 *  The export enums below are used for test some moves and
 *  positions. Like the castling, en passant etc.
 *
 ****************************************************/

/**
 * export enum for the start positions
 * @export enum {string}
 */
export enum StartPosition{
    Standard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    Empty = "8/8/8/8/8/8/8/8 w - - 0 1",
    EnPassantRight = "8/k1pp4/8/8/8/8/4PP1K/8 w - - 0 1",
    EnPassantLeft = "8/k3pp2/8/8/8/8/2PP3K/8 w - - 0 1",
    Check = "7k/5r2/8/3Q4/8/8/8/4K3 w - - 0 1",
    Checkmate = "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
    Stalemate = "k7/8/5R2/8/8/8/7K/1R6 w - - 0 1",
    Promotion = "2k5/4P3/8/8/8/8/2p5/4K3 w - - 0 1"
}