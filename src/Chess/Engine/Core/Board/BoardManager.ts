import {Board} from "./Board";
import {CastlingType, Color, JsonNotation, PieceType, Square} from "../../../Types";
import {BoardQueryer} from "./BoardQueryer.ts";
import {PieceModel} from "../../Models/PieceModel";
import {Piece} from "../../Types";

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
        Board.scores = jsonNotation.scores ?? {[Color.White]: {score: 0, pieces: []}, [Color.Black]: {score: 0, pieces: []}};
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
        // Check if the square has a piece and get the piece.
        const fromPiece: Piece | null = BoardQueryer.getPieceOnSquare(from)!;
        const toPiece: Piece | null = BoardQueryer.getPieceOnSquare(to);

        /**
         * Find the score of the piece if the move is a capture move, add the score to the
         * current player's score. Also, calculate the pieces of the player by checking the
         * enemy player's pieces.
         *
         * @see for more information about piece scores https://en.wikipedia.org/wiki/Chess_piece_relative_value
         */
        function calculateScoreOfMove(){
            if(toPiece && toPiece.getColor() !== Board.currentTurn)
            {
                // FIXME: Promote da hesaplanmalı.

                const enemyColor: Color = Board.currentTurn == Color.White ? Color.Black : Color.White;

                /**
                 * Increase the score of the current player and decrease the score of the enemy
                 * player by the score of the piece. For example, if white captures a black pawn
                 * then increase the score of the white player by 1 and decrease the score of the
                 * black player by 1.
                 */
                Board.scores[Board.currentTurn].score += toPiece.getScore();
                Board.scores[enemyColor].score -= toPiece.getScore();

                /**
                 * Add captured piece to the current player's pieces if the piece is not in the
                 * enemy player's pieces else remove the piece from the enemy player's pieces.
                 * For example, if white captures a black pawn and the black player has 2 pawns
                 * then remove one of the pawns from the black player's pieces. If the black
                 * player has no pawn then add the pawn to the white player's pieces.
                 */
                const enemyPlayersPieces: Array<PieceType> = Board.scores[enemyColor].pieces;
                if(enemyPlayersPieces.includes(toPiece.getType()))
                    enemyPlayersPieces.splice(enemyPlayersPieces.indexOf(toPiece.getType()), 1);
                else
                    Board.scores[Board.currentTurn].pieces.push(toPiece.getType());
            }
        }

        /**
         * If the moved piece is a pawn or capture move then set half move count to 0
         * else increase half move count.
         * @see for more information about half move count https://en.wikipedia.org/wiki/Fifty-move_rule
         */
        Board.halfMoveCount = toPiece || fromPiece.getType() === PieceType.Pawn ? 0 : Board.halfMoveCount + 1;

        // Calculate score of the move.
        calculateScoreOfMove();

        // Move piece from square to square.
        Board.currentBoard[to] = fromPiece;
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