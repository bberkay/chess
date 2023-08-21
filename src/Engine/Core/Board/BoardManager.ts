import { Board } from "./Board";
import { Color, Square, PieceType, JsonNotation } from "../../../Types";
import { EnPassantBanStatus } from "../../../Types/Engine";
import { BoardQueryer } from "./BoardQueryer.ts";
import { PieceModel } from "../../Models/PieceModel";


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
        // Set board properties
        Board.currentTurn = jsonNotation.turn;
        Board.moveCount = jsonNotation.fullMoveNumber;
        Board.castlingStatus = jsonNotation.castling;
        Board.halfMoveCount = jsonNotation.halfMoveClock;

        // Create pieces
        this.createPieces(jsonNotation.board);
    }

    /**
     * Load the board from the given json notation.
     */
    public loadBoard(jsonNotation: JsonNotation, enPassantBanStatus: EnPassantBanStatus, pieceIds: Array<number>): void
    {
        this.createBoard(jsonNotation);
        Board.enPassantBanStatus = enPassantBanStatus;
        Board.pieceIds = pieceIds;
    }

    /**
     * Change turn(change current player's color to enemy color)
     */
    public changeTurn(): void
    {
        Board.currentTurn = BoardQueryer.getColorOfOpponent();
        Board.moveCount += 1;
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
        /**
         * Create piece id for the piece(between 1000 and 9999).
         */
        function createPieceID(): number
        {
            let id = Math.floor(Math.random() * 10000) + 1000

            // If the id is already used, create a new one.
            if (Board.pieceIds.includes(id))
                createPieceID();
            else // If the id is not used, add it to the list.
                Board.pieceIds.push(id);

            return id
        }

        // Create piece
        const piece: PieceModel = new PieceModel(color, type, createPieceID());

        // Set piece to square
        BoardManager.currentBoard[square] = piece;

        // Set king if the piece is a king and there is no king of the same color
        if(type === PieceType.King && !BoardQueryer.getKingByColor(color))
            BoardManager.kings[piece.getColor() as Color] = piece;
    }

    /**
     * Add piece to square
     */
    public movePiece(from: Square, to:Square): void
    {
        BoardManager.currentBoard[to] = BoardQueryer.getPieceOnSquare(from);
        BoardManager.currentBoard[from] = null;
    }

    /**
     * Remove piece from square
     */
    public removePiece(square: Square): void
    {
        BoardManager.currentBoard[square] = null;
    }
}