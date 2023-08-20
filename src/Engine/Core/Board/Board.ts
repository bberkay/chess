import {Square, Color, CastlingType, CastlingStatus } from "Types";
import {Piece, Kings, EnPassantBanStatus } from "Types/Engine";

/**
 * This class is used for the store the board.
 */
export class Board {

    /**
     * Properties of the Board class.
     */
    protected static currentBoard: Record<Square, Piece | null> = {
        [Square.a1]: null, [Square.a2]: null, [Square.a3]: null, [Square.a4]: null, [Square.a5]: null, [Square.a6]: null, [Square.a7]: null, [Square.a8]: null,
        [Square.b1]: null, [Square.b2]: null, [Square.b3]: null, [Square.b4]: null, [Square.b5]: null, [Square.b6]: null, [Square.b7]: null, [Square.b8]: null,
        [Square.c1]: null, [Square.c2]: null, [Square.c3]: null, [Square.c4]: null, [Square.c5]: null, [Square.c6]: null, [Square.c7]: null, [Square.c8]: null,
        [Square.d1]: null, [Square.d2]: null, [Square.d3]: null, [Square.d4]: null, [Square.d5]: null, [Square.d6]: null, [Square.d7]: null, [Square.d8]: null,
        [Square.e1]: null, [Square.e2]: null, [Square.e3]: null, [Square.e4]: null, [Square.e5]: null, [Square.e6]: null, [Square.e7]: null, [Square.e8]: null,
        [Square.f1]: null, [Square.f2]: null, [Square.f3]: null, [Square.f4]: null, [Square.f5]: null, [Square.f6]: null, [Square.f7]: null, [Square.f8]: null,
        [Square.g1]: null, [Square.g2]: null, [Square.g3]: null, [Square.g4]: null, [Square.g5]: null, [Square.g6]: null, [Square.g7]: null, [Square.g8]: null,
        [Square.h1]: null, [Square.h2]: null, [Square.h3]: null, [Square.h4]: null, [Square.h5]: null, [Square.h6]: null, [Square.h7]: null, [Square.h8]: null,
    };
    protected static currentTurn: Color = Color.White;
    protected static moveCount: number = 0;
    protected static halfMoveCount: number = 0;

    /**
     * Color Long mean Color player's queen side, Color Short mean Color player's king side.
     */
    protected static castlingStatus: CastlingStatus = {
        [CastlingType.WhiteLong]: true,
        [CastlingType.WhiteShort]: true,
        [CastlingType.BlackLong]: true,
        [CastlingType.BlackShort]: true
    }

    /**
     * Piece ID's of pawn that "can't" en passant(why don't we store as "can"? because this way more easy and optimized).
     */
    protected static enPassantBanStatus: EnPassantBanStatus = {};

    /**
     * Store the kings of the game.
     */
    protected static kings: Kings = {
        [Color.White]: null,
        [Color.Black]: null
    }

    /**
     * List of piece ids.
     */
    protected static pieceIds: Array<number> = [];
}