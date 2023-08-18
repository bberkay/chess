import { Color, PieceType, Square } from "@types";

/**
 * @description Piece is used to define a piece.
 * @see src/Models/Piece.ts For more information.
 */
export interface Piece {
    getColor(): Color;
    getType(): PieceType;
    getID(): number;
    getMoveCount(): number;
    increaseMoveCount(): void;
    setMoveCount(moveCount: number): void;
}

/**
 * @description White/Black Long mean White/Black player's queen side, White/Black Short mean White/Black player's king side.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
export type Castling = Record<CastlingType, boolean>

/**
 * @description Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimize.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
export type EnPassant = Record<number, EnPassantDirection>

/**
 * @description Kings is stores the kings of the players.
 * @see src/Managers/BoardManager.ts For more information.
 */
export type Kings = Record<Color, Piece | null>;

/**
 * @description Route is used for the store move directions of the pieces.
 * @see src/Engine/Calculator/PathCalculator For more information.
 */
export type Route = {
    [MoveRoute.BottomRight]?: Square[],
    [MoveRoute.Right]?: Square[],
    [MoveRoute.TopRight]?: Square[],
    [MoveRoute.Top]?: Square[],
    [MoveRoute.TopLeft]?: Square[],
    [MoveRoute.Left]?: Square[],
    [MoveRoute.BottomLeft]?: Square[],
    [MoveRoute.Bottom]?: Square[]
    [MoveRoute.L]?: Square[],
}

/**
 * @description CastlingType enum for the castling types.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
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
 * @description EnPassantDirection enum for the en passant directions.
 * @see src/Engine/Checker/MoveChecker.ts For more information.
 */
export enum EnPassantDirection{
    Left = "Left",
    Right = "Right",
    Both = "Both"
}

/**
 * @description MoveRoute enum for the route of the move.
 * @see src/Engine/Calculator/PathCalculator For more information.
 */
export enum MoveRoute{
    BottomLeft = "BottomLeft",
    BottomRight = "BottomRight",
    TopLeft = "TopLeft",
    TopRight = "TopRight",
    Left = "Left",
    Right = "Right",
    Top = "Top",
    Bottom = "Bottom",
    L = "L"
}