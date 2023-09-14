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
import {Piece} from "./Types";
import {MoveEngine} from "./Move/MoveEngine.ts";
import {BoardManager} from "./Board/BoardManager.ts";
import {Converter} from "../Utils/Converter";
import {BoardQueryer} from "./Board/BoardQueryer.ts";
import {Locator} from "./Move/Utils/Locator.ts";
import {Extractor} from "./Move/Utils/Extractor.ts";
import {RouteCalculator} from "./Move/Calculator/RouteCalculator.ts";
import {Logger, Source} from "../Services/Logger.ts";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine extends BoardManager {

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private statusOfGame: GameStatus = GameStatus.NotStarted;
    private playedFrom: Square | null = null;
    private playedTo: Square | null = null;
    private moveNotation: string = "";
    private currentMoves: Moves | null = null;
    private mandatoryMoves: {[key in Square]?: Square[]} = {};
    private calculatedMoves: {[key in Square]?: Moves | null} = {};
    private isPromotionMenuOpen: boolean = false;
    private readonly isStandalone: boolean = false;

    /**
     * Constructor of the ChessEngine class.
     */
    constructor(isStandalone: boolean = false){
        super();
        this.moveEngine = new MoveEngine();
        this.isStandalone = isStandalone;

        // If engine is standalone then create a game with the standard position.
        if(this.isStandalone)
            this.createGame();
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        if(this.isStandalone)
            Logger.clear();

        // Clear the game.
        this.resetGame();

        /**
         * Create the board with the given position(if the given position is not string then
         * convert it to json notation, also store the fen notation of the given position).
         */
        const fenNotationOfGivenPosition: string = typeof position == "string" ? position : Converter.jsonToFen(position);
        this.createBoard(typeof position == "string" ? Converter.fenToJson(position) : position);

        if(this.isStandalone)
            Logger.save(`Game created on ChessEngine`, "createGame", Source.ChessEngine);

        // Check the status of the game if board is different from the standard position.
        if(fenNotationOfGivenPosition != StartPosition.Standard){
            Logger.save("Game status will be checked because board is different from the standard position", "createGame", Source.ChessEngine);
            this.checkStatusOfGame();
        }else{
            Logger.save("Game status will not be checked because board is the standard position", "createGame", Source.ChessEngine);
            this.statusOfGame = GameStatus.InPlay;
        }
    }

    /**
     * This function turn properties to their default values.
     */
    private resetGame(): void
    {
        this.statusOfGame = GameStatus.NotStarted;
        this.playedFrom = null;
        this.playedTo = null;
        this.moveNotation = "";
        this.currentMoves = null;
        this.mandatoryMoves = {};
        this.calculatedMoves = {};
        this.isPromotionMenuOpen = false;
        Logger.save("Game properties set to default on ChessEngine", "resetGame", Source.ChessEngine);
    }

    /**
     * This function returns the current game as fen notation.
     */
    public getGameAsFenNotation(): string
    {
        Logger.save("Game returned as json notation then converted to fen notation", "getGameAsFenNotation", Source.ChessEngine);
        return Converter.jsonToFen(BoardQueryer.getGame());
    }

    /**
     * This function returns the current game as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation
    {
        Logger.save("Game returned as json notation", "getGameAsJsonNotation", Source.ChessEngine);
        return BoardQueryer.getGame();
    }

    /**
     * This function check the select is legal or not by checking the piece's color
     * and the color of the turn.
     */
    public isSquareSelectable(select: Square): boolean
    {
        // If game is not start or finished then square can't be selectable.
        if(!this.isBoardPlayable()){
            Logger.save(`Square[${select}] is not selectable because board is not playable`, "isSquareSelectable", Source.ChessEngine);
            return false;
        }

        // If the game is started but selected square is empty or not player's piece then square can't be selectable.
        if(!BoardQueryer.getPieceOnSquare(select) || BoardQueryer.getPieceOnSquare(select)?.getColor() != BoardQueryer.getColorOfTurn()){
            Logger.save(`Square[${select}]  is not selectable because selected square is empty or not player's piece`, "isSquareSelectable", Source.ChessEngine);
            return false;
        }

        // If piece has no moves then square can't be selectable.
        this.calculatedMoves[select] = this.calculatedMoves[select] ?? this.moveEngine.getMoves(select);
        if(!this.calculatedMoves[select]){
            Logger.save(`Square[${select}] is not selectable because piece has no moves`, "isSquareSelectable", Source.ChessEngine);
            return false;
        }

        // If game has mandatory moves and selected square is not in the mandatory moves then square can't be selectable.
        if((Object.keys(this.mandatoryMoves).length > 0 && select in this.mandatoryMoves) || Object.keys(this.mandatoryMoves).length == 0){
            Logger.save(`Square[${select}]  is selectable`, "isSquareSelectable", Source.ChessEngine);
            return true;
        }
        else{
            Logger.save(`Square[${select}] is not selectable because game has mandatory moves[${JSON.stringify(this.mandatoryMoves)}} and selected square is not in the mandatory moves`, "isSquareSelectable", Source.ChessEngine);
            return false;
        }
    }

    /**
     * This function checks and find the given move. For example,
     * if the given move is not in the currentMoves, it returns false.
     * Otherwise, it returns the move type.
     */
    private checkAndFindMoveType(): MoveType | null
    {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if(this.currentMoves === null){
            Logger.save("Move type is not found because there is no selected square", "findMoveType", Source.ChessEngine);
            return null;
        }

        // Find the given move in the currentMoves.
        for(const moveType in this.currentMoves){
            // If the move type is null or undefined then skip the loop.
            if(!this.currentMoves[moveType as MoveType])
                continue;

            // Loop through the moves of the move type.
            for(let move of this.currentMoves[moveType as MoveType]!){
                if(move === this.playedTo){
                    Logger.save(`Move type[${moveType}] is found`, "findMoveType", Source.ChessEngine);
                    return moveType as MoveType;
                }
            }
        }

        // If the given move is not in the currentMoves, return null.
        Logger.save(`Move type is not found because the given move[${this.playedTo}] is not in the current moves[${JSON.stringify(this.currentMoves)}]`, "findMoveType", Source.ChessEngine);
        return null;
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Moves | null
    {
        if(!this.isSquareSelectable(square)){
            Logger.save(`Moves of the square is not found because square[${square}] is not selectable`, "getMoves", Source.ChessEngine);
            return null;
        }

        /**
         * Get the moves of square with move engine. If the moves of the square
         * is already calculated then get the moves from the calculatedMoves.
         * Otherwise, calculate the moves with move engine and save the moves
         */
        this.currentMoves = this.calculatedMoves[square] ?? this.moveEngine.getMoves(square);
        Logger.save(this.calculatedMoves.hasOwnProperty(square)
            ? `Moves of the square[${square}] is found from calculated moves[${JSON.stringify(this.calculatedMoves)}]`
            : `Moves of the square[${square}] is calculated by move engine`, "getMoves", Source.ChessEngine);

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
            Logger.save(`Mandatory moves[${JSON.stringify(this.mandatoryMoves)}}] are found and other moves are deleted from moves of the square`, "getMoves", Source.ChessEngine);
        }

        // Save the moves to the calculatedMoves.
        this.calculatedMoves[square] = this.currentMoves;
        Logger.save(`Moves of the square is saved to calculated moves(or updated)[${JSON.stringify(this.calculatedMoves)}]`, "getMoves", Source.ChessEngine);

        // Return the moves.
        Logger.save("Calculation of moves of the square is finished", "getMoves", Source.ChessEngine);
        return this.currentMoves;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        // If the game is not started then return.
        if(this.statusOfGame == GameStatus.NotStarted){
            Logger.save("Move is not played because game is not started", "playMove", Source.ChessEngine);
            return;
        }

        // If moves is not calculated then calculate the moves.
        if(!this.currentMoves){
            Logger.save("Moves of the square is not calculated so calculate the moves", "playMove", Source.ChessEngine);
            this.currentMoves = this.getMoves(from);
        }else{
            Logger.save("Moves of the square is already calculated", "playMove", Source.ChessEngine);
        }

        // Set the playedFrom and playedTo properties.
        this.playedFrom = from!;
        this.playedTo = to!

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
            const move: MoveType | null = this.checkAndFindMoveType();
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
                    Logger.save(`Piece moved to target square[${to}] on engine`, "playMove", Source.ChessEngine);
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
        this.movePiece(from, to);
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
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        const castlingType: "Long" | "Short" = Number(this.playedFrom) - Number(this.playedTo) > 3
            ? "Long" : "Short";
        Logger.save(`Castling type determined[${castlingType}] on engine`, "playMove", Source.ChessEngine);

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the "from" otherwise 2 squares
         * right of the "from".
         */
        const kingNewSquare: number = castlingType == "Long" ? Number(this.playedFrom) - 2 : Number(this.playedFrom) + 2;

        this._doNormalMove(this.playedFrom as Square, kingNewSquare as Square);
        Logger.save(`King moved to target square[${kingNewSquare}] by determined castling type[${castlingType}] on engine`, "playMove", Source.ChessEngine);

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
        Logger.save(`Rook moved to target square[${rookNewSquare}] by determined castling type[${castlingType}] on engine`, "playMove", Source.ChessEngine);

        // Change castling availability.
        this.changeCastlingAvailability((BoardQueryer.getColorOfTurn() + castlingType) as CastlingType, false);
        Logger.save(`Castling[${castlingType}] is disabled because castling is played`, "playMove", Source.ChessEngine);

        // Set the current move for the move history.
        this.moveNotation += castlingType == "Short" ? "O-O" : "O-O-O";
    }

    /**
     * Do the en passant move.
     */
    private _doEnPassant(): void
    {
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square);
        Logger.save(`Piece moved to target square[${this.playedTo}] on engine`, "playMove", Source.ChessEngine);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const killedPieceSquare = Number(this.playedTo) + (BoardQueryer.getPieceOnSquare(this.playedTo as Square)?.getColor() == Color.White ? 8 : -8);

        // Remove the killed piece.
        this.removePiece(killedPieceSquare);
        Logger.save(`Captured piece by en passant move is found on square[${killedPieceSquare}] and removed on engine`, "playMove", Source.ChessEngine);

        // Set the current move for the move history.
        this.moveNotation += Converter.squareIDToSquare(this.playedFrom as Square)[0] + "x" + Converter.squareIDToSquare(this.playedTo as Square);
    }

    /**
     * Do the promote move.
     */
    private _doPromotion(): void
    {
        // Move the pawn.
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square, true);
        Logger.save(`Piece moved to target square[${this.playedTo}] on engine`, "playMove", Source.ChessEngine);
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
        // Remove the pawn
        this.removePiece(from);
        Logger.save(`Promoted Pawn is removed from square[${from}] on engine`, "playMove", Source.ChessEngine);

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
             * @see For more information about promotion menu, see showPromotionMenu() src/Chess/Board/ChessBoard.ts
             */
            const clickedRow: number = Locator.getRow(selectedPromote as Square);
            selectedPromote = (([8, 1].includes(clickedRow) ? PieceType.Queen : null)
                || ([7, 2].includes(clickedRow) ? PieceType.Rook : null)
                || ([6, 3].includes(clickedRow) ? PieceType.Bishop : null)
                || ([5, 4].includes(clickedRow) ? PieceType.Knight : null))!;
            Logger.save(`Promoted piece type[${selectedPromote}] is determined by clicked row[${clickedRow}] on engine`, "playMove", Source.ChessEngine);
        }

        // Get the player's color.
        const playerColor: Color = BoardQueryer.getColorOfTurn();

        // Create the new piece and increase the score of the player.
        this.createPiece(playerColor, selectedPromote as PieceType, from);
        this.updateScores(from);
        Logger.save(`Player's[${playerColor}] Piece[${selectedPromote}] created on square[${from}] on engine`, "playMove", Source.ChessEngine);

        // Finish the promotion.
        this.isPromotionMenuOpen = false;
        Logger.save("Promotion is finished on engine", "playMove", Source.ChessEngine);

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
         * 1- Clear properties of the ChessEngine except moveNotation
         * 2- Control en passant moves for White(because, if White not play en passant move in one turn then remove the move)
         * 3- Control castling moves for White(because, if White move the king or rook then disable the castling)
         * 4- Change the turn(White -> Black)
         * 5- Check the game is finished or not for Black
         * 6- Add move to move history
         * 7- Check the threefold repetition rule
         * 8- Clear current move notation
         */
        this.mandatoryMoves = {};
        this.calculatedMoves = {};
        this.currentMoves = null;
        this._checkCastling();
        this._checkEnPassant();
        this.changeTurn();
        Logger.save("Turn is changed.", "finishTurn", Source.ChessEngine);
        this.checkStatusOfGame();
        this.addMoveToHistory(this.moveNotation);
        this.checkThreefoldRepetition();
        Logger.save(`Notation[${JSON.stringify(this.moveNotation)}] of current move add to move history`, "finishTurn", Source.ChessEngine);
        this.moveNotation = "";
        Logger.save("Turn finish operation is finished.", "finishTurn", Source.ChessEngine);
    }

    /**
     * Check the game is finished or not by threefold repetition rule.
     */
    private checkThreefoldRepetition(): void
    {
        /**
         * Get the notation of the game and check the notation is
         * repeated 3 times or not. If the notation is repeated 3
         * times then the game is in draw status.
         */
        const notations: string[] = this.getNotation();
        if(notations.length < 10)
            return;

        // Get last 10 move from move notation.
        const lastMoves: string[] = notations.slice(-10);

        /**
         * If the last 6 notation is not repeated 3 times then return.
         * For example that set game status to draw:
         * - this.getNotation() returns ["d4", "d5", "Kd2", "kd7", "Ke1", "ke8", "Kd2", "kd7", "Ke1", "ke8", "Kd2", "kd7"]
         * - lastNotations is ["Kd2", "kd7", "Ke1", "ke8", "Kd2", "kd7", "Ke1", "ke8", "Kd2", "kd7"]
         *  - Simple repeat of this scenario:
         *      - The white king moves to d2 from e1 and the black king moves to d7 from e8.
         *      - The white king moves to e1 from d2 and the black king moves to e8 from d7. (First repetition finished)
         *      - ...
         *      - The white king moves to d2 from e1 and the black king moves to d7 from e8.
         *      - The white king moves to e1 from d2 and the black king moves to e8 from d7. (Third repetition finished)
         *  - Then this situation is repeated 3 times and the game is in draw status.
         */
        if(lastMoves.length != 10
            || lastMoves[0] != lastMoves[4] || lastMoves[1] != lastMoves[5] || lastMoves[2] != lastMoves[6]
            || lastMoves[3] != lastMoves[7] || lastMoves[4] != lastMoves[8] || lastMoves[5] != lastMoves[9]){
            Logger.save("Threefold repetition rule is not satisfied", "checkThreefoldRepetition", Source.ChessEngine);
            return;
        }

        // If the last 6 notation is repeated 3 times then the game is in draw status.
        this.statusOfGame = GameStatus.Draw;
        Logger.save("Game status set to draw by threefold repetition rule", "checkThreefoldRepetition", Source.ChessEngine);
    }

    /**
     * Check castling moves after each turn. If player move the king or rook
     * then disable the castling.
     *
     * @see castling move calculation: src/Chess/Engine/Core/Move/Extender/MovesExtender.ts
     * @see castling rules: https://en.wikipedia.org/wiki/Castling
     */
    private _checkCastling(): void
    {
        if(this.moveNotation == "O-O" || this.moveNotation == "O-O-O"){
            Logger.save("Castling Check is unnecessary because move is already castling", "checkCastling", Source.ChessEngine);
            return;
        }

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
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        if(piece.getType() == PieceType.King){
            this.changeCastlingAvailability((piece.getColor() + "Long") as CastlingType, false);
            this.changeCastlingAvailability((piece.getColor() + "Short") as CastlingType, false);
            Logger.save(`[${piece.getColor()}] Long and Short castling is disabled because king has moved`, "checkCastling", Source.ChessEngine);
        }else if(piece.getType() == PieceType.Rook){
            const rookType: "Long" | "Short" = Number(this.playedTo) % 8 == 0 ? "Short" : "Long";
            this.changeCastlingAvailability((piece.getColor() + rookType) as CastlingType, false);
            Logger.save(`[${piece.getColor()}] Castling[${rookType}] is disabled because rook has moved`, "checkCastling", Source.ChessEngine);
        }
        Logger.save("Castling Check is finished", "checkCastling", Source.ChessEngine);
    }

    /**
     * Check en passant moves. If there is an en passant move not played
     * then remove it. Because, en passant moves are only valid for one turn.
     *
     * @see For more information about en passant, see src/Chess/Engine/Core/Move/Extender/MovesExtender.ts
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
            if(Locator.getRow(Number(this.playedFrom)) == (piece.getColor() == Color.White ? 6 : 3)){
                const moveOfEnemyPawn: number = piece.getColor() == Color.White ? Number(this.playedTo) + 8 : Number(this.playedTo) - 8;
                this.banEnPassantSquare(moveOfEnemyPawn);
                Logger.save(`En passant square[${moveOfEnemyPawn}] is banned because target pawn has moved 1 square forward`, "checkEnPassant", Source.ChessEngine);
            }
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
                if(moves && moves["EnPassant"]!.length > 0){
                    this.banEnPassantSquare(moves["EnPassant"]![0]);
                    Logger.save(`En passant square[${moves["EnPassant"]![0]}] is banned because pawn has en passant move that not played valid turn`, "checkEnPassant", Source.ChessEngine);
                }
            }
        }
        Logger.save("En passant Check is finished", "checkEnPassant", Source.ChessEngine);
    }

    /**
     * This function calculate the game is finished or not and set the status of the game.
     *
     * Control order of game status:
     * 1- Check
     * 2- Checkmate
     * 3- Stalemate
     *
     * @see For more information about game status types please check the src/Chess/Types/index.ts
     */
    private checkStatusOfGame(): void
    {
        // If the game is not playable then return.
        if(!this.isBoardPlayable()){
            Logger.save("Game status is not checked because board is not playable so check is unnecessary", "checkStatusOfGame", Source.ChessEngine);
            return;
        }

        /**
         * If the half move count is greater than or equal to 50 then the game is in
         * draw status.
         * @see For more information about half move count, see https://en.wikipedia.org/wiki/Fifty-move_rule
         */
        if(BoardQueryer.getHalfMoveCount() >= 50){
            this.statusOfGame = GameStatus.Draw;
            this.moveNotation = "1/2-1/2";
            Logger.save("Game status set to draw by half move count", "checkStatusOfGame", Source.ChessEngine);
            return;
        }

        /**
         * Get player's color, enemy's color and square of player's king.
         * Then get the id of the squares that the king is threatened by
         * the enemy pieces. For example, if the king is threatened by
         * the enemy queen on the square "h5" and the enemy knight on the
         * square "d6" then the threateningSquares is [32, 20].
         *
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        const playerColor: Color = BoardQueryer.getColorOfTurn();
        const kingSquare: Square | null = BoardQueryer.getSquareOfPiece(
            BoardQueryer.getPiecesWithFilter(playerColor, [PieceType.King])[0]!
        );
        const threateningSquares: Array<Square> = BoardQueryer.isSquareThreatened(
            kingSquare!, BoardQueryer.getColorOfOpponent(), true
        ) as Array<Square>;
        Logger.save(`Threatening squares[${JSON.stringify(threateningSquares)}] are found by king's square[${kingSquare}]`, "checkStatusOfGame", Source.ChessEngine);

        // Find enums by the player's color.
        const checkEnum: GameStatus = playerColor == Color.White ? GameStatus.WhiteInCheck : GameStatus.BlackInCheck;
        const checkmateEnum: GameStatus = playerColor == Color.White ? GameStatus.BlackVictory : GameStatus.WhiteVictory;
        Logger.save(`Check[${checkEnum}] and Checkmate[${checkmateEnum}] enums are found by player's color[${playerColor}]`, "checkStatusOfGame", Source.ChessEngine);

        /**
         * If the king is threatened then the game is in check status. But continue
         * the check status because the game can be in checkmate or stalemate status.
         *
         * @see For more information about check please check the https://en.wikipedia.org/wiki/Check_(chess)
         */
        this.statusOfGame = threateningSquares.length > 0 ? checkEnum : GameStatus.InPlay;

        // Calculate the moves of the king and save the moves to the calculatedMoves.
        let movesOfKing: Moves | null = this.moveEngine.getMoves(kingSquare!)!;
        this.calculatedMoves[kingSquare!] = movesOfKing;
        Logger.save(`Moves of the king[${kingSquare}] are calculated and saved to calculated moves`, "checkStatusOfGame", Source.ChessEngine);

        // If the king has no moves then set the movesOfKing to empty array.
        if(movesOfKing == null){
            movesOfKing = {Normal: []};
            Logger.save("Moves of the king is set to empty array because king has no moves", "checkStatusOfGame", Source.ChessEngine);
        }

        /*************************************************************************
         * CHECKMATE BY DOUBLE CHECK, STALEMATE AND MANDATORY MOVES OF KING
         *
         * If the king has no moves then check the doubly check and stalemate scenarios.
         * ************************************************************************/
        if(movesOfKing[MoveType.Normal]!.length == 0)
        {
            Logger.save("King has no moves so check the doubly check and stalemate scenarios", "checkStatusOfGame", Source.ChessEngine);
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
                Logger.save("Game status set to checkmate because king has no moves and threatened by more than one piece(double check)", "checkStatusOfGame", Source.ChessEngine);
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
                            Logger.save("Stalemate is not satisfied because king has no moves but any other pieces have moves", "checkStatusOfGame", Source.ChessEngine);
                            return;
                        }
                    }
                }
                this.statusOfGame = GameStatus.Draw;
                Logger.save("Game status set to draw because king and any other pieces have no moves(stalemate)", "checkStatusOfGame", Source.ChessEngine);
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
            this.mandatoryMoves[kingSquare!] = movesOfKing[MoveType.Normal]!;
            Logger.save(`Game status is check[${this.statusOfGame}] and king has playable moves so moves of the king[${kingSquare}] are added to mandatory moves`, "checkStatusOfGame", Source.ChessEngine);
        }

        /**************************************************************************
         * CHECKMATE SCENARIO AND MANDATORY MOVES OF PROTECTORS OF THE KING
         *
         * If the game is not in stalemate or checkmate status and king is checked then
         * check the mandatory moves.
         * *************************************************************************/
        if(this.statusOfGame == checkEnum)
        {
            // If double check then don't check the blockers/killers
            if(threateningSquares.length > 1){
                Logger.save("Game status is check and king is threatened by more than one piece(double check) so checking the blockers/killers of the king is unnecessary", "checkStatusOfGame", Source.ChessEngine);
                return;
            }

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
            Logger.save(killers.length > 0
                ? `Game status is check and threat can be killed by player's piece[${JSON.stringify(killers)}] so killers are added to mandatory moves[${JSON.stringify(this.mandatoryMoves)}].`
                : `Game status is check and there is nothing to add mandatory moves because none of the player's pieces can kill threat of king.`, "checkStatusOfGame", Source.ChessEngine);


            /**
             * Find the moves of the enemy piece that relative to the king's square
             * and check if the enemy piece's moves can be blocked by the player's pieces.
             *
             * @see For more information about relative squares, see src/Chess/Engine/Core/Utils/Locator.ts
             */
            const movesOfEnemy: Array<Square> = BoardQueryer.getPieceOnSquare(squareOfEnemy)?.getType() != PieceType.Knight
                ? RouteCalculator.getRouteByPieceOnSquare(squareOfEnemy)[Locator.getRelative(kingSquare!, squareOfEnemy)!]!
                : [];
            Logger.save(`Moves of the enemy piece[${JSON.stringify(squareOfEnemy)}] are found by relative square of the king[${kingSquare}].`, "checkStatusOfGame", Source.ChessEngine);

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
                if(movesOfEnemy!.length > 1)
                {
                    for (let move of movesOfEnemy!)
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
                            Logger.save(`Game status is check and threat can be blocked by player's piece[${JSON.stringify(blockers)}] so blockers are added to mandatory moves[${JSON.stringify(this.mandatoryMoves)}].`, "checkStatusOfGame", Source.ChessEngine);
                        }
                    }

                    /**
                     * If the player can block the threat then the game is not in checkmate status.
                     * Otherwise, the game is in checkmate status.
                     */
                    this.statusOfGame = Object.keys(this.mandatoryMoves).length > 0 ? checkEnum : checkmateEnum;
                    Logger.save(Object.keys(this.mandatoryMoves).length > 0
                        ? `Game status is set to check[${this.statusOfGame}] because threat can be blocked or killed by player's pieces.`
                        : `Game status is set to checkmate[${this.statusOfGame}] because threat can't be blocked or killed by player's pieces.`, "checkStatusOfGame", Source.ChessEngine);
                }
                else if(movesOfKing[MoveType.Normal]!.length == 0) {
                    /**
                     * If the king has no moves and no piece can block the threat then the game is
                     * in checkmate status.
                     */
                    this.statusOfGame = checkmateEnum;
                    Logger.save("Game status is set to checkmate because king has no moves and threat can't be blocked or killed by player's pieces.", "checkStatusOfGame", Source.ChessEngine);
                }
            }
        }

        // Set the current status for the move history.
        if (this.statusOfGame === checkmateEnum)
            this.moveNotation += "#";
        else if (this.statusOfGame === checkEnum)
            this.moveNotation += "+";
        else if (this.statusOfGame === GameStatus.Draw)
            this.moveNotation += "1/2-1/2";

        Logger.save(`Game status check is finished and status determined[${this.statusOfGame}].`, "checkStatusOfGame", Source.ChessEngine);
    }

    /**
     * This function check the board is playable or not.
     */
    private isBoardPlayable(): boolean
    {
        /**
         * Check the status of is it started or finished. Also,
         * check pieces on the board and if there is no pieces that can
         * finish the game then the game can't be started. If game is started then
         * set the status of the game to draw.
         */
        if(this.statusOfGame == GameStatus.WhiteVictory || this.statusOfGame == GameStatus.BlackVictory
            || this.statusOfGame == GameStatus.Draw){
            Logger.save(`Board is not playable because game finished[${this.statusOfGame}]`, "isBoardPlayable", Source.ChessEngine);
            return false;
        }
        else if(BoardQueryer.getPiecesWithFilter(Color.White, [PieceType.King]).length == 0
            || BoardQueryer.getPiecesWithFilter(Color.Black, [PieceType.King]).length == 0){
            // If board has no white and black king then the game can't be started.
            this.statusOfGame = GameStatus.NotStarted;
            Logger.save(`Board is not playable because game not started(king/kings missing)`, "isBoardPlayable", Source.ChessEngine);
            return false;
        }
        else
        {
            /**
             * Check the pieces on the board and:
             * - If there is only one white king and one black king then the game is in draw status.
             * - If there is only one white king and one black king and one white knight or bishop then the game is in draw status.
             */

            // If board has any pawn, rook or queen then the game can be finished.
            for(const square in BoardQueryer.getBoard()){
                const piece: Piece | null = BoardQueryer.getPieceOnSquare(Number(square) as Square);
                if(piece && (piece.getType() == PieceType.Pawn || piece.getType() == PieceType.Rook || piece.getType() == PieceType.Queen)){
                    this.statusOfGame = GameStatus.InPlay;
                    Logger.save(`Board has pawn/rook/queen so it can be playable.`, "isBoardPlayable", Source.ChessEngine);
                    return true;
                }
            }

            // If board has no queen, rook or pawn then check the king and bishop count.
            if(BoardQueryer.getPiecesWithFilter(BoardQueryer.getColorOfTurn(), [PieceType.Knight, PieceType.Bishop]).length > 1){
                this.statusOfGame = GameStatus.InPlay;
                Logger.save(`Board has more than one knight and/or bishop so it can be playable.`, "isBoardPlayable", Source.ChessEngine);
                return true;
            }

            // Otherwise, the game is in draw status.
            if(this.statusOfGame != GameStatus.NotStarted){
                Logger.save(`Board is in draw status because game is not finished or board can't be finished because of pieces.`, "isBoardPlayable", Source.ChessEngine);
                this.statusOfGame = GameStatus.Draw;
            }

            Logger.save(`Board is not playable because game not started(king/kings missing).`, "isBoardPlayable", Source.ChessEngine);
            return false;
        }
    }

    /**
     * This function returns the finished status of the game, doesn't calculate the game is finished or not.
     */
    public getStatusOfGame(): GameStatus
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

    /**
     * This function returns the scores of the players.
     */
    public getScores(): Record<Color, {score: number, pieces: PieceType[]}>
    {
        return BoardQueryer.getScores();
    }

    /**
     * This function returns the logs of the game on engine.
     */
    public getLogs(): Array<{source: string, message: string}>
    {
        if(!this.isStandalone)
            throw new Error("This function can only be used on standalone mode");

        return Logger.get();
    }
}