import { Board } from "./Board";
import { Color, Square, PieceType, JsonNotation } from "../../../Types";
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
        Board.halfMoveCount = jsonNotation.halfMoveClock;
        Board.bannedEnPassantSquares = Board.bannedEnPassantSquares
            ? Board.bannedEnPassantSquares.splice(Board.bannedEnPassantSquares.indexOf(jsonNotation.enPassant!, 1))
            : []; // Remove en passant square from banned en passant squares.

        // Create pieces
        this.createPieces(jsonNotation.board);
    }

    /**
     * Load the board from the given json notation.
     */
    public loadBoard(jsonNotation: JsonNotation, bannedEnPassantSquares: Array<Square>): void
    {
        this.createBoard(jsonNotation);
        Board.bannedEnPassantSquares = bannedEnPassantSquares;
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
        // Create piece
        const piece: PieceModel = new PieceModel(color, type);

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

    /**
     * Ban en passant square
     */
    public banEnPassantSquare(square: Square): void
    {
        Board.bannedEnPassantSquares.push(square);
    }
}