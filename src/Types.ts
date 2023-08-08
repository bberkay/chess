import { Piece } from "./Models/Piece.ts";
import { Square, CastlingType, EnPassantDirection, MoveRoute } from "./Enums.ts";

// Piece | null means empty square and Piece means piece on the square
export type Board = {
    [Square.a1]: Piece | null, [Square.a2]: Piece | null, [Square.a3]: Piece | null, [Square.a4]: Piece | null, [Square.a5]: Piece | null, [Square.a6]: Piece | null, [Square.a7]: Piece | null, [Square.a8]: Piece | null,
    [Square.b1]: Piece | null, [Square.b2]: Piece | null, [Square.b3]: Piece | null, [Square.b4]: Piece | null, [Square.b5]: Piece | null, [Square.b6]: Piece | null, [Square.b7]: Piece | null, [Square.b8]: Piece | null,
    [Square.c1]: Piece | null, [Square.c2]: Piece | null, [Square.c3]: Piece | null, [Square.c4]: Piece | null, [Square.c5]: Piece | null, [Square.c6]: Piece | null, [Square.c7]: Piece | null, [Square.c8]: Piece | null,
    [Square.d1]: Piece | null, [Square.d2]: Piece | null, [Square.d3]: Piece | null, [Square.d4]: Piece | null, [Square.d5]: Piece | null, [Square.d6]: Piece | null, [Square.d7]: Piece | null, [Square.d8]: Piece | null,
    [Square.e1]: Piece | null, [Square.e2]: Piece | null, [Square.e3]: Piece | null, [Square.e4]: Piece | null, [Square.e5]: Piece | null, [Square.e6]: Piece | null, [Square.e7]: Piece | null, [Square.e8]: Piece | null,
    [Square.f1]: Piece | null, [Square.f2]: Piece | null, [Square.f3]: Piece | null, [Square.f4]: Piece | null, [Square.f5]: Piece | null, [Square.f6]: Piece | null, [Square.f7]: Piece | null, [Square.f8]: Piece | null,
    [Square.g1]: Piece | null, [Square.g2]: Piece | null, [Square.g3]: Piece | null, [Square.g4]: Piece | null, [Square.g5]: Piece | null, [Square.g6]: Piece | null, [Square.g7]: Piece | null, [Square.g8]: Piece | null,
    [Square.h1]: Piece | null, [Square.h2]: Piece | null, [Square.h3]: Piece | null, [Square.h4]: Piece | null, [Square.h5]: Piece | null, [Square.h6]: Piece | null, [Square.h7]: Piece | null, [Square.h8]: Piece | null,
};

// Color Long mean Color player's queen side, Color Short mean Color player's king side.
export type Castling = {
    [CastlingType.WhiteLong]: boolean;
    [CastlingType.BlackLong]: boolean;
    [CastlingType.WhiteShort]: boolean;
    [CastlingType.BlackShort]: boolean;
    [CastlingType.Long]: boolean;
    [CastlingType.Short]: boolean;
}

// Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimize, see GameManager.canPawnDoEnPassant).
export type EnPassant = {
    [pieceID: number]: EnPassantDirection;
}

//
export type Path = {
    [key in MoveRoute]?: Array<Square>
}