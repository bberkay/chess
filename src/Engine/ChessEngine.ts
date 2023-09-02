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
    private statusOfGame: GameStatus = GameStatus.NotStarted;
    private playedFrom: Square | null = null;
    private playedTo: Square | null = null;
    private moveNotation: string = "";
    private currentMoves: Moves | null = null;
    private mandatoryMoves: {[key in Square]?: Square[]} = {};
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
        this.boardManager.createBoard(typeof position == "string" ? Converter.fenToJson(position) : position);

        // Check the status of the game.
        this.checkStatus();
    }

    /**
     * This function returns the current game as fen notation.
     */
    public getGameAsFenNotation(): string
    {
        return Converter.jsonToFen(BoardQueryer.getGame());
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
        return !!(this.statusOfGame != GameStatus.NotStarted && BoardQueryer.getPieceOnSquare(select)
            && BoardQueryer.getPieceOnSquare(select)?.getColor() === BoardQueryer.getColorOfTurn()
            && (Object.keys(this.mandatoryMoves).length > 0 && select in this.mandatoryMoves || Object.keys(this.mandatoryMoves).length == 0));
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

        /**
         * If the given square is in the mandatory moves then delete the
         * other moves of the square and return the mandatory moves.
         */
        if(this.mandatoryMoves.hasOwnProperty(square)){
            for(const moveType in this.currentMoves){
                this.currentMoves[moveType as MoveType] = this.currentMoves[moveType as MoveType]!.filter((move: Square) => {
                    return this.mandatoryMoves[square]!.includes(move);
                });
            }
        }

        // Save the moves to the calculatedMoves.
        this.calculatedMoves[square] = this.currentMoves;

        // Return the moves.
        return this.currentMoves;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        // If the game is not started then return.
        if(this.statusOfGame == GameStatus.NotStarted)
            return;

        // If moves is not calculated then calculate the moves.
        if(!this.currentMoves)
            this.currentMoves = this.getMoves(from);

        // Set the playedFrom and playedTo properties.
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
                this.moveNotation += Converter.pieceTypeToPieceName(piece.getType(), piece.getColor());

            // If the move kill a piece then add "x" to the current move.
            if(BoardQueryer.isSquareHasPiece(to)){
                // If the piece is pawn then add the column of the pawn to the current move.
                if(piece?.getType() == PieceType.Pawn)
                    this.moveNotation += Converter.squareIDToSquare(from)[0];
                this.moveNotation += "x";
            }

            // Add the target square to the current move.
            this.moveNotation += Converter.squareIDToSquare(to);
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
        if(selectedPromote in Square)
        {
            /**
             * Get the piece by clicked square's(to) row.
             * If the clicked row is 8 or 1 then the selected piece
             * type is queen, if the clicked row is 7 or 2 then the selected
             * piece type is rook, if the clicked row is 6 or 3 then the
             * selected piece type is bishop, if the clicked row is 5 or 4
             * then the selected piece type is knight(this is engine simulation/
             * version of the promotion menu)
             *
             * (4x4) ASCII representation of the promotion menu for white(. is square, Q is queen,
             * R is rook, B is bishop, K is knight):
             * --------------
             * | .  .  Q  . | 8
             * | .  .  R  . | 7
             * | .  .  B  . | 6
             * | .  .  K  . | 5
             * | .  .  .  . | 4
             * --------------
             *   a  b  c  d
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
        this.moveNotation += "=" + Converter.pieceTypeToPieceName(selectedPromote as PieceType, playerColor);
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
        this.mandatoryMoves = {};
        this.calculatedMoves = {};
        this.currentMoves = null;
        this._checkCastling();
        this._checkEnPassant();
        this.boardManager.changeTurn();
        this.checkStatus();
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
        if(!piece)
            return;

        /**
         * If the moved piece is king then disable the short and long castling
         * for the color of the king. If the piece is rook then disable the
         * short or long castling for the color of the rook by the square of
         * the moved rook.
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
        if(piece && piece.getType() == PieceType.Pawn){
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
    private checkStatus(): void
    {
        // If board has no black or white king then the game is not started.
        if(BoardQueryer.getPiecesWithFilter(Color.White, [PieceType.King]).length == 0
            || BoardQueryer.getPiecesWithFilter(Color.Black, [PieceType.King]).length == 0){
            this.statusOfGame = GameStatus.NotStarted;
            return;
        }
        else{
            this.statusOfGame = GameStatus.InPlay;
        }

        /**
         * If the half move count is greater than or equal to 50 then the game is in
         * draw status.
         * @see For more information about half move count, see https://en.wikipedia.org/wiki/Fifty-move_rule
         */
        if(BoardQueryer.getHalfMoveCount() >= 50){
            this.statusOfGame = GameStatus.Draw;
            this.moveNotation = "1/2-1/2";
            return;
        }

        /**
         * Get player's color, enemy's color and square of player's king.
         * Then get the id of the squares that the king is threatened by
         * the enemy pieces. For example, if the king is threatened by
         * the enemy queen on the square "h5" and the enemy knight on the
         * square "d6" then the threateningSquares is [32, 20].
         *
         * @see For more information about square ids, see src/Types/index.ts
         */
        const playerColor: Color = BoardQueryer.getColorOfTurn();
        const kingSquare: Square | null = BoardQueryer.getSquareOfPiece(
            BoardQueryer.getPiecesWithFilter(playerColor, [PieceType.King])[0]!
        );
        const threateningSquares: Array<Square> = BoardQueryer.isSquareThreatened(
            kingSquare!, BoardQueryer.getColorOfOpponent(), true
        ) as Array<Square>;

        // Find enums by the player's color.
        const checkEnum: GameStatus = playerColor == Color.White ? GameStatus.WhiteInCheck : GameStatus.BlackInCheck;
        const checkmateEnum: GameStatus = playerColor == Color.White ? GameStatus.BlackVictory : GameStatus.WhiteVictory;

        /**
         * If the king is threatened then the game is in check status. But continue
         * the check status because the game can be in checkmate or stalemate status.
         *
         * @see For more information about check please check the https://en.wikipedia.org/wiki/Check_(chess)
         */
        this.statusOfGame = threateningSquares.length > 0 ? checkEnum : GameStatus.InPlay;

        // Calculate the moves of the king.
        this.calculatedMoves[kingSquare!] = this.moveEngine.getMoves(kingSquare!)!;

        /*************************************************************************
         * CHECKMATE BY DOUBLE CHECK, STALEMATE AND MANDATORY MOVES OF KING
         *
         * If the king has no moves then check the doubly check and stalemate scenarios.
         * ************************************************************************/
        if(this.calculatedMoves[kingSquare!]![MoveType.Normal]!.length == 0){
            if(threateningSquares.length > 1 && this.statusOfGame == checkEnum)
            {
                /**
                 * Control Checkmate(Double Check Scenario)
                 *
                 * Double check is a special case of checkmate. If the king is threatened by more than one piece
                 * then none of the pieces can be blocked the enemies moves. The king must move to
                 * escape check. If the king has no moves then the game is in checkmate status.
                 *
                 * @see For more information about check mate please check the https://en.wikipedia.org/wiki/Checkmate
                 */
                this.statusOfGame = checkmateEnum;
            }
            else if(threateningSquares.length == 0 && this.statusOfGame == GameStatus.InPlay)
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
        else if(this.statusOfGame == checkEnum)
        {
            /***************************************************************************
             * MANDATORY MOVES OF KING
             *
             * If the king has at least one move and player's checked then
             * add the moves to the mandatory moves.
             * *************************************************************************/
            this.mandatoryMoves[kingSquare!] = this.calculatedMoves[kingSquare!]![MoveType.Normal]!;
        }

        /**************************************************************************
         * CHECKMATE SCENARIO AND MANDATORY MOVES OF PROTECTORS OF THE KING
         *
         * If the game is not in stalemate or checkmate status and king is checked then
         * check the mandatory moves.
         * *************************************************************************/
        if(this.statusOfGame == checkEnum)
        {
            /**
             * Find the player's pieces that can kill the enemy piece that threatens the king
             * then add the killers to the mandatory moves. For example, if the king is threatened
             * by the enemy queen on the square "h5" and the player has a rook on the square "h1"
             * then the rook can kill the enemy queen and the rook is a mandatory move. So the
             * mandatoryMoves is {h1: [h5]}.
             */
            const squareOfEnemy: Square = threateningSquares[0];
            const killers: Square[] = BoardQueryer.isSquareThreatened(squareOfEnemy, playerColor, true) as Square[];
            if(killers.length > 0){
                for(const killer of killers)
                    this.mandatoryMoves[killer] = [squareOfEnemy];
            }

            /**
             * Find the moves of the enemy piece that relative to the king's square
             * and check if the enemy piece's moves can be blocked by the player's pieces.
             *
             * @see For more information about relative squares, see src/Engine/Core/Utils/Locator.ts
             */
            let movesOfEnemy: Array<Square> = RouteCalculator.getRouteByPieceOnSquare(squareOfEnemy)[Locator.getRelative(kingSquare!, squareOfEnemy)!]!;

            /**
             * Control Checkmate(Single Check Scenario)
             *
             * If the king is threatened by only one piece then enemy moves can be blocked by
             * the player's pieces.
             */
            if(threateningSquares.length == 1)
            {
                /**
                 * If there is no moves between the king and the enemy piece then
                 * the none of the player's pieces can block the enemy piece's moves
                 * so the game is in checkmate status. Otherwise, check the squares
                 * between the king and the enemy piece can be blocked by the player's
                 * pieces.
                 */
                if(movesOfEnemy.length > 1)
                {
                    for (let move of movesOfEnemy)
                    {
                        /**
                         * If the move is the king's square then skip the loop.
                         */
                        if(move == kingSquare)
                            continue;

                        /**
                         * If player can block the threat then the game is in check status
                         * so finish the function with return without changing the status.
                         */
                        const blockers: Square[] = BoardQueryer.isSquareThreatened(move, playerColor, true, true) as Square[];
                        if(blockers.length > 0){
                            for(const blocker of blockers){
                                if(!(blocker in this.mandatoryMoves))
                                    this.mandatoryMoves[blocker] = [];

                                this.mandatoryMoves[blocker]!.push(move);
                            }
                        }
                    }

                    /**
                     * If the player can block the threat then the game is not in checkmate status.
                     * Otherwise, the game is in checkmate status.
                     */
                    this.statusOfGame = Object.keys(this.mandatoryMoves).length > 0 ? checkEnum : checkmateEnum;
                }
                else
                    this.statusOfGame = checkmateEnum;
            }
        }

        // Set the current status for the move history.
        this.moveNotation += this.statusOfGame == checkmateEnum ? "#" : this.statusOfGame == checkEnum ? "+" : "1/2-1/2";
    }

    /**
     * This function returns the finished status of the game, doesn't calculate the game is finished or not.
     */
    public getStatus(): GameStatus
    {
        return this.statusOfGame;
    }

    /**
     * This function returns the algebraic notation of the game.
     */
    public getNotation(): Array<string>
    {
        return BoardQueryer.getMoveHistory();
    }
}