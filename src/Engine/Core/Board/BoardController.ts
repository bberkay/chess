import { Board } from "./Board";
import { Color, Square, PieceType } from "Types";
import { CastlingType, EnPassantDirection, Castling, EnPassant, Piece } from "Types/Engine";
import { BoardTraverser } from "./BoardTraverser";
import { PieceModel } from "Engine/Models/PieceModel";


/**
 * This class provides the board management of the game.
 */
export class BoardController extends Board{

    /**
     * Set current player's color
     *
     * Note: Generally this function is used for loading a game from cache,
     * it is not recommended to use it for other purposes.
     */
    public setPlayerColor(color: Color): void
    {
        Board.currentColor = color;
    }

    /**
     * Change turn(change current player's color to enemy color)
     */
    public changeTurn(): void
    {
        Board.currentColor = BoardTraverser.getEnemyColor();
    }

    /**
     * Increase move count
     */
    public increaseMoveCount(): void
    {
        Board.moveCount += 1;
    }

    /**
     * Set move count
     *
     * Note: Generally this function is used for loading a game from cache,
     * it is not recommended to use it for other purposes.
     */
    public setMoveCount(count: number): void
    {
        if(count < 0)
            throw new Error("Move count can't be negative");

        Board.moveCount = count;
    }

    /**
     * Create piece id for the piece(between 1000 and 9999).
     */
    private createPieceID(): number
    {
        let id = Math.floor(Math.random() * 10000) + 1000

        // If the id is already used, create a new one.
        if (Board.pieceIds.includes(id))
            this.createPieceID();
        else // If the id is not used, add it to the list.
            Board.pieceIds.push(id);

        return id
    }

    /**
     * This function creates pieces with the given position.
     * @example createPieces([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2},
     * {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}]); This will create two
     * white pawns on a2 and b2.
     */
    public createPieces(pieces:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of pieces){
            this.createPiece(piece.color, piece.type, piece.square);
        }
    }

    /**
     * This function creates a piece with the given color, type and square.
     * @example createPiece(Color.White, PieceType.Pawn, Square.a2); This will create a white pawn on a2.
     */
    public createPiece(color: Color, type:PieceType, square:Square): void
    {
        const piece = new PieceModel(color, type, this.createPieceID());

        // Set piece to square
        this.movePiece(square, piece);

        // Set king if the piece is a king and there is no king of the same color
        if(type === PieceType.King && !BoardTraverser.getKingByColor(color))
            this.setKing(piece);
    }

    /**
     * Add piece to square
     */
    public movePiece(to: Square, piece: Piece): void
    {
        BoardController.currentBoard[to] = piece;
        BoardController.currentBoard[BoardTraverser.getSquareOfPiece(piece)!] = null;
    }

    /**
     * Remove piece from square
     */
    public removePiece(square: Square): void
    {
        BoardController.currentBoard[square] = null;
    }

    /**
     * Set king of the given color
     */
    private setKing(piece: Piece): void
    {
        BoardController.kings[piece.getColor()] = piece;
    }

    /**
     * Change castling status
     * @example StateManager.setCastlingStatus(CastlingType.WhiteLong, false), That means white long castling is disabled
     */
    public changeCastlingStatus(castlingType: CastlingType, value: boolean): void
    {
        Board.castlingStatus[castlingType] = value;
    }

    /**
     * Add piece(id) that can't en passant to en passant status list
     * @example StateManager.addBannedEnPassantPawn(pieceId, EnPassantDirection.Left), That means piece(id) can't en passant to left.
     */
    public addBannedEnPassantPawn(pieceID: number, direction: EnPassantDirection): void
    {
        Board.bannedEnPassantPawns[pieceID] = direction;
    }

    /**
     * Set castling status
     *
     * Note: Generally this function is used for loading a game from cache,
     * it is not recommended to use it for other purposes.
     */
    public initCastlingStatus(castlingStatus: Castling | null = null): void
    {
        Board.castlingStatus = castlingStatus ? castlingStatus : {
            [CastlingType.WhiteLong]: true,
            [CastlingType.WhiteShort]: true,
            [CastlingType.BlackLong]: true,
            [CastlingType.BlackShort]: true,
            [CastlingType.Long]: true,
            [CastlingType.Short]: true,
        };
    }

    /**
     * Set piece id list to the given list
     *
     * Note: Generally this function is used for loading a game from cache,
     * it is not recommended to use it for other purposes.
     */
    public initPieceIds(pieceIds: Array<number> | null): void
    {
        BoardController.pieceIds = pieceIds ?? [];
    }

    /**
     * Set en passant status of pawn list
     *
     * Note: Generally this function is used for loading a game from cache,
     * it is not recommended to use it for other purposes.
     */
    public initBannedEnPassantPawns(enPassantPawns: EnPassant | null = null): void
    {
        Board.bannedEnPassantPawns = !enPassantPawns ? {} : enPassantPawns;
    }

    /**
     * Reset state manager to default
     */
    public clear(): void
    {
        this.setPlayerColor(Color.White);
        this.setMoveCount(0);
        this.initCastlingStatus();
        this.initBannedEnPassantPawns();
    }
}