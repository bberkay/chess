/**
 * Color enum for the color of the chess pieces and the players.
 * @enum {string}
 * @see For more information, check src/Models/PieceModel.ts
 */
export enum Color {
    White = "White",
    Black = "Black",
}

/**
 * Square enum for board squares.
 * @enum {number}
 * @see For more information, check src/Engine/Core/Board/BoardEngine.ts
 */
// prettier-ignore
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
 * PieceType enum for the type of the chess pieces.
 * @enum {string}
 * @see For more information, check src/Models/PieceModel.ts
 */
export enum PieceType {
    Pawn = "Pawn",
    Knight = "Knight",
    Bishop = "Bishop",
    Rook = "Rook",
    Queen = "Queen",
    King = "King",
}

/**
 * PieceIcon enum for the icon of the chess pieces.
 * @enum {string}
 * @see For more information, check src/Models/PieceModel.ts
 */
export enum PieceIcon {
    WhitePawn = "P",
    WhiteKnight = "N",
    WhiteBishop = "B",
    WhiteRook = "R",
    WhiteQueen = "Q",
    WhiteKing = "K",
    BlackPawn = "p",
    BlackKnight = "n",
    BlackBishop = "b",
    BlackRook = "r",
    BlackQueen = "q",
    BlackKing = "k",
}

/**
 * PromotionPieceType enum for the promotion piece types.
 * @enum {string}
 * @see For more information, check src/Utils/Converter.ts
 */
export enum PromotionPieceType {
    Knight = "n",
    Bishop = "b",
    Rook = "r",
    Queen = "q",
}

/**
 * CastlingSide enum for the castling sides.
 * @enum {string}
 * @see src/Engine/ChessEngine.ts For more information.
 */
export enum CastlingSide {
    Long = "Long",
    Short = "Short",
}

/**
 * CastlingType enum for the castling types.
 * @enum {string}
 * @see src/Engine/Helper/MoveExtender.ts For more information.
 */
export enum CastlingType {
    WhiteLong = "WhiteLong",
    WhiteShort = "WhiteShort",
    BlackLong = "BlackLong",
    BlackShort = "BlackShort",
}

/**
 * MoveType enum for the move types.
 * @enum {string}
 * @see src/Engine/ChessEngine.ts For more information.
 */
export enum MoveType {
    Normal = "Normal",
    EnPassant = "EnPassant",
    Castling = "Castling",
    Promotion = "Promotion", // Move pawn to the promotion square.
    Promote = "Promote", // Promote the pawn to the selected piece.
}

/**
 * EnPassantDirection enum for the en passant directions.
 * @enum {string}
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
export enum EnPassantDirection {
    Left = "Left",
    Right = "Right",
}

/**
 * Moves type for the moves of the pieces.
 * @see For more information, check src/Chess.ts
 */
export type Moves = { [key in MoveType]?: Array<Square> };

/**
 * Duration type mostly for the initial duration of the players.
 * @see For more information, check src/Chess.ts
 */
export type Duration = { remaining: number; increment: number };

/**
 * Durations type for the durations of the players.
 * @see For more information, check src/Chess.ts
 */
export type Durations = Record<Color, Duration>;

/**
 * RemainingTimes type for the remaining times of the players.
 * @see For more information, check src/Chess.ts
 */
export type RemainingTimes = Record<Color, number>;

/**
 * Scores type for the scores of the players.
 * @see For more information, check src/Chess.ts
 */
export type Scores = Record<Color, { score: number; pieces: PieceType[] }>;

/**
 * Move type for the player moves.
 * @see For more information, check src/Chess.ts
 */
export type Move = { from: Square; to: Square; type?: MoveType };

/**
 * Pieces type for the pieces of the board.
 * @see For more information, check src/Chess.ts
 */
export type Pieces = { color: Color; type: PieceType; square: Square }[];

/**
 * Castling type for the castling status of the players.
 * @see For more information, check src/Chess.ts
 */
export type Castling = Record<CastlingType, boolean>;

/**
 * Json notation for is alternative notation for the FEN notation.
 */
export interface JsonNotation {
    board: Pieces;
    turn: Color;
    fullMoveNumber: number;
    halfMoveClock: number;
    enPassant: Square | null;
    castling: Castling;
    scores?: Scores;
    algebraicNotation?: string[];
    moveHistory?: Move[];
    durations?: Durations | null;
    gameStatus?: GameStatus;
    boardHistory?: JsonNotation[];
}

/**
 * StartPosition enum for the start positions.
 * @see For more information, check src/Chess.ts
 */
