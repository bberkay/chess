import { Board } from "./Board";
import { Color, Square, PieceType, CastlingType, EnPassantDirection, JsonNotation } from "Types";
import { Piece } from "Types/Engine";
import { BoardQueryer } from "./BoardQueryer.ts";
import { PieceModel } from "Engine/Models/PieceModel";


/**
 * This class provides the board management of the game.
 */
export class BoardManager extends Board{

    /**
     * Constructor of the BoardController class.
     */
    constructor() {
        super();
    }

    /**
     * This function creates a new board with the given json notation.
     */
    public createBoard(jsonNotation: JsonNotation): void
    {
        Board.currentTurn = jsonNotation.turn;
        Board.moveCount = jsonNotation.fullMoveNumber;
        Board.castlingStatus = jsonNotation.castling;
        Board.enPassantBanStatus = jsonNotation.enPassant;
        Board.halfMoveCount = jsonNotation.halfMoveClock;
    }

    /**
     * Load the board from the given json notation.
     */
    public loadBoard(jsonNotation: JsonNotation, pieceIds: Array<number>): void
    {
        this.createBoard(jsonNotation);
        Board.pieceIds = pieceIds;
    }

    /**
     * Change turn(change current player's color to enemy color)
     */
    public changeTurn(): void
    {
        Board.currentTurn = BoardQueryer.getOpponent();
    }

    /**
     * Increase move count
     */
    public increaseMoveCount(): void
    {
        Board.moveCount += 1;
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
        const piece: PieceModel = new PieceModel(color, type, this.createPieceID());

        // Set piece to square
        this.movePiece(square, piece);

        // Set king if the piece is a king and there is no king of the same color
        if(type === PieceType.King && !BoardQueryer.getKingByColor(color))
            BoardManager.kings[piece.getColor() as Color] = piece;
    }

    /**
     * Add piece to square
     */
    public movePiece(to: Square, piece: Piece): void
    {
        BoardManager.currentBoard[to] = piece;
        BoardManager.currentBoard[BoardQueryer.getSquareOfPiece(piece)!] = null;
    }

    /**
     * Remove piece from square
     */
    public removePiece(square: Square): void
    {
        BoardManager.currentBoard[square] = null;
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
    public setBannedEnPassant(pieceID: number, direction: EnPassantDirection): void
    {
        Board.enPassantBanStatus[pieceID] = direction;
    }
}