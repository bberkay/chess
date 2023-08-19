import { Board } from "./Board";
import { Color, Square, PieceType } from "Types";
import { CastlingType, EnPassantDirection, Piece, StartConfig } from "Types/Engine";
import { BoardQueryer } from "./BoardQueryer.ts";
import { PieceModel } from "Engine/Models/PieceModel";


/**
 * This class provides the board management of the game.
 */
export class BoardManager extends Board{

    /**
     * Constructor of the BoardController class.
     * @example new BoardController({startColor: Color.White, moveCount: 0, castlingStatus: {whiteLong: true, whiteShort: true, blackLong: true, blackShort: true}, enPassantBanStatus: {}, pieceIds: []});
     */
    constructor(startOption: StartConfig | null = null) {
        super();

        /**
         * If startOption is not null, set the start options.
         * If options is not given, set the default options.
         */
        if(startOption !== null){
            Board.currentColor = startOption.startColor ?? Board.currentColor;
            Board.moveCount = startOption.moveCount ?? Board.moveCount;
            Board.castlingStatus = startOption.castlingStatus ?? Board.castlingStatus;
            Board.enPassantBanStatus = startOption.enPassantBanStatus ?? Board.enPassantBanStatus;
            Board.pieceIds = startOption.pieceIds ?? Board.pieceIds;
        }
    }

    /**
     * Change turn(change current player's color to enemy color)
     */
    public changeTurn(): void
    {
        Board.currentColor = BoardQueryer.getEnemyColor();
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
        const piece = new PieceModel(color, type, this.createPieceID());

        // Set piece to square
        this.movePiece(square, piece);

        // Set king if the piece is a king and there is no king of the same color
        if(type === PieceType.King && !BoardQueryer.getKingByColor(color))
            BoardController.kings[piece.getColor() as Color] = piece;
    }

    /**
     * Add piece to square
     */
    public movePiece(to: Square, piece: Piece): void
    {
        BoardController.currentBoard[to] = piece;
        BoardController.currentBoard[BoardQueryer.getSquareOfPiece(piece)!] = null;
    }

    /**
     * Remove piece from square
     */
    public removePiece(square: Square): void
    {
        BoardController.currentBoard[square] = null;
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
}