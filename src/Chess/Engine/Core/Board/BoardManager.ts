import {Board} from "./Board";
import {CastlingType, Color, JsonNotation, PieceType, Square} from "../../../Types";
import {BoardQueryer} from "./BoardQueryer.ts";
import {PieceModel} from "../../Models/PieceModel";

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
        // Reset board by setting all squares to null.
        for(let square in Board.currentBoard){
            Board.currentBoard[Number(square) as Square] = null;
        }

        /**
         * Create board and set the current properties by the given json notation.
         * @see for more information about json notation src/Types.ts
         * @see for more information about fen notation https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
         */
        this.createPieces(jsonNotation.board);
        Board.currentTurn = jsonNotation.turn;
        Board.moveCount = jsonNotation.fullMoveNumber;
        Board.halfMoveCount = jsonNotation.halfMoveClock;
        Board.castlingAvailability = jsonNotation.castling;
        Board.enPassantSquare = jsonNotation.enPassant;
        Board.moveHistory = jsonNotation.moveHistory ?? [];
        Board.bannedEnPassantSquares = [];
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
        // Create piece on the given square.
        Board.currentBoard[square] = new PieceModel(color, type);
    }

    /**
     * Add piece to square
     */
    public movePiece(from: Square, to:Square): void
    {
        /**
         * If the moved piece is a pawn or capture move then set half move count to 0
         * else increase half move count.
         * @see for more information about half move count https://en.wikipedia.org/wiki/Fifty-move_rule
         */
        Board.halfMoveCount = (BoardQueryer.isSquareHasPiece(to) || BoardQueryer.getPieceOnSquare(from)?.getType() === PieceType.Pawn)
            ? 0
            : Board.halfMoveCount + 1;

        // Move piece from square to square.
        Board.currentBoard[to] = BoardQueryer.getPieceOnSquare(from)!;
        Board.currentBoard[from] = null;
    }

    /**
     * Remove piece from square
     */
    public removePiece(square: Square): void
    {
        Board.currentBoard[square] = null;
    }

    /**
     * Change turn(change current player's color to enemy color)
     */
    public changeTurn(): void
    {
        Board.currentTurn = BoardQueryer.getColorOfOpponent();
        Board.moveCount += Board.currentTurn === Color.White ? 1 : 0;
    }

    /**
     * Add move to history
     */
    public addMoveToHistory(move: string): void
    {
        Board.moveHistory.push(move);
    }

    /**
     * Give en passant availability to the given square
     */
    public enableEnPassant(square: Square | null): void
    {
        Board.enPassantSquare = square;
    }

    /**
     * Change castling availability
     */
    public changeCastlingAvailability(castlingType: CastlingType, value: boolean): void
    {
        Board.castlingAvailability[castlingType] = value;
    }

    /**
     * Ban en passant square
     */
    public banEnPassantSquare(square: Square): void
    {
        Board.bannedEnPassantSquares.push(square);
    }
}