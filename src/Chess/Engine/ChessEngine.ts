/**
 * @module ChessEngine
 * @description This module provides users to create and manage a chess game(does not include board or other ui components).
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
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
import {NotationSymbol, Piece} from "./Types";
import {MoveEngine} from "./Move/MoveEngine.ts";
import {BoardManager} from "./Board/BoardManager.ts";
import {Converter} from "../Utils/Converter";
import {BoardQuerier} from "./Board/BoardQuerier.ts";
import {Locator} from "./Move/Utils/Locator.ts";
import {Extractor} from "./Move/Utils/Extractor.ts";
import {Logger} from "../../Services/Logger.ts";


/**
 * This class provides users to create and manage a game(does not include board or other ui elements).
 */
export class ChessEngine extends BoardManager {

    /**
     * Properties of the ChessEngine class.
     */
    private moveEngine: MoveEngine;
    private playedFrom: Square | null = null;
    private playedTo: Square | null = null;
    private moveNotation: string = "";
    private currentMoves: {[key in Square]?: Moves | null} = {};
    private isPromotionMenuOpen: boolean = false;
    private isBoardPlayable: boolean = false;
    private boardHistory: Array<string> = [];

    /**
     * Constructor of the ChessEngine class.
     */
    constructor(){
        super();
        this.moveEngine = new MoveEngine();
    }

    /**
     * This function creates a new game with the given position(fen notation, json notation or StartPosition enum).
     * @see For more information about StartPosition enum check src/Chess/Types/index.ts
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        // Reset properties and create a new game.
        this.clearProperties();
        this.createBoard(typeof position !== "string" ? position : Converter.fenToJson(position));
        this.checkGameStatus();
    }

    /**
     * This function returns the current game as fen notation.
     */
    public getGameAsFenNotation(): string
    {
        return Converter.jsonToFen(BoardQuerier.getGame());
    }

    /**
     * This function returns the current game as json notation.
     */
    public getGameAsJsonNotation(): JsonNotation
    {
        return BoardQuerier.getGame();
    }

    /**
     * This function returns the current game as ascii notation.
     */
    public getGameAsASCII(): string
    {
        return Converter.jsonToASCII(BoardQuerier.getGame());
    }

    /**
     * This function turn properties to their default values.
     */
    private clearProperties(): void
    {
        this.playedFrom = null;
        this.playedTo = null;
        this.moveNotation = "";
        this.boardHistory = [];
        this.currentMoves = {};
        this.isPromotionMenuOpen = false;
        this.isBoardPlayable = false;
        this.setGameStatus(GameStatus.NotStarted);
        Logger.save("Game properties set to default on ChessEngine");
    }

    /**
     * This function checks and find the given move. For example,
     * if the given move is not in the currentMoves, it returns false.
     * Otherwise, it returns the move type.
     */
    private checkAndFindMoveType(square: Square): MoveType | null
    {
        /**
         * If currentMoves is null, then return false. Because,
         * there is no moves for the given square.
         * @see getMoves function.
         */
        if(!this.currentMoves.hasOwnProperty(square)){
            Logger.save("Move type is not found because there is no selected square");
            return null;
        }

        // Find the given move in the currentMoves.
        for(const moveType in this.currentMoves[square]){
            // If the move type is null or undefined then skip the loop.
            if(!this.currentMoves[square]?.[moveType as MoveType])
                continue;

            // Loop through the moves of the move type.
            for(let move of this.currentMoves[square]?.[moveType as MoveType]!){
                if(move === this.playedTo){
                    Logger.save(`Move type[${moveType}] is found`);
                    return moveType as MoveType;
                }
            }
        }

        // If the given move is not in the currentMoves, return null.
        Logger.save(`Move type is not found because the given move[${this.playedTo}] is not in the current moves[${JSON.stringify(this.currentMoves[square])}]`);
        return null;
    }