export enum StartPosition {
    Standard = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    Empty = "8/8/8/8/8/8/8/8 w - - 0 1",
    Promotion = "8/8/k3P3/8/8/8/8/4K3 w - - 0 1",
    PromotionByCapture = "3r4/8/k3P3/8/8/8/8/4K3 w - - 0 1",
    Castling = "r3k2r/8/8/4b3/4B3/8/8/R3K2R w KQkq - 0 1",
    LongCastlingCheck = "4k3/8/8/8/5b2/8/8/R3K2R w KQ - 0 1",
    ShortCastlingCheck = "4k3/8/8/2b5/8/8/8/R3K2R w KQ - 0 1",
    BothCastlingCheck = "4k3/8/8/8/8/4b3/8/R3K2R w KQ - 0 1",
    CheckCastling = "4k3/8/8/8/1b6/8/8/R3K2R w KQ - 0 1",
    EnPassantLeft = "8/k1pp4/8/8/8/8/4PP1K/8 w - - 0 1",
    EnPassantRight = "8/k3pp2/8/8/8/8/2PP3K/8 w - - 0 1",
    ForbiddenEnPassantLeft = "4r3/k1pp4/8/8/8/8/4PP2/4K3 w - - 0 1",
    ForbiddenEnPassantRight = "3r4/k3pp2/8/8/8/8/2PP4/3K4 w - - 0 1",
    KingForbiddenMove = "7K/6b1/8/8/3qb3/8/8/1k6 w - - 0 1",
    ProtectKing = "3k4/3q4/8/8/8/8/3R4/3K4 w - - 0 1",
    Check = "7k/5r2/8/3Q4/8/8/8/4K3 w - - 0 1",
    DoubleCheck = "rnbqkbnr/ppp1pNpp/8/7Q/8/8/PPPPPPPP/RNB1KB1R w KQkq - 1 1",
    CheckmateWithDoubleCheck = "rnbqkbnr/pppppNpp/8/7Q/8/8/PPPPPPPP/RNB1KB1R w KQkq - 0 1",
    EnPassantCheck = "8/p3pk2/8/8/5N2/8/3P4/4K3 w - - 0 1",
    Checkmate = "k7/8/4rp2/8/8/8/1R5K/1R6 w - - 0 1",
    AdjacentCheckmate = "rnbqkbnr/ppppp1pp/8/8/2B2Q2/8/PPPPPPPP/RNB1K1NR w KQkq - 0 1",
    Stalemate = "k7/5R2/6p1/8/6P1/8/7K/1R6 w - - 0 1",
}

/**
 * StartPosition enum for the start positions.
 * @see For more information, check src/Chess.ts
 */
export enum GameStatus {
    NotReady = "NotReady",
    ReadyToStart = "ReadyToStart",
    InPlay = "InPlay",
    WhiteInCheck = "WhiteInCheck",
    BlackInCheck = "BlackInCheck",
    Draw = "Draw",
    WhiteVictory = "WhiteVictory",
    BlackVictory = "BlackVictory",
}

/**
 * ChessEvent enum for the custom chess events.
 * @enum {string}
 */
export enum ChessEvent {
    /**
     * Triggered when the game is created.
     * @Event
     */
    onGameCreated = "onGameCreated",

    /**
     * Triggered when a piece is created.
     * @CustomEvent
     * @param {Square} square - The square where the piece is created.
     */
    onPieceCreated = "OnPieceCreated",

    /**
     * Triggered when a piece is removed.
     * @CustomEvent
     * @param {Square} square - The square where the piece is removed.
     */
    onPieceRemoved = "OnPieceRemoved",

    /**
     * Triggered when a piece is selected.
     * @CustomEvent
     * @param {Square} square - The square where the piece is selected.
     */
    onPieceSelected = "OnPieceSelected",

    /**
     * Triggered when a piece is moved.
     * @CustomEvent
     * @param {Square} from - The starting square of the move.
     * @param {Square} to - The ending square of the move.
     */
    onPieceMoved = "OnPieceMoved",

    /**
     * Triggered when a piece is moved by the player
     * by clicking on the board.
     * @CustomEvent
     * @param {Square} from - The starting square of the move.
     * @param {Square} to - The ending square of the move.
     */
    onPieceMovedByPlayer = "onPieceMovedByUser",

    /**
     * Triggered when a piece is moved by the opponent client.
     * @CustomEvent
     * @param {Square} from - The starting square of the move.
     * @param {Square} to - The ending square of the move.
     */
    onPieceMovedByOpponent = "onPieceMovedByOpponent",

    /**
     * On bot added to the game.
     * @CustomEvent
     * @param {Color} color - The color of the bot.
     */
    onBotAdded = "onBotAdded",

    /**
     * Triggered when the game is over.
     * @Event
     */
    onGameOver = "onGameOver",
}
