/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess game(does not include board or other ui components).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 * @license MIT
 */

import {Color, JsonNotation, Moves, MoveType, PieceType, Square, StartPosition} from "../Types";
import {MoveEngine} from "./Core/Move/MoveEngine";
import {BoardManager} from "./Core/Board/BoardManager.ts";
import {Converter} from "../Utils/Converter";
import {BoardQueryer} from "./Core/Board/BoardQueryer.ts";
import {Locator} from "./Core/Utils/Locator.ts";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine{

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private boardManager: BoardManager;
    private currentMoves: Moves | null = null;
    private isPromotionMove: boolean = false;

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
        // If fen notation is given, convert it to json notation.
        if(typeof position === "string")
            position = Converter.convertFenToJson(position as StartPosition);

        // Create the board with the given position.
        this.boardManager.createBoard(position);
    }

    /**
     * This function check the select is legal or not by checking the piece's color
     * and the color of the turn.
     */
    public isSelectLegal(select: Square): boolean
    {
        /**
         * If there is no piece on the given square or the piece's color
         * is not equal to the color of the turn, return false.
         */
        return !(!BoardQueryer.getPieceOnSquare(select) || BoardQueryer.getPieceOnSquare(select)?.getColor() !== BoardQueryer.getColorOfTurn());
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Moves | null
    {
        if(!this.isSelectLegal(square))
            return null;

        // Get the moves of the given square.
        this.currentMoves = this.moveEngine.getMoves(square);
        return this.currentMoves;
    }

    /**
     * This function checks and find the given move. For example,
     * if the given move is not in the currentMoves, it returns false.
     * Otherwise, it returns the move type.
     */
    private checkAndFindMoveType(to: Square): MoveType | false
    {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if(this.currentMoves === null)
            return false;

        // Find the given move in the currentMoves.
        for(const moveType in this.currentMoves){
            // If the move type is null or undefined then skip the loop.
            if(!this.currentMoves[moveType as MoveType])
                continue;

            // Loop through the moves of the move type.
            for(let move of this.currentMoves[moveType as MoveType]!){
                if(move === to)
                    return moveType as MoveType;
            }
        }

        // If the given move is not in the currentMoves, return false.
        return false;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        if(this.isPromotionMove){
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
            const move = this.checkAndFindMoveType(to);
            if(!move)
                return;

            // Increase the move count of the piece.
            BoardQueryer.getPieceOnSquare(from)?.increaseMoveCount();

            // Play the move according to the move type.
            switch(move){
                case MoveType.Castling:
                    this._doCastling(from, to);
                    break;
                case MoveType.EnPassant:
                    this._doEnPassant(from, to);
                    break;
                case MoveType.Promotion:
                    this._doPromotion(from, to);
                    break;
                case MoveType.Normal:
                    this._doNormalMove(from, to);
                    break;
            }
        }

        // TODO: Check if the move is checkmate or not.
        /**
         * If move is promotion move, then don't change the turn.
         * Because, user must promote the piece.
         */
        if(!this.isPromotionMove){
            this.boardManager.changeTurn();
        }
    }

    /**
     * Do the castling move.
     */
    private _doCastling(from: Square, to: Square): void
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
        const castlingType: "Long" | "Short" = Number(from) - Number(to) > 3
            ? "Long" : "Short";

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the "from" otherwise 2 squares
         * right of the "from".
         */
        const kingNewSquare: number = castlingType == "Long" ? Number(from) - 2 : Number(from) + 2;

        this._doNormalMove(from, kingNewSquare as Square);

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
        const rook: number = castlingType == "Long" ? from - 4 : from + 3;
        const rookNewSquare: number = castlingType == "Long" ? kingNewSquare + 1 : kingNewSquare - 1;

        this._doNormalMove(rook, rookNewSquare as Square);
    }

    /**
     * Do the en passant move.
     */
    private _doEnPassant(from: Square, to: Square): void
     {
        this._doNormalMove(from, to);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Types/index.ts
         */
        const killedPieceSquare = Number(to) + (BoardQueryer.getPieceOnSquare(to)?.getColor() == Color.White ? 8 : -8);

        // Remove the killed piece.
        this.boardManager.removePiece(killedPieceSquare);
    }

    /**
     * Do the promote move.
     */
    private _doPromotion(from: Square, to: Square): void
    {
        // Move the pawn.
        this._doNormalMove(from, to);
        this.isPromotionMove = true;
    }

    /**
     * Do the promote move.
     * @example _doPromote(Square.a8, PieceType.Queen)
     *
     * if selectedPromote is given Square then Engine will simulate the promotion menu.
     * @example _doPromote(Square.e8, Square.e8) // Creates a queen on e8(white),
     * @example _doPromote(Square.e8, Square.e7) // Creates a rook on e7(white)
     * @example _doPromote(Square.e8, Square.e6) // Creates a bishop on e6(white)
     * @example _doPromote(Square.e8, Square.e5) // Creates a knight on e5(white),
     * @example _doPromote(Square.e1, Square.e1) // Creates a queen on a(black),
     * @example _doPromote(Square.e1, Square.e2) // Creates a rook on e2(black)
     * @example _doPromote(Square.e1, Square.e3) // Creates a bishop on e3(black)
     * @example _doPromote(Square.e1, Square.e4) // Creates a knight on e4(black)
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

        // Create the new piece.
        this.boardManager.createPiece(BoardQueryer.getColorOfTurn(), selectedPromote as PieceType, from);

        // Finish the promotion.
        this.isPromotionMove = false;
    }

    /**
     * Do the normal move.
     */
    private _doNormalMove(from: Square, to: Square): void
    {
        this.boardManager.movePiece(from, to);
    }

    /**
     * This function checks if the game is finished after move is played.
     */
    public isFinished(): boolean
    {
        // TODO: Implement this function.
        return false;
    }
}