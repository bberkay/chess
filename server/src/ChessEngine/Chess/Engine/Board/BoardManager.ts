import {Board} from "./Board.ts";
import {CastlingType, Color, JsonNotation, PieceType, Square, GameStatus, Pieces, MoveType, Move} from "../../Types";
import {BoardQuerier} from "./BoardQuerier.ts";
import {PieceModel} from "../Models/PieceModel.ts";
import {Piece} from "../Types";
import { Converter } from "@Chess/Utils/Converter.ts";

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
    protected createBoard(jsonNotation: JsonNotation): void
    {
        // Reset board by setting all squares to null.
        for(let square in Board.currentBoard){
            Board.currentBoard[Number(square) as Square] = null;
        }

        /**
         * Create board and set the current properties by the given json notation.
         * @see for more information about json notation src/Chess/Types/index.ts
         * @see for more information about fen notation https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
         */
        this.createPieces(jsonNotation.board);
        Board.currentTurn = jsonNotation.turn;
        Board.moveCount = jsonNotation.fullMoveNumber;
        Board.halfMoveCount = jsonNotation.halfMoveClock;
        Board.castling = jsonNotation.castling;
        Board.enPassant = jsonNotation.enPassant;
        Board.algebraicNotation = jsonNotation.algebraicNotation ?? [];
        Board.scores = jsonNotation.scores ?? {[Color.White]: {score: 0, pieces: []}, [Color.Black]: {score: 0, pieces: []}};
        Board.moveHistory = jsonNotation.moveHistory ?? [];
        Board.boardHistory = jsonNotation.boardHistory ?? [];
        Board.durations = jsonNotation.durations ?? null;
        Board.gameStatus = jsonNotation.gameStatus ?? Board.gameStatus;
        this.calculateScores();
        if(!jsonNotation.moveHistory || jsonNotation.moveHistory.length == 0)
            this.saveCurrentBoard();
    }

    /**
     * This function creates pieces with the given position.
     * @example createPieces([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2},
     * {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}]); This will create two
     * white pawns on a2 and b2.
     */
    protected createPieces(pieces:Pieces): void
    {
        for(let piece of pieces){
            this.createPieceModel(piece.color, piece.type, piece.square);
        }
    }

    /**
     * This function creates a piece with the given color, type and square.
     */
    protected createPieceModel(color: Color, type:PieceType, square:Square): void
    {
        Board.currentBoard[square] = new PieceModel(color, type);
    }

    /**
     * Remove piece from square
     */
    protected removePieceModel(square: Square): void
    {
        Board.currentBoard[square] = null;
    }

    /**
     * Add piece to square
     */
    protected movePiece(from: Square, to:Square): void
    {
        // Check if the square has a piece and get the piece.
        const fromPiece: Piece | null = BoardQuerier.getPieceOnSquare(from)!;
        const toPiece: Piece | null = BoardQuerier.getPieceOnSquare(to);

        /**
         * If the moved piece is a pawn or capture move then set half move count to 0
         * else increase half move count. Also, if the moved piece is a king and the
         * move is a castling move then set half move count to 0 because when the
         * castling move is done in _doCastling function, function will use this
         * function twice and this will increase the half move count by 2.
         * @see for more information about half move count https://en.wikipedia.org/wiki/Fifty-move_rule
         */
        if(fromPiece.getType() == PieceType.King && Math.abs(from - to) == 2)
            Board.halfMoveCount = 0;
        else
            Board.halfMoveCount = toPiece || fromPiece.getType() === PieceType.Pawn ? 0 : Board.halfMoveCount + 1;

        // Calculate score of the move if the move is a capture move.
        this.updateScores(to);

        // Move piece from square to square.
        Board.currentBoard[to] = fromPiece;
        Board.currentBoard[from] = null;
    }

    /**
     * Set en passant square
     */
    protected setEnPassant(square: Square | null): void
    {
        Board.enPassant = square;
    }

    /**
     * Change castling availability
     */
    protected disableCastling(castlingType: CastlingType): void
    {
        Board.castling[castlingType] = false;
    }

    /**
     * Change color to oppenent's color and increase move count
     */
    protected changeTurn(): void
    {
        Board.currentTurn = BoardQuerier.getColorOfOpponent();
        Board.moveCount += Board.currentTurn === Color.White ? 1 : 0;
    }

    /**
     * Change turn color to the given color. This is mostly
     * used for precalculations of the moves.
     */
    protected changeTurnColor(color: Color): void
    {
        Board.currentTurn = color;
    }

    /**
     * Calculate the scores of the players by checking the pieces of the players.
     * 
     * @see for more information about piece scores https://en.wikipedia.org/wiki/Chess_piece_relative_value
     */
    protected calculateScores(): void 
    {
        Board.scores = {[Color.White]: {score: 0, pieces: []}, [Color.Black]: {score: 0, pieces: []}};
        for(const pieceType of [PieceType.Pawn, PieceType.Knight, PieceType.Bishop, PieceType.Rook, PieceType.Queen]) {
            const whitePieces = BoardQuerier.getPiecesWithFilter(Color.White, [pieceType]);
            const blackPieces = BoardQuerier.getPiecesWithFilter(Color.Black, [pieceType]);
            const whiteDifference = whitePieces.length - blackPieces.length;
            const winnerDifference = whiteDifference > 0 ? whiteDifference : Math.abs(whiteDifference);
            const winnerColor = whiteDifference > 0 ? Color.White : Color.Black;
            Board.scores[winnerColor].score += (winnerDifference) * (new PieceModel(winnerColor, pieceType)).getScore();
            for(let i = 0; i < winnerDifference; i++) {
                Board.scores[winnerColor].pieces.push(pieceType);
            }
        }
        
        const scoreDifference = Board.scores[Color.White].score - Board.scores[Color.Black].score;
        if(scoreDifference !== 0) {
            const scoreDifferenceWinner = scoreDifference > 0 ? Color.White : Color.Black;
            const scoreDifferenceLoser = scoreDifferenceWinner == Color.White ? Color.Black : Color.White;
            Board.scores[scoreDifferenceWinner].score -= Board.scores[scoreDifferenceLoser].score;
            Board.scores[scoreDifferenceLoser].score = -Board.scores[scoreDifferenceWinner].score;
        }
    }

    /**
     * Find the score of the piece if the move is a capture move, add the score to the
     * current player's score. Also, calculate the pieces of the player by checking the
     * enemy player's pieces.
     *
     * @see for more information about piece scores https://en.wikipedia.org/wiki/Chess_piece_relative_value
     */
    protected updateScores(capturedSquare: Square): void
    {
        const enemyColor: Color = Board.currentTurn == Color.White ? Color.Black : Color.White;
        const capturedPiece: Piece = BoardQuerier.getPieceOnSquare(capturedSquare)!;
        if(!capturedPiece && capturedSquare != Board.enPassant)
            return;

        /**
         * Increase the score of the current player and decrease the score of the enemy
         * player by the score of the piece. For example, if white captures a black pawn
         * then increase the score of the white player by 1 and decrease the score of the
         * black player by 1.
         */
        Board.scores[Board.currentTurn].score += Board.enPassant == capturedSquare ? 1 : capturedPiece.getScore();
        Board.scores[enemyColor].score -= Board.enPassant == capturedSquare ? 1 : capturedPiece.getScore();

        /**
         * Add captured piece to the current player's pieces if the piece is not in the
         * enemy player's pieces else remove the piece from the enemy player's pieces.
         * For example, if white captures a black pawn and the black player has 2 pawns
         * then remove one of the pawns from the black player's pieces. If the black
         * player has no pawn then add the pawn to the white player's pieces.
         */
        const enemyPlayersPieces: Array<PieceType> = Board.scores[enemyColor].pieces;
        const capturedPieceType: PieceType = Board.enPassant == capturedSquare ? PieceType.Pawn : capturedPiece.getType();
        if(enemyPlayersPieces.includes(capturedPieceType))
            enemyPlayersPieces.splice(enemyPlayersPieces.indexOf(capturedPieceType), 1);
        else
            Board.scores[Board.currentTurn].pieces.push(capturedPieceType);
    }

    /**
     * Update remaining time of the player.
     */
    protected updateRemainingTime(player: Color, remainingTime: number): void
    {
        if(!Board.durations)
            return;

        Board.durations[player].remaining = remainingTime;
    }

    /**
     * Add move to algebraic notation
     */
    protected saveAlgebraicNotation(move: string): void
    {
        Board.algebraicNotation.push(move);
    }

    /**
     * Add move to move history
     */
    protected saveMove(from: Square, to: Square, type: MoveType | null = null): void
    {
        const move: Move = {from: from, to: to};
        if(type) move.type = type
        Board.moveHistory.push(move);
    }

    /**
     * Save board to history
     */
    protected saveCurrentBoard(): void
    {
        const game = BoardQuerier.getGame();
        delete game.boardHistory;
        Board.boardHistory.push(JSON.parse(JSON.stringify(game)));
    }

    /**
     * Set game status
     */
    protected setGameStatus(gameStatus: GameStatus): void
    {
        Board.gameStatus = gameStatus;
    }

}