    /**
     * This function returns the moves of the given square with move engine.
     */
    public getMoves(square: Square): Moves | null
    {
        if(!this.isBoardPlayable || !BoardQuerier.isSquareSelectable(square)){
            Logger.save(`Moves of the square is not found because ${!this.isBoardPlayable ? `board is not playable` : ` square[${square}] is not selectable`}`);
            return null;
        }

        /**
         * Get the moves of square with move engine. If the moves of the square
         * is already calculated then get the moves from the calculatedMoves.
         * Otherwise, calculate the moves with move engine and save the moves
         */
        this.currentMoves[square] = this.currentMoves[square] ?? this.moveEngine.getMoves(square);
        Logger.save(this.currentMoves.hasOwnProperty(square)
            ? `Moves of the square[${square}] is found from calculated moves[${JSON.stringify(this.currentMoves)}]`
            : `Moves of the square[${square}] is calculated by move engine`);

        // Save the moves to the calculatedMoves.
        Logger.save(`Moves of the square is saved to calculated moves(or updated)[${JSON.stringify(this.currentMoves)}]`);

        // Return the moves.
        Logger.save("Calculation of moves of the square is finished");
        return this.currentMoves[square]!;
    }

    /**
     * This function plays the given move.
     */
    public playMove(from: Square, to: Square): void
    {
        // If the game is not started or game is finished then return.
        if([GameStatus.NotStarted, GameStatus.Draw, GameStatus.WhiteVictory, GameStatus.BlackVictory].includes(BoardQuerier.getBoardStatus())){
            Logger.save("Move is not played because game is not started or game is finished.");
            return;
        }

        // If moves is not calculated then calculate the moves.
        if(!this.currentMoves.hasOwnProperty(from)){
            Logger.save("Moves of the square is not calculated so calculate the moves");
            this.currentMoves[from] = this.getMoves(from);
        }else{
            Logger.save("Moves of the square is already calculated");
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
            this._doPromote(to);
        }
        else{
            // Check if the given move is valid.
            const move: MoveType | null = this.checkAndFindMoveType(from);
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
                    Logger.save(`Piece moved to target square[${to}] on engine`);
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
        if(saveToHistory)
        {
            /**
             * Set the current move for the move history.
             * @see For more information about history, see https://en.wikipedia.org/wiki/Algebraic_notation_(chess)
             */
            const piece: Piece = BoardQuerier.getPieceOnSquare(from)!;

            // If the piece is not pawn then add the piece name to the current move.
            if(piece?.getType() != PieceType.Pawn)
                this.moveNotation += Converter.pieceTypeToPieceName(piece.getType(), piece.getColor());

            // If the move kill a piece then add "x" to the current move.
            if(BoardQuerier.isSquareHasPiece(to)){
                // If the piece is pawn then add the column of the pawn to the current move.
                if(piece?.getType() == PieceType.Pawn)
                    this.moveNotation += Converter.squareIDToSquare(from)[0];
                this.moveNotation += NotationSymbol.Capture;
            }

            /**
             * Check if there is another piece that can move to the target square with the same type
             * and color then add the column of the piece to the current move. For example, from is
             * knight on d3 and to is e5 normally the current move is "Ne5" but if there is another
             * knight that can go to e5 then the current move is "Nde5" for distinguish the pieces.
             *
             * Note: Bishop, pawn and king can't be distinguished because they can't move to the same square.
             */
            if([PieceType.Rook, PieceType.Knight, PieceType.Queen].includes(piece!.getType())){
                const sameTypePieces: Array<Piece> = BoardQuerier.getPiecesWithFilter(piece?.getColor(), [piece?.getType()]);
                if(sameTypePieces.length > 1){
                    for(const pieceItem of sameTypePieces){
                        const squareOfPiece: Square = BoardQuerier.getSquareOfPiece(pieceItem)!;

                        if ((this.currentMoves[squareOfPiece]?.[MoveType.Normal]?.includes(to) || this.moveEngine.getMoves(squareOfPiece)?.[MoveType.Normal]?.includes(to))
                            && from != squareOfPiece) {
                            this.moveNotation += Converter.squareIDToSquare(from)[0];
                            break;
                        }
                    }
                }
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
        Logger.save(`Castling type determined[${castlingType}] on engine`);

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the "from" otherwise 2 squares
         * right of the "from".
         */
        const kingNewSquare: number = castlingType == "Long" ? Number(this.playedFrom) - 2 : Number(this.playedFrom) + 2;
        this._doNormalMove(this.playedFrom as Square, kingNewSquare as Square);
        Logger.save(`King moved to target square[${kingNewSquare}] on engine`);

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

        // Disable the castling.
        this.disableCastling((BoardQuerier.getColorOfTurn() + "Short") as CastlingType);
        this.disableCastling((BoardQuerier.getColorOfTurn() + "Long") as CastlingType);
        Logger.save(`Rook moved to target square and castling[${castlingType}] move is saved.`);

        // Set the current move for the move history.
        this.moveNotation += castlingType == "Short" ? NotationSymbol.ShortCastling : NotationSymbol.LongCastling;
    }

    /**
     * Do the en passant move.
     */
    private _doEnPassant(): void
    {
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square);
        Logger.save(`Piece moved to target square[${this.playedTo}] on engine`);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const killedPieceSquare = Number(this.playedTo) + (BoardQuerier.getPieceOnSquare(this.playedTo as Square)?.getColor() == Color.White ? 8 : -8);

        // Remove the killed piece.
        this.removePiece(killedPieceSquare);
        Logger.save(`Captured piece by en passant move is found on square[${killedPieceSquare}] and removed on engine`);

        // Set the current move for the move history.
        this.moveNotation += Converter.squareIDToSquare(this.playedFrom as Square)[0] + NotationSymbol.Capture + Converter.squareIDToSquare(this.playedTo as Square);
    }

    /**
     * Do the promote move.
     */
    private _doPromotion(): void
    {
        // Move the pawn.
        this._doNormalMove(this.playedFrom as Square, this.playedTo as Square, true);
        Logger.save(`Piece moved to target square[${this.playedTo}] on engine`);
        this.isPromotionMenuOpen = true;
    }

    /**
     * Do the promote move.
     * @param to The square of the selected piece, engine will simulate the promotion menu.
     * @example _doPromote(Square.e8) // Creates a queen on e8(white),
     * @example _doPromote(Square.e7) // Creates a rook on e8(white)
     * @example _doPromote(Square.e6) // Creates a bishop on e8(white)
     * @example _doPromote(Square.e5) // Creates a knight on e8(white),
     * @example _doPromote(Square.e1) // Creates a queen on e1(black),
     * @example _doPromote(Square.e2) // Creates a rook on e1(black)
     * @example _doPromote(Square.e3) // Creates a bishop on e1(black)
     * @example _doPromote(Square.e4) // Creates a knight on e1(black)
     */
    private _doPromote(to: Square): void
    {
        /**
         * Calculate the square that promoted piece will be created(first row for white, last row for black).
         * For example, if to is Square.d7(white rook, also square id is 12) then the first row of the square is 4.
         */
        const firstRowOfSquare: Square = to > 8 && to < 32 ? to - ((Locator.getRow(to) - 1) * 8) : to > 32 && to < 57 ? to + ((8 - Locator.getRow(to)) * 8) : to;

        // Remove the pawn.
        this.removePiece(firstRowOfSquare);
        Logger.save(`Promoted Pawn is removed from square[${to}] on engine`);

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
        const clickedRow: number = Locator.getRow(to);
        const selectedPromote: PieceType = (([8, 1].includes(clickedRow) ? PieceType.Queen : null)
            || ([7, 2].includes(clickedRow) ? PieceType.Rook : null)
            || ([6, 3].includes(clickedRow) ? PieceType.Bishop : null)
            || ([5, 4].includes(clickedRow) ? PieceType.Knight : null))!;
        Logger.save(`Promoted piece type[${selectedPromote}] is determined by clicked row[${clickedRow}] on engine`);

        // Get the player's color.
        const playerColor: Color = BoardQuerier.getColorOfTurn();

        // Create the new piece and increase the score of the player.
        this.createPiece(playerColor, selectedPromote as PieceType, firstRowOfSquare);
        this.updateScores(firstRowOfSquare);
        Logger.save(`Player's[${playerColor}] Piece[${selectedPromote}] created on square[${to}] on engine`);

        // Finish the promotion.
        this.isPromotionMenuOpen = false;
        Logger.save("Promotion is finished on engine");

        // Set the current move for the move history.
        this.moveNotation += NotationSymbol.Promotion + Converter.pieceTypeToPieceName(selectedPromote as PieceType, playerColor);
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
         * 1- Clear current moves and board playable status for the next turn.
         * 2- Change the turn(White -> Black)
         * 3- Check the game is finished or not for Black
         * 4- Set move notation of white player's move.
         * 4.1- Check en passant move for update the fen notation.
         *      - This function must be called after the saveMoveNotation function because moveEngine calculate en passant
         *      move by checking the last two moves with BoardQueyer.
         * 5- Clear the moveNotation for black player's turn.
         */
        this.currentMoves = {};
        this.isBoardPlayable = false;
        this.changeTurn();
        this.checkGameStatus();
        this.saveMoveNotation(this.moveNotation);
        this.checkEnPassant();
        this.moveNotation = "";
        Logger.save(`Turn[${BoardQuerier.getColorOfTurn()}] is finished and board is ready for the next turn`);
    }

    /**
     * Get possible en passant moves of enemy and
     * add/update them in the fen notation.
     */
    private checkEnPassant(): void
    {
        if(this.getNotation().length < 2)
            return;

        // Get the last two moves and check the last move is pawn move or not.
        const lastTwoMove: Square[] = this.getNotation().slice(-2).map(move => Converter.squareToSquareID(move));
        const lastPlayerMove: Square = lastTwoMove[0];
        if(
            BoardQuerier.getPieceOnSquare(lastPlayerMove)?.getType() != PieceType.Pawn
            || BoardQuerier.getPieceOnSquare(lastTwoMove[1])?.getType() != PieceType.Pawn
            || Locator.getRow(lastPlayerMove) != (BoardQuerier.getColorOfTurn() == Color.White ? 4 : 5) // fifth row
        ){
            this.setEnPassant(null);
            Logger.save("En passant move is not found");
            return;
        }

        /**
         * Last player's move could be calculated in the current moves at
         * the checkGameStatus function and this function is called after
         * the checkGameStatus function so check the last player's move
         * is in the current moves or not.
         */
        if(this.currentMoves.hasOwnProperty(lastPlayerMove) && this.currentMoves[lastPlayerMove]![MoveType.EnPassant] && this.currentMoves[lastPlayerMove]![MoveType.EnPassant]!.length > 0){
            this.setEnPassant(this.currentMoves[lastPlayerMove]![MoveType.EnPassant]![0]!);
            Logger.save(`En passant move[${this.currentMoves[lastPlayerMove]![MoveType.EnPassant]![0]!}] is found and set on fen notation`);
            return;
        }

        // If the last player's move is not in the current moves then calculate the moves of the last player's move.
        const lastPlayerMoves: Moves = this.moveEngine.getMoves(lastPlayerMove)!;
        if(lastPlayerMoves.hasOwnProperty(MoveType.EnPassant) && lastPlayerMoves[MoveType.EnPassant]!.length > 0){
            this.setEnPassant(lastPlayerMoves[MoveType.EnPassant]![0]!);
            Logger.save(`En passant move[${lastPlayerMoves[MoveType.EnPassant]![0]!}] is calculated and set on fen notation`);
        }
    }

    /**
     * This function calculate the game is finished or not and set the status of the game.
     *
     * @see For more information about game status types please check the src/Chess/Types/index.ts
     */
    private checkGameStatus(): void
    {
        /**
         * First, check the board is on the standard position because if the board is on the
         * standard position then continue is unnecessary.
         */
        if(Converter.jsonToFen(BoardQuerier.getGame()) == StartPosition.Standard)
        {
            Logger.save("Game status will not be checked because board is the standard position.");
            this.setGameStatus(GameStatus.InPlay);
            this.isBoardPlayable = true;
            return;
        }

        /**
         * If board is not on the standard position then check the board is playable or not.
         * If the board is not ready to play then continue is unnecessary.
         */
        this.isBoardPlayable = BoardQuerier.isBoardPlayable();
        if(this.isBoardPlayable){
            Logger.save("Game status set to InPlay because board is playable.");
            this.setGameStatus(BoardQuerier.getBoardStatus() != GameStatus.NotStarted ? BoardQuerier.getBoardStatus() : GameStatus.InPlay);
        }
        else{
            Logger.save(`Game status is not checked because board is not playable ${BoardQuerier.getBoardStatus() != GameStatus.NotStarted ? `anymore` : ``} so checkGameStatus calculation is unnecessary.`);
            this.setGameStatus(BoardQuerier.getBoardStatus() != GameStatus.NotStarted ? GameStatus.Draw : GameStatus.NotStarted);
            this.isBoardPlayable = false;
            this.moveNotation = BoardQuerier.getBoardStatus() != GameStatus.NotStarted ? NotationSymbol.Draw : "";
            return;
        }

        /**
         * Before the checking checkmate and stalemate status, check the threefold repetition and fifty
         * move rule and if any of them is satisfied then the game will be in draw status so continue is
         * unnecessary.
         */
        this._checkFiftyMoveRule();
        this._checkThreefoldRepetition();
        if(![GameStatus.InPlay, GameStatus.BlackInCheck, GameStatus.WhiteInCheck].includes(BoardQuerier.getBoardStatus()))
            return;

        /**
         * Start the continue to check, checkmate, stalemate and check status by
         * finding necessary squares and enums.
         */
        const kingSquare: Square | null = BoardQuerier.getSquareOfPiece(BoardQuerier.getPiecesWithFilter(BoardQuerier.getColorOfTurn(), [PieceType.King])[0]!);
        const threateningSquares: Square[] = BoardQuerier.isSquareThreatened(kingSquare!, BoardQuerier.getColorOfOpponent(), true) as Square[];
        Logger.save(`Threatening squares[${JSON.stringify(threateningSquares)}] are found by king's square[${kingSquare}]`);

        const checkEnum: GameStatus = BoardQuerier.getColorOfTurn() == Color.White ? GameStatus.WhiteInCheck : GameStatus.BlackInCheck;
        const checkmateEnum: GameStatus = BoardQuerier.getColorOfTurn() == Color.White ? GameStatus.BlackVictory : GameStatus.WhiteVictory;
        Logger.save(`Check[${checkEnum}] and Checkmate[${checkmateEnum}] enums are found by player's color[${BoardQuerier.getColorOfTurn()}]`);

        /**
         * If the king is threatened then the game is in check status. If game
         * is in check status then continue to check the game is in checkmate
         * status or not. If the king is not threatened then the game is in
         * play status and continue to check the game is in stalemate
         * status or not.
         *
         * @see For more information about check please check the https://en.wikipedia.org/wiki/Check_(chess)
         */
        this.setGameStatus(threateningSquares.length > 0 ? checkEnum : GameStatus.InPlay);

        // Calculate the moves of the king and save the moves to the calculatedMoves.
        let movesOfKing: Moves | null = this.moveEngine.getMoves(kingSquare!)!;
        movesOfKing = movesOfKing ?? {Normal: []};
        this.currentMoves[kingSquare!] = movesOfKing;
        Logger.save(`Moves of the king[${kingSquare}] are calculated and saved to calculated moves[${JSON.stringify(movesOfKing)}]`);

        // Check the checkmate and stalemate status.
        if(movesOfKing[MoveType.Normal]!.length == 0)
        {
            if(threateningSquares.length > 1 && BoardQuerier.getBoardStatus() == checkEnum)
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
                this.setGameStatus(checkmateEnum);
                Logger.save("Game status set to checkmate because king has no moves and threatened by more than one piece(double check)");
            }
            else
            {
                let isAnyMoveFound: boolean = false;

                /**
                 * Control Stalemate and Checkmate
                 *
                 * @see For more information about stalemate please check the https://en.wikipedia.org/wiki/Stalemate
                 * @see For more information about check mate please check the https://en.wikipedia.org/wiki/Checkmate
                 */
                for(const piece of BoardQuerier.getPiecesWithFilter(BoardQuerier.getColorOfTurn())){
                    // King's moves are already calculated so skip the king.
                    if(piece.getType() == PieceType.King)
                        continue;

                    // Calculate the moves of the piece and get squares of the moves. Also save the moves to the currentMoves for prevent unnecessary calculations.
                    const square: Square = BoardQuerier.getSquareOfPiece(piece)!;
                    this.currentMoves[square] = this.moveEngine.getMoves(square);
                    const moves: Square[] = Extractor.extractSquares(this.currentMoves[square]!);

                    // If piece has at least one move then the game is in play status.
                    if (moves.length > 0)
                    {
                        Logger.save("Doubly Check and Stalemate is not satisfied.");
                        isAnyMoveFound = true;
                        break;
                    }
                }

                /**
                 * If the piece has no moves and game is in check status then the game is in checkmate status,
                 * if game is not in check status but no moves found then the game is in stalemate status.
                 */
                if(!isAnyMoveFound){
                    if(BoardQuerier.getBoardStatus() != checkEnum){
                        this.setGameStatus(GameStatus.Draw);
                        Logger.save("Game status set to draw because king and any other pieces have no moves(stalemate)");
                    }
                    else{
                        this.setGameStatus(checkmateEnum);
                        Logger.save("Game status is set to checkmate because king has no moves and threat can't be blocked or killed by player's pieces.");
                    }
                }
            }
        }

        // Set the current status for the move history.
        if (BoardQuerier.getBoardStatus() === checkmateEnum)
            this.moveNotation += NotationSymbol.Checkmate;
        else if (BoardQuerier.getBoardStatus() === checkEnum)
            this.moveNotation += NotationSymbol.Check;
        else if (BoardQuerier.getBoardStatus() === GameStatus.Draw)
            this.moveNotation = NotationSymbol.Draw;
    }

    /**
     * Check the game is finished or not by threefold repetition rule.
     */
    private _checkThreefoldRepetition(): void
    {
        /**
         * Get the notation of the game and check the notation is
         * repeated 3 times or not. If the notation is repeated 3
         * times then the game is in draw status.
         *
         * @see For more information about threefold repetition rule, see https://en.wikipedia.org/wiki/Threefold_repetition
         */
        this.boardHistory.push(this.getGameAsFenNotation().split(" ")[0]);
        if(this.boardHistory.length > 15)
            this.boardHistory.shift();

        const notations: Array<string> = BoardQuerier.getMoveHistory().slice(-14).concat(this.moveNotation);
        const currentBoard: string = this.getGameAsFenNotation().split(" ")[0];
        if(notations.filter(notation => notation == this.moveNotation).length > 2 && this.boardHistory.filter(notation => notation == currentBoard).length > 2)
        {
            // When the threefold repetition rule is satisfied then set the game status to draw.
            this.setGameStatus(GameStatus.Draw);
            this.moveNotation = NotationSymbol.Draw;
            Logger.save("Game status set to draw by threefold repetition rule");
        }

        Logger.save("Threefold repetition rule is not satisfied.");
    }

    /**
     * Check the game is finished or not by fifty move rule.
     * @see For more information about half move count, see https://en.wikipedia.org/wiki/Fifty-move_rule
     */
    private _checkFiftyMoveRule(): void
    {
        if(BoardQuerier.getHalfMoveCount() > 101){
            this.setGameStatus(GameStatus.Draw);
            this.moveNotation = NotationSymbol.Draw;
            Logger.save("Game status set to draw by half move count");
            return;
        }
    }

    /**
     * Get color of current turn.
     */
    public getTurnColor(): Color
    {
        return BoardQuerier.getColorOfTurn();
    }

    /**
     * This function returns the status of board.
     */
    public getGameStatus(): GameStatus
    {
        return BoardQuerier.getBoardStatus();
    }

    /**
     * This function returns the algebraic notation of the game.
     */
    public getNotation(): Array<string>
    {
        return BoardQuerier.getMoveHistory();
    }

    /**
     * This function returns the scores of the players.
     */
    public getScores(): Record<Color, {score: number, pieces: PieceType[]}>
    {
        return BoardQuerier.getScores();
    }

    /**
     * This function returns the logs of the game on engine.
     */
    public getLogs(): Array<{source: string, message: string}>
    {
        return Logger.get();
    }
}
