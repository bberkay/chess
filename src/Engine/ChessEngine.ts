/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess game(does not include board or other ui components).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import {
    CastlingType,
    Color,
    GameStatus,
    JsonNotation,
    Moves,
    MoveType,
    PieceType,
    Square,
    StartPosition
} from "../Types";
import {MoveEngine} from "./Core/Move/MoveEngine";
import {BoardManager} from "./Core/Board/BoardManager.ts";
import {Converter} from "../Utils/Converter";
import {BoardQueryer} from "./Core/Board/BoardQueryer.ts";
import {Locator} from "./Core/Utils/Locator.ts";
import {Piece} from "../Types/Engine";
import {RouteCalculator} from "./Core/Move/Calculator/RouteCalculator.ts";
import {Extractor} from "./Core/Utils/Extractor.ts";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine{

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private boardManager: BoardManager;
    private statusOfGame: GameStatus = GameStatus.InPlay;
    private playedFrom: Square | null = null;
    private playedTo: Square | null = null;
    private moveNotation: string = "";
    private currentMoves: Moves | null = null;
    private calculatedMoves: {[key in Square]?: Moves | null} = {};
    private isPromotionMenuOpen: boolean = false;

    /**
     * Constructor of the ChessEngine class.
     */
    constructor(){
        this.moveEngine = new MoveEngine();
        this.boardManager = new BoardManager();
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/types.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        // Create the board with the given position.
        this.boardManager.createBoard(typeof position == "string" ? Converter.convertFenToJson(position) : position);
    }

    /**
     * This function returns the current game as fen notation.
     */
    public getGameAsFenNotation(): string
    {
        return Converter.convertJsonToFen(BoardQueryer.getGame());
    }

    /**
     * This function returns the current game as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation
    {
        return BoardQueryer.getGame();
    }

    /**
     * This function check the select is legal or not by checking the piece's color
     * and the color of the turn.
     */
    public isSquareSelectable(select: Square): boolean
    {
        /**
         * If there is no piece on the given square or the piece's color
         * is not equal to the color of the turn, return false.
         */
        return !(!BoardQueryer.getPieceOnSquare(select) || BoardQueryer.getPieceOnSquare(select)?.getColor() !== BoardQueryer.getColorOfTurn());
    }

    /**
     * This function checks and find the given move. For example,
     * if the given move is not in the currentMoves, it returns false.
     * Otherwise, it returns the move type.
     */
    private findMoveType(): MoveType | null
    {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if(this.currentMoves === null)
            return null;

        // Find the given move in the currentMoves.
        for(const moveType in this.currentMoves){
            // If the move type is null or undefined then skip the loop.
            if(!this.currentMoves[moveType as MoveType])
                continue;

            // Loop through the moves of the move type.
            for(let move of this.currentMoves[moveType as MoveType]!){
                if(move === this.playedTo)
                    return moveType as MoveType;
            }
        }

        // If the given move is not in the currentMoves, return null.
        return null;
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Moves | null
    {
        if(!this.isSquareSelectable(square))
            return null;

        /**
         * Get the moves of square with move engine. If the moves of the square
         * is already calculated then get the moves from the calculatedMoves.
         * Otherwise, calculate the moves with move engine and save the moves
         */
        this.currentMoves = this.calculatedMoves[square] ?? this.moveEngine.getMoves(square);
        this.calculatedMoves[square] = this.currentMoves;

        return this.currentMoves;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        this.playedFrom = from!;
        this.playedTo = to!;

        // Do the move.
        if(this.isPromotionMenuOpen){
            /**
             * If the given move is a promote move(not promotion),
             * then promote the piece and return. Because, promote
             * move isn't a move type and when user do a promotion
             * move then the turn doesn't change and user must
             * promote the piece from board or engine.
             * @see _doPromote function.
             */
            this._doPromote(from, to);
        }
        else{
            // Check if the given move is valid.
            const move: MoveType | null = this.findMoveType();
            if(!move)
                return;

            // Play the move according to the move type.
            switch(move){
                case MoveType.Castling:
                    this._doCastling();
                    break;
                case MoveType.EnPassant:
                    this._doEnPassant();
                    break;
                case MoveType.Promotion:
                    this._doPromotion();
                    break;
                case MoveType.Normal:
                    this._doNormalMove(from, to, true);
                    break;
            }
        }

        /**
         * If move is promotion move, then don't change the turn.
         * Because, user must promote the piece.
         */
        if(!this.isPromotionMenuOpen){
            this.finishTurn();
        }
    }

    /**
     * Do the normal move.
     */
    private _doNormalMove(from: Square, to: Square, saveToHistory:boolean = false): void
    {
        if(saveToHistory){
            /**
             * Set the current move for the move history.
             * @see For more information about history, see https://en.wikipedia.org/wiki/Algebraic_notation_(chess)
             */
            const piece: Piece = BoardQueryer.getPieceOnSquare(from)!;

            // If the piece is not pawn then add the piece name to the current move.
            if(piece?.getType() != PieceType.Pawn)
                this.moveNotation += Converter.convertPieceTypeToPieceName(piece.getType(), piece.getColor());

            // If the move kill a piece then add "x" to the current move.
            if(BoardQueryer.isSquareHasPiece(to)){
                // If the piece is pawn then add the column of the pawn to the current move.
                if(piece?.getType() == PieceType.Pawn)
                    this.moveNotation += Converter.convertSquareIDToSquare(from)[0];
                this.moveNotation += "x";
            }

            // Add the target square to the current move.
            this.moveNotation += Converter.convertSquareIDToSquare(to);
        }

        // Move the piece.
        this.boardManager.movePiece(from, to);
    }

    /**
     * Do the castling move.
     */
    private _doCastling(): void
    {
        /**
         * Get the castling type by measuring the distance between
         * the "from"(king) and "to"(rook). If the distance is greater
         * than 3 then it is a long castling otherwise it is a short
         * castling.
         *
         * @see For more information about castling, see https://en.wikipedia.org/wiki/Castling
         * @see For more information about square ids, see src/Types/index.ts
         */
        const castlingType: "Long" | "Short" = Number(this.playedFrom) - Number(this.playedTo) > 3
            ? "Long" : "Short";

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the "from" otherwise 2 squares
         * right of the "from".
         */
        const kingNewSquare: number = castlingType == "Long" ? Number(this.playedFrom) - 2 : Number(this.playedFrom) + 2;

        this._doNormalMove(this.playedFrom as Square, kingNewSquare as Square);

        /**
         * If the castling is long then the rook's current square
         * is 4 square left of "from" and rook's new square is
         * must be 1 square right of the kingNewSquare, if the castling
         * is short then rook's current square is 3 square right of "from"
         * and rook's new square is must be 1 square left of the kingNewSquare.
         * For example, if the castling is long and the king's current square
         * is "e1" then the rook's current square is "a1" and rook's new square
         * is "d1".
         */
        const rook: number = castlingType == "Long" ? Number(this.playedFrom) - 4 : Number(this.playedFrom) + 3;
        const rookNewSquare: number = castlingType == "Long" ? kingNewSquare + 1 : kingNewSquare - 1;

        this._doNormalMove(rook, rookNewSquare as Square);

        // Change castling availability.
        this.boardManager.changeCastlingAvailability((BoardQueryer.getColorOfTurn() + castlingType) as CastlingType, false);

        // Set the current move for the move history.
        this.moveNotation += castlingType == "Short" ? "O-O" : "O-O-O";
    }

    /**
     * Do the en passant move.
     */
    private _doEnPassant(): void
    {
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square, true);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Types/index.ts
         */
        const killedPieceSquare = Number(this.playedTo) + (BoardQueryer.getPieceOnSquare(this.playedTo as Square)?.getColor() == Color.White ? 8 : -8);

        // Remove the killed piece.
        this.boardManager.removePiece(killedPieceSquare);
    }

    /**
     * Do the promote move.
     */
    private _doPromotion(): void
    {
        // Move the pawn.
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square, true);
        this.isPromotionMenuOpen = true;
    }

    /**
     * Do the promote move.
     * @example _doPromote(Square.a8, PieceType.Queen)
     *
     * if selectedPromote is given Square then Engine will simulate the promotion menu.
     * @example _doPromote(Square.e8, Square.e8) // Creates a queen on e8(white),
     * @example _doPromote(Square.e8, Square.e7) // Creates a rook on e8(white)
     * @example _doPromote(Square.e8, Square.e6) // Creates a bishop on e8(white)
     * @example _doPromote(Square.e8, Square.e5) // Creates a knight on e8(white),
     * @example _doPromote(Square.e1, Square.e1) // Creates a queen on e1(black),
     * @example _doPromote(Square.e1, Square.e2) // Creates a rook on e1(black)
     * @example _doPromote(Square.e1, Square.e3) // Creates a bishop on e1(black)
     * @example _doPromote(Square.e1, Square.e4) // Creates a knight on e1(black)
     */
    private _doPromote(from: Square, selectedPromote: Square | PieceType.Queen | PieceType.Rook | PieceType.Bishop | PieceType.Knight): void
    {
        // Remove the pawn.
        this.boardManager.removePiece(from);

        // If selected promote is square:
        if(selectedPromote in Square){
            /**
             * Get the piece by clicked square's(to) row.
             * If the clicked row is 8 or 1 then the selected piece
             * type is queen, if the clicked row is 7 or 2 then the selected
             * piece type is rook, if the clicked row is 6 or 3 then the
             * selected piece type is bishop, if the clicked row is 5 or 4
             * then the selected piece type is knight(this is engine simulation/
             * version of the promotion menu)
             *
             * (4x4) ASCII representation of the promotion menu for white(S is square, Q is queen,
             * R is rook, B is bishop, K is knight):
             * S | S | Q | S - 8
             * S | S | R | S - 7
             * S | S | B | S - 6
             * S | S | K | S - 5
             * S | S | S | S - 4
             * a - b - c - d
             *
             * @see For more information about promotion, see https://en.wikipedia.org/wiki/Promotion_(chess)
             * @see For more information about promotion menu, see showPromotionMenu() src/Interface/ChessBoard.ts
             */
            const clickedRow: number = Locator.getRow(selectedPromote as Square);
            selectedPromote = (([8, 1].includes(clickedRow) ? PieceType.Queen : null)
                || ([7, 2].includes(clickedRow) ? PieceType.Rook : null)
                || ([6, 3].includes(clickedRow) ? PieceType.Bishop : null)
                || ([5, 4].includes(clickedRow) ? PieceType.Knight : null))!;
        }

        // Get the player's color.
        const playerColor: Color = BoardQueryer.getColorOfTurn();

        // Create the new piece.
        this.boardManager.createPiece(playerColor, selectedPromote as PieceType, from);

        // Finish the promotion.
        this.isPromotionMenuOpen = false;

        // Set the current move for the move history.
        this.moveNotation += "=" + Converter.convertPieceTypeToPieceName(selectedPromote as PieceType, playerColor);
    }

    /**
     * End the turn with some controls and check the game is finished or not.
     */
    private finishTurn(): void
    {
        /**
         * Order of the functions is important.
         *
         * Example scenario for White:
         * 1- Control en passant moves for White(because, if White not play en passant move in one turn then remove the move)
         * 2- Control castling moves for White(because, if White move the king or rook then disable the castling)
         * 3- Change the turn(White -> Black)
         * 4- Check the game is finished or not for Black
         * 5- Add the White player's move to the history
         * 6- Clear the current move
         */
        this.calculatedMoves = {};
        this.currentMoves = null;
        this._checkCastling();
        this._checkEnPassant();
        this.boardManager.changeTurn();
        this._checkStatusOfGame();
        this.boardManager.addMoveToHistory(this.moveNotation);
        this.moveNotation = "";
    }

    /**
     * Check castling moves after each turn. If player move the king or rook
     * then disable the castling.
     *
     * @see castling move calculation: src/Engine/Core/Move/Checker/MoveChecker.ts
     * @see castling rules: https://en.wikipedia.org/wiki/Castling
     */
    private _checkCastling(): void
    {
        if(this.moveNotation == "O-O" || this.moveNotation == "O-O-O")
            return;

        // Find piece's type by the given square of the moved piece.
        const piece: Piece = BoardQueryer.getPieceOnSquare(this.playedTo as Square)!;

        /**
         * If the piece is king then disable the castling short and long
         * moves for the color of the king. If the piece is rook then
         * disable the castling short or long move for the color of the rook
         * and square of the rook.
         *
         * @see For more information about square ids, see src/Types/index.ts
         */
        if(piece.getType() == PieceType.King){
            this.boardManager.changeCastlingAvailability((piece.getColor() + "Long") as CastlingType, false);
            this.boardManager.changeCastlingAvailability((piece.getColor() + "Short") as CastlingType, false);
        }else if(piece.getType() == PieceType.Rook){
            const rookType: "Long" | "Short" = Number(this.playedTo) % 8 == 0 ? "Short" : "Long";
            this.boardManager.changeCastlingAvailability((piece.getColor() + rookType) as CastlingType, false);
        }
    }

    /**
     * Check en passant moves. If there is an en passant move not played
     * then remove it. Because, en passant moves are only valid for one turn.
     *
     * @see For more information about en passant, see src/Engine/Core/Move/Checker/MoveChecker.ts
     * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
     */
    private _checkEnPassant(): void
    {
        /**
         * Find the piece by the given square of the moved piece.
         * If the piece is pawn and move 1 square forward then ban the
         * en passant square. Because, en passant moves are only valid
         * if the enemy pawn move 2 square forward.
         */
        const piece: Piece = BoardQueryer.getPieceOnSquare(this.playedTo as Square)!;
        if(piece.getType() == PieceType.Pawn){
            if(Locator.getRow(Number(this.playedFrom)) == (piece.getColor() == Color.White ? 6 : 3))
                this.boardManager.banEnPassantSquare(piece.getColor() == Color.White ? Number(this.playedTo) + 8 : Number(this.playedTo) - 8);
        }

        // Find player's pawns.
        const pawns: Array<Piece> = BoardQueryer.getPiecesWithFilter(BoardQueryer.getColorOfTurn(), [PieceType.Pawn])!;
        for(const pawn of pawns){
            /**
             * If the pawn is white and on 5th row or is black and on 4th row
             * and the pawn has at least one en passant move then ban the
             * en passant square. Because, en passant moves are only valid
             * for one turn.
             */
            const squareOfPawn: Square = BoardQueryer.getSquareOfPiece(pawn)!;
            if(Locator.getRow(squareOfPawn) == (pawn.getColor() == Color.White ? 4 : 5)){
                const moves: Moves = this.moveEngine.getMoves(squareOfPawn)!;
                if(moves["EnPassant"]!.length > 0){
                    this.boardManager.banEnPassantSquare(moves["EnPassant"]![0]);
                }
            }
        }
    }

    /**
     * This function calculate the game is finished or not and set the status of the game.
     *
     * Control order of game status:
     * 1- Check
     * 2- Checkmate
     * 3- Stalemate
     *
     * @see For more information about game status types please check the src/Types/index.ts
     */
    private _checkStatusOfGame(): void
    {
        /**
         * Get player's color, enemy's color and square of player's king.
         * Then get the id of the squares that the king is threatened by
         * the enemy pieces. For example, if the king is threatened by
         * the enemy queen on the square "h5" and the enemy knight on the
         * square "d6" then the enemySquaresOfPlayersKing is [32, 20].
         *
         * @see For more information about square ids, see src/Types/index.ts
         */
        const playerColor: Color = BoardQueryer.getColorOfTurn();
        const enemyColor: Color = BoardQueryer.getColorOfOpponent();
        const squareOfPlayersKing: Square | null = BoardQueryer.getSquareOfPiece(BoardQueryer.getPiecesWithFilter(playerColor, [PieceType.King])[0]!);
        const enemySquaresOfPlayersKing: Array<Square> = BoardQueryer.isSquareThreatened(squareOfPlayersKing!, enemyColor, true) as Array<Square>;

        // Find enums by the player's color.
        const checkEnum: GameStatus = playerColor == Color.White ? GameStatus.WhiteInCheck : GameStatus.BlackInCheck;
        const checkmateEnum: GameStatus = playerColor == Color.White ? GameStatus.BlackVictory : GameStatus.WhiteVictory;

        /**
         * If the king is threatened then the game is in check status. But continue
         * the check status because the game can be in checkmate or stalemate status.
         *
         * @see For more information about check please check the https://en.wikipedia.org/wiki/Check_(chess)
         */
        this.statusOfGame = enemySquaresOfPlayersKing.length > 0 ? checkEnum : GameStatus.InPlay;

        /**
         * Control, checkmate and stalemate scenarios.
         */
        this.calculatedMoves[squareOfPlayersKing!] = this.moveEngine.getMoves(squareOfPlayersKing!)!;

        // If the king has no moves then check the checkmate and stalemate scenarios.
        if(this.calculatedMoves[squareOfPlayersKing!]![MoveType.Normal]!.length == 0){
            if(enemySquaresOfPlayersKing.length > 1 && this.statusOfGame == checkEnum)
            {
                /**
                 * Control Checkmate by Double Check
                 *
                 * Double check is a special case of checkmate. If the king is threatened by more than one piece
                 * then none of the pieces can be blocked the enemies moves. The king must move to
                 * escape check. If the king has no moves then the game is in checkmate status.
                 *
                 * @see For more information about check mate please check the https://en.wikipedia.org/wiki/Checkmate
                 */
                this.statusOfGame = checkmateEnum;
            }
            else if(enemySquaresOfPlayersKing.length == 1 && this.statusOfGame == checkEnum)
            {
                /**
                 * Control Checkmate by Single Check
                 *
                 * If the king is threatened by only one piece then enemies moves can be blocked by
                 * the player's pieces.
                 */
                const squareOfEnemy: Square = enemySquaresOfPlayersKing[0];
                if(!BoardQueryer.isSquareThreatened(squareOfEnemy))
                {
                    /**
                     * If the enemy piece is not killable then find the moves of the enemy piece
                     * that relative to the king's square and check if the enemy piece's moves can
                     * be blocked by the player's pieces.
                     *
                     * @see For more information about relative squares, see src/Engine/Core/Utils/Locator.ts
                     */
                    const movesOfEnemy: Array<Square> = RouteCalculator.getRouteByPieceOnSquare(squareOfEnemy)[
                        Locator.getRelative(squareOfPlayersKing!, squareOfEnemy)!
                        ]!;

                    /**
                     * If there is no moves between the king and the enemy piece then
                     * the none of the player's pieces can block the enemy piece's moves
                     * so the game is in checkmate status. Otherwise, check the squares
                     * between the king and the enemy piece can be blocked by the player's
                     * pieces.
                     */
                    if(movesOfEnemy && movesOfEnemy.length > 1){
                        for (let moveOfThreat of movesOfEnemy)
                        {
                            /**
                             * If player can block the threat then the game is in check status
                             * so finish the function with return without changing the status.
                             */
                            if (BoardQueryer.isSquareThreatened(moveOfThreat, playerColor))
                                return;
                        }
                        // If player can't block the threat then the game is in checkmate status.
                        this.statusOfGame = checkmateEnum;
                    }else{
                        this.statusOfGame = checkmateEnum;
                    }
                }
            }
            else if(enemySquaresOfPlayersKing.length == 0 && this.statusOfGame == GameStatus.InPlay)
            {
                /**
                 * Control Stalemate
                 *
                 * If the king and any other pieces(of player) have no moves then the game is in
                 * stalemate status.
                 *
                 * @see For more information about stalemate please check the https://en.wikipedia.org/wiki/Stalemate
                 */
                for(const piece of BoardQueryer.getPiecesWithFilter(playerColor)){
                    // King's moves are already calculated so skip the king.
                    if(piece.getType() != PieceType.King) {
                        const moves: Array<Square> = Extractor.extractSquares(this.moveEngine.getMoves(BoardQueryer.getSquareOfPiece(piece)!)!);
                        if (moves.length > 0) {
                            // If the piece has at least one move then the game is not in stalemate status.
                            this.statusOfGame = GameStatus.InPlay;
                            return;
                        }
                    }
                }
                this.statusOfGame = GameStatus.Draw;
            }
        }

        // Set the current status for the move history.
        this.moveNotation += this.statusOfGame == checkmateEnum ? "#" : this.statusOfGame == checkEnum ? "+" : "";
    }

    /**
     * This function returns the finished status of the game, doesn't calculate the game is finished or not.
     */
    public getStatus(): GameStatus
    {
        return this.statusOfGame;
    }
}