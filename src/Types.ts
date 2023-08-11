/**
 * Types
 * @description General types for the chess game are defined here.
 */

/**
 * @description Piece is used to define a piece.
 * @see src/Models/Piece.ts For more information.
 */
declare interface Piece {
    getColor(): Color;
    getType(): PieceType;
    getStartPosition(): Square;
    getID(): number;
}

/**
 * @description Board is used to define a board.
 * @see src/Managers/BoardManager.ts For more information.
 */
declare type Board = Record<Square, Piece | null>;

/**
 * @description White/Black Long mean White/Black player's queen side, White/Black Short mean White/Black player's king side.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
declare type Castling = Record<CastlingType, boolean>

/**
 * @description Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimize.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
declare type EnPassant = Record<number, EnPassantDirection>

/**
 * @description Path is used for the path calculation of the pieces.
 * @see src/Engine/Calculator/PathCalculator For more information.
 */
declare type Path = {
    [MoveRoute.BottomRight]?: Square[],
    [MoveRoute.Right]?: Square[],
    [MoveRoute.TopRight]?: Square[],
    [MoveRoute.Top]?: Square[],
    [MoveRoute.TopLeft]?: Square[],
    [MoveRoute.Left]?: Square[],
    [MoveRoute.BottomLeft]?: Square[],
    [MoveRoute.Bottom]?: Square[],
}

/**
 * Chess Enums
 * @description General enums for chess like color, piece type, square.
 * @see src/Models/Piece.ts For more information.
 */

/**
 * @description Color enum for the color of the chess pieces and the players.
 * @type {string}
 * @see src/Models/Piece.ts For more information.
 */
declare enum Color{
    White = "White",
    Black = "Black"
}

/**
 * @description Square enum for board squares.
 * @type {string}
 * @see src/Managers/BoardManager.ts For more information.
 */
declare enum Square{
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
 * @description PieceType enum for the type of the chess pieces.
 * @type {string}
 * @see src/Models/Piece.ts For more information.
 */
declare enum PieceType{
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King"
}

/**
 * Calculator Enums
 * @description Calculator enums for move/path like castling type, en passant direction, move route.
 * @see src/Engine/Calculator For more information.
 */

/**
 * @description CastlingType enum for the castling types.
 * @type {string}
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
declare enum CastlingType{
    WhiteLong = "WhiteLong",
    WhiteShort = "WhiteShort",
    BlackLong = "BlackLong",
    BlackShort = "BlackShort",
    Long = "Long",
    Short = "Short"
}


/**
 * @description EnPassantDirection enum for the en passant directions.
 * @type {string}
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
declare enum EnPassantDirection{
    Left = "Left",
    Right = "Right",
    Both = "Both"
}

/**
 * @description MoveRoute enum for the route of the move.
 * @type {string}
 * @see src/Engine/Calculator/PathCalculator For more information.
 */
declare enum MoveRoute{
    BottomLeft = "BottomLeft",
    BottomRight = "BottomRight",
    TopLeft = "TopLeft",
    TopRight = "TopRight",
    Left = "Left",
    Right = "Right",
    Top = "Top",
    Bottom = "Bottom"
}

/**
 * UI Enums
 * @description Board enums for the board like square effect, square click mode.
 * @see src/UI For more information.
 */

/**
 * @description SquareEffect enum for the effects of the move/square.
 * @type {string}
 * @see src/UI/ChessBoard.ts For more information.
 */
declare enum SquareEffect{
    Checked = "checked",
    Killable = "killable",
    Playable = "playable",
    Selected = "selected",
    Disabled = "disabled",
}

/**
 * @description SquareClickMode enum for the click modes of the chess board.
 * @type {string}
 * @see src/UI/ChessBoard.ts For more information.
 */
declare enum SquareClickMode{
    Select = "Select",
    Play = "Play",
    Clear = "Clear",
    Promote = "Promote",
    Disable = "Disable"
}

/**
 * Manager Enums
 * @description Manager enums for the managers like cache manager, log manager etc.
 * @see src/Managers For more information.
 */

/**
 * @description CacheLayer enum for the cache layers.
 * @type {string}
 * @see src/Managers/CacheManager.ts For more information.
 */
declare enum CacheLayer{
    Game = "Game",
    UI = "UI"
}

/**
 * @description LogType enum for the LOG types.
 * @type {string
 * @see src/Managers/LogManager.ts For more information.
 */
declare enum LogType{
    Info = "Info",
    Warning = "Warning",
    Error = "Error"
}

/**
 * Position Enums
 * @description Position enums for the positions like start position, fen position.
 * @see src/Utils/Converter and src/Chess.ts For more information.
 */

/**
 * @description StartPosition enum for the start positions.
 * @type {string}
 * @see src/Utils/Converter and src/Chess.ts For more information.
 */
declare enum StartPosition{
    Standard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    Empty = "8/8/8/8/8/8/8/8 w - - 0 1",
    EnPassantRight = "8/k1pp4/8/8/8/8/4PP1K/8 w - - 0 1",
    EnPassantLeft = "8/k3pp2/8/8/8/8/2PP3K/8 w - - 0 1",
    Check = "7k/5r2/8/3Q4/8/8/8/4K3 w - - 0 1",
    Checkmate = "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
    Stalemate = "k7/8/5R2/8/8/8/7K/1R6 w - - 0 1",
    Promotion = "2k5/4P3/8/8/8/8/2p5/4K3 w - - 0 1"
}