/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/logic).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {Color, GameStatus, JsonNotation, Moves, MoveType, PieceType, Square, StartPosition} from "../Types";
import {SquareClickMode, SquareEffect} from "./Types";
import {Converter} from "../Utils/Converter.ts";
import {Logger, Source} from "../Services/Logger.ts";

/**
 * This class provides users to create and manage a chess board(does not include any mechanic/logic).
 */
export class ChessBoard {

    private colorOfPlayer: Color | null = null;
    private readonly isStandalone: boolean;

    // Store locked squares click modes to restore them after unlock the board.
    private lockedSquaresModes: Array<SquareClickMode> = [];

    // For drag and drop
    private draggedPiece: EventTarget | null = null;

    /**
     * Constructor of the class which load css file of
     * the chess board.
     */
    constructor(isStandalone: boolean = false){
        this.isStandalone = isStandalone;

        // Load css file of the chess board.
        this._loadCSS();

        // If the ChessBoard is standalone then create a game with the standard position.
        if(this.isStandalone)
            this.createGame();

        Logger.save("ChessBoard created and CSS loaded." + (this.isStandalone ? " as standalone" : ""), "constructor", Source.ChessBoard);
    }

    /**
     * This function loads the css file of the chess board.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("chessboard-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "chessboard-css";
        link.rel = "stylesheet";
        link.href = "./src/Chess/Board/assets/css/chessboard.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        if(this.isStandalone)
            Logger.clear();

        // Create squares in the board.
        this.createSquares();
        Logger.save("Squares created on ChessBoard.", "createGame", Source.ChessBoard);

        // Create the pieces.
        this.createPieces(typeof position == "string" ? Converter.fenToJson(position).board : position.board);
        Logger.save("Pieces created on ChessBoard.", "createGame", Source.ChessBoard);

        if(this.isStandalone)
            Logger.save(`Game created on ChessBoard`, "createGame", Source.ChessBoard);
    }

    /**
     * This function creates the background of the chess board in #chessboard div
     */
    private createSquares(): void
    {
        // Find the chess board element and clear it.
        let board: HTMLDivElement = document.getElementById("chessboard") as HTMLDivElement;
        board.innerHTML = "";

        // Create the squares.
        for (let i = 1; i <= 64; i++) {
            // Create the square and set the
            let square: HTMLDivElement = document.createElement("div");
            square.setAttribute("data-square-id", i.toString());
            square.className = "square";

            /**
             * Set the color of the square. This formula create a chess board pattern on the board.
             * Example for first and second row: true(i = 1), false(i = 2), true(i = 3), false, true, false,
             * true, false(i=8), false(i=9), true, false, ... false, true(i=16), true(i=17), false, true,
             * This means even numbers are white squares and odd numbers are black squares. But the sequence  is
             * changes every 8th square so if row finishes with white square, next row will start with white square
             * again or if row finishes with black square, next row will start with black square again and sequence
             * will continue.
             *
             * Another example: finishedColor(1)-oppositeColor(2)-finishedColor(3)-oppositeColor(4)-...-finishedColor(8)-finishedColor(9)
             * -oppositeColor(10)-finishedColor-oppositeColor-...-oppositeColor(16)-oppositeColor(17)-finishedColor(18)-oppositeColor-...
             */
            square.className += ((Math.floor((i - 1) / 8) + i) % 2 === 0) ? " square--black" : " square--white";

            /**
             * Set the column letters of the board. (a, b, c, d, e, f, g, h)
             * 65 > i > 56 means if the square is in the first row or bottom of the board.
             * Because top of the board is 8th row and bottom of the board is 1st row.
             * Also, letters calculated by ASCII codes. 97 is the ASCII code of "a".
             * i % 8 finds the column number of the square. If the square is in the 1st column, i % 8 will be 1.
             * If the square is in the 2nd column, i % 8 will be 2. If the square is in the 8th column, i % 8 will be 0
             * not 8. Because 8 % 8 is 0. So, we that's why we use "|| 8" in the code. This means if i % 8 is 0, use 8.
             *
             * @see For more information about ASCII codes: https://www.ascii-code.com/
             */
            if(i > 56 && i < 65)
                square.innerHTML += `<div class="column-coordinate ${i % 2 == 0 ? 'column-coordinate--white' : 'column-coordinate--black'}">${String.fromCharCode(96 + (i % 8 || 8))}</div>`;

            /**
             * Set the row numbers of the board. (1, 2, 3, 4, 5, 6, 7, 8)
             * i % 8 == 0 means if the square is in the 8th column or right of the board.
             * Because left of the board is 1st column and right of the board is 8th column and
             * we want to show the row numbers in the right of the board. Also, we use Math.floor
             * function to round the number to the nearest integer. If i is 1, 1 / 8 = 0.125.
             * Math.floor(0.125) = 0. So, we use 9 - Math.floor(i / 8) to show the row numbers
             * from 8 to 1. If i is 56, 56 / 8 = 7. 9 - Math.floor(7) = 2. So, we show the row
             * number 2 in the 56th square.
             */
            if(i % 8 == 0)
                square.innerHTML += `<div class="row-coordinate ${(i / 8) % 2 == 0 ? 'row-coordinate--white' : 'row-coordinate--black'}">${9 - Math.floor(i / 8)}</div>`;

            /**
             * Set the click mode of the square. Default click mode is "Clear"
             * which means the square will be cleared when it is clicked.
             */
            this.setSquareClickMode(square, SquareClickMode.Clear);

            // Add the square to the board.
            board.appendChild(square);
        }
    }

    /**
     * This function creates the pieces on the chess board.
     */
    private createPieces(position:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of position)
            this.createPiece(piece.color, piece.type, piece.square);
    }

    /**
     * This function creates a piece on the chess board.
     */
    private createPiece(color: Color, type:PieceType, square:Square): void
    {
        // Clear square if it is not empty.
        this.removePiece(square);

        // Create the piece element and set the class name.
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";

        // Set the piece type and color to the piece element.
        piece.setAttribute("data-piece", type);
        piece.setAttribute("data-color", color);

        /**
         * Set the click mode "Select" to the square which means
         * the square will be selected when it is clicked.
         */
        this.setSquareClickMode(square, SquareClickMode.Select);

        // Add the piece to the board.
        document.querySelector(`[data-square-id="${square.toString()}"]`)?.appendChild(piece);
    }

    /**
     * This function removes the piece from the chess board.
     */
    private removePiece(square:Square): void
    {
        // Remove the piece element if it exists.
        const squareElement = document.querySelector(`[data-square-id="${square.toString()}"]`);
        squareElement?.querySelector(".piece")?.remove();
    }

    /**
     * This function selects the square on the chess board.
     */
    public highlightSelect(squareID: Square): void
    {
        // Clear/Restore the board its default state before selecting the square.
        this.clearBoard();

        // Get the selected square by its id and set the ondragover attribute.
        const selectedSquare: HTMLDivElement = document.querySelector(`[data-square-id="${squareID.toString()}"]`) as HTMLDivElement;

        // Get the color of player(if exists) and set the piece draggable.
        const selectedPiece = selectedSquare.querySelector(".piece")!;
        this.colorOfPlayer = selectedPiece.getAttribute("data-color") as Color;
        selectedPiece.setAttribute("draggable", "true");
        selectedPiece.addEventListener("dragstart", (event) => { this.draggedPiece = event.target; });

        // Add selected effect to the selected square.
        this.setSquareEffect(selectedSquare, SquareEffect.Selected);
        Logger.save(`Selected square[${squareID}] found on DOM and Selected effect added.`, "highlightSelect", Source.ChessBoard);

        /**
         * Set the click mode "Clear" to the square because
         * we want to clear the square when it is clicked again.
         */
        this.setSquareClickMode(selectedSquare, SquareClickMode.Clear);
        Logger.save(`Selected square's[${squareID}] click mode set to clear.`, "highlightSelect", Source.ChessBoard);
    }

    /**
     * This function shows the possible moves of the given piece on the chess board.
     * @param {Moves|null} moves - Possible moves of the piece, null for is standalone version and
     * all squares will be highlighted.
     */
    public highlightMoves(moves: Moves | null = null): void
    {
        if(this.isStandalone){
            // Add all squares to the moves object, because we want to highlight all squares.
            if(moves == null)
                moves![MoveType.Normal] = Array.from({ length: 64 }, (_, index) => index + 1) as Array<Square>;
        }

        // If board is not standalone and moves is null then return.
        if(moves == null)
            return;

        // Loop through the move types.
        for(let moveType in moves){
            // If the move type is null or undefined then skip the loop.
            if(!moves[moveType as MoveType])
                continue;

            // Loop through the moves of the move type.
            for(let move of moves[moveType as MoveType]!)
            {
                /**
                 * If the move square has a piece then set the square
                 * effect "Killable" otherwise set "Playable". Also,
                 * if the board is standalone then don't set the effect
                 */
                const square = document.querySelector(`[data-square-id="${move.toString()}"]`) as HTMLDivElement;
                const squareContent = square.lastElementChild;
                if(squareContent && squareContent.className.includes("piece") && squareContent.getAttribute("data-color") !== this.colorOfPlayer)
                    this.setSquareEffect(move, SquareEffect.Killable);
                else if(!this.isStandalone)
                    this.setSquareEffect(move, SquareEffect.Playable);

                /**
                 * Set the click mode by move type.
                 * @see For more information about click modes, see SquareClickMode enum in src/Chess/Board/Types/index.ts
                 */
                const clickMode: SquareClickMode = (moveType == MoveType.Castling ? SquareClickMode.Castling : null)
                    || (moveType == MoveType.EnPassant ? SquareClickMode.EnPassant : null)
                    || (moveType == MoveType.Promotion ? SquareClickMode.Promotion : null) || SquareClickMode.Play;

                // Set the click mode to the square.
                this.setSquareClickMode(move, clickMode);

                /**
                 * Add dragover event to the square. If board is standalone then add drop event too
                 * otherwise drop event will be added in Chess.ts because board and engine will be
                 * used together in Chess.ts.
                 */
                square.addEventListener("dragover", (event: DragEvent) => { event.preventDefault(); });
                if(this.isStandalone) {
                    square.addEventListener("drop", (event: DragEvent) => {
                        event.preventDefault();
                        this.playMove(
                            parseInt(((this.draggedPiece! as HTMLElement).parentElement as HTMLDivElement).getAttribute("data-square-id")!),
                            parseInt(square.getAttribute("data-square-id")!)
                        );
                    });
                }
            }
        }

        Logger.save(`Possible moves[${JSON.stringify(moves)}] highlighted on board.`, "highlightMoves", Source.ChessBoard);
    }

    /**
     * This function moves the piece from the given square to the given square on the chess board.
     */
    public playMove(from:Square, to:Square): void
    {
        // Remove the from and to effects of enemy player before the player's move.
        this.removeEffectFromAllSquares([SquareEffect.From, SquareEffect.To, SquareEffect.Checked]);
        Logger.save(`From[${from}], To[${from}] and Checked Square's(if exits) effects are cleaned.`, "playMove", Source.ChessBoard);

        // Get the source and target square elements.
        const fromSquare: HTMLDivElement = document.querySelector(`[data-square-id="${from.toString()}"]`) as HTMLDivElement;
        const toSquare: HTMLDivElement = document.querySelector(`[data-square-id="${to.toString()}"]`) as HTMLDivElement;

        // Add effects to the From and To squares
        this.setSquareEffect(fromSquare, SquareEffect.From);
        this.setSquareEffect(toSquare, SquareEffect.To);
        Logger.save(`Moved From and Moved To effects given the From[${from}] and To[${from}] squares.`, "playMove", Source.ChessBoard);

        // Get the move type by to square's click mode attribute.
        const moveType: SquareClickMode = toSquare.getAttribute("data-click-mode") as SquareClickMode;
        switch(moveType){
            case SquareClickMode.Castling:
                this._doCastling(fromSquare, toSquare);
                break;
            case SquareClickMode.EnPassant:
                this._doEnPassant(fromSquare, toSquare);
                break;
            case SquareClickMode.Promotion:
                this._doPromotion(fromSquare, toSquare);
                break;
            case SquareClickMode.Promote:
                this._doPromote(fromSquare, toSquare);
                break;
            default:
                this._doNormalMove(fromSquare, toSquare);
                Logger.save(`Piece moved to target square[${toSquare.getAttribute("data-square-id")!}] on board`, "playMove", Source.ChessBoard);
                break;
        }

    }

    /**
     * Do the castling move on the chess board.
     */
    private _doCastling(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): void
    {
        const fromSquareId: number = parseInt(fromSquare.getAttribute("data-square-id")!);
        const toSquareId: number = parseInt(toSquare.getAttribute("data-square-id")!);

        /**
         * Get the castling type by measuring the distance between
         * the fromSquare(king) and toSquare(rook). If the distance
         * is greater than 3 then it is a long castling otherwise
         * it is a short castling.
         *
         * @see For more information about castling, see https://en.wikipedia.org/wiki/Castling
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        const castlingType: "Long" | "Short" = fromSquareId - toSquareId > 3 ? "Long" : "Short";
        Logger.save(`Castling type determined[${castlingType}] on board`, "playMove", Source.ChessBoard);

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the fromSquare otherwise 2 squares
         * right of the fromSquare.
         */
        const kingNewSquare: number = castlingType == "Long" ? fromSquareId - 2 : fromSquareId + 2;

        this._doNormalMove(
            fromSquare,
            document.querySelector(`[data-square-id="${kingNewSquare.toString()}"]`) as HTMLDivElement
        );
        Logger.save(`King moved to target square[${kingNewSquare}] by determined castling type[${castlingType}] on board`, "playMove", Source.ChessBoard);

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
        const rook: number = castlingType == "Long" ? fromSquareId - 4 : fromSquareId + 3;
        const rookNewSquare: number = castlingType == "Long" ? kingNewSquare + 1 : kingNewSquare - 1;

        this._doNormalMove(
            document.querySelector(`[data-square-id="${rook.toString()}"]`) as HTMLDivElement,
            document.querySelector(`[data-square-id="${rookNewSquare.toString()}"]`) as HTMLDivElement
        );
        Logger.save(`Rook moved to target square[${rookNewSquare}] by determined castling type[${castlingType}] on board`, "playMove", Source.ChessBoard);
    }

    /**
     * Do the en passant move on the chess board.
     */
    private _doEnPassant(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): void
    {
        this._doNormalMove(fromSquare, toSquare);
        Logger.save(`Piece moved to target square[${toSquare.getAttribute("data-square-id")!}] on board`, "playMove", Source.ChessBoard);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square if the piece is white or subtracting
         * 8 if the piece is black. Because the killed piece is
         * always in the back of the target square.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const killedPieceSquare = parseInt(toSquare.getAttribute("data-square-id")!) + (toSquare.querySelector(".piece")!.getAttribute("data-color") === Color.White ? 8 : -8);

        // Remove the killed piece.
        this.removePiece(killedPieceSquare);
        Logger.save(`Captured piece by en passant move is found on square[${killedPieceSquare}] and removed on board`, "playMove", Source.ChessBoard);
    }

    /**
     * Do the promotion move on the chess board.
     */
    private _doPromotion(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): void
    {
        this._doNormalMove(fromSquare, toSquare);
        Logger.save(`Piece moved to target square[${toSquare.getAttribute("data-square-id")!}] on board`, "playMove", Source.ChessBoard);

        this._showPromotions(toSquare.querySelector(".piece") as HTMLDivElement);
    }

    /**
     * Do the promote move on the chess board.
     */
    private _doPromote(promoteSquare:HTMLDivElement, selectedSquare:HTMLDivElement): void
    {
        // Find selected option and create the piece.
        const selectedOption: HTMLDivElement = selectedSquare.lastElementChild as HTMLDivElement;
        const color: Color = selectedOption.getAttribute("data-color") as Color;
        const pieceType: PieceType = selectedOption.getAttribute("data-piece") as PieceType;

        // Create the piece first row if the piece is white otherwise create the piece last row.
        const targetSquare: Square = Number(promoteSquare.getAttribute("data-square-id")!) as Square;
        this.createPiece(color, pieceType, targetSquare);
        Logger.save(`Player's[${color}] Piece[${pieceType}] created on square[${targetSquare}] on board`, "playMove", Source.ChessBoard);

        this._closePromotions();
    }

    /**
     * Do the normal move(move piece to another square) on the chess board.
     */
    private _doNormalMove(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): void
    {
        // Clear the target square.
        this.removePiece(parseInt(toSquare.getAttribute("data-square-id")!));
        Logger.save(`Target square[${toSquare.getAttribute("data-square-id")!}] removed on board`, "playMove", Source.ChessBoard);

        // Move piece from the source square(from) to the target square(to).
        toSquare.appendChild(fromSquare.querySelector(".piece")!);
    }

    /**
     * This function removes the effects from board.
     */
    public clearBoard(): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");

        for(let i = 0; i <= 63; i++){
            // Get ID of the square.
            let id = parseInt(squares[i].getAttribute("data-square-id") as string);

            /**
             * If the square id is not equal to i + 1 then set the square id to i + 1.
             * This scenario can happen when the player change square is id in DOM with devtools.
             * So, we need to fix the square id's.
             */
            if (id !== i + 1){
                squares[i].setAttribute("data-square-id", (i+1).toString());
                Logger.save(`ID of square's fixed from[${id}] to [${(i+1).toString()}] on board`, "clearBoard", Source.ChessBoard);
            }

            /**
             * Remove the effects of the square(except check and move effects,
             * because it is effect for next move/player).
             */
            this.removeSquareEffect(squares[i], [
                SquareEffect.Playable,
                SquareEffect.Killable,
                SquareEffect.Selected,
            ]);

            /**
             * If the square has a piece then set the click mode "Select"
             * otherwise set the click mode "Clear".
             * Note: Also, promotion options must not be set to "Select"
             * when clearing the board.
             */
            const squareClassName = squares[i].lastElementChild?.className;
            if (squareClassName?.includes("piece")){
                squares[i].lastElementChild?.setAttribute("draggable", "false");
                if(!squareClassName?.includes("promotion-option"))
                    this.setSquareClickMode(squares[i] as HTMLDivElement, SquareClickMode.Select);
            }
            else // If the square does not have a piece
                this.setSquareClickMode(squares[i] as HTMLDivElement, SquareClickMode.Clear);
        }

        Logger.save("Playable, Killable, Selected effects are cleaned and Square Click Modes changes to Clear and Select(if square has piece)", "clearBoard", Source.ChessBoard);
    }

    /**
     * Lock board interactions.
     */
    private lockBoard(useDisableEffect: boolean = true): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");
        for(let i = 0; i <= 63; i++){

            // Save the click mode of the square. We will use it when we unlock the board.
            this.lockedSquaresModes.push(squares[i].getAttribute("data-click-mode") as SquareClickMode);

            // Set the click mode "Disable" to the square.
            this.setSquareClickMode(squares[i], SquareClickMode.Disable);

            // Set disabled effect to the square.
            if(useDisableEffect)
                this.setSquareEffect(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Enable board interactions.
     */
    private unlockBoard(): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");

        for(let i = 0; i <= 63; i++){
            /**
             * Set the click mode of the square to the mode which we saved
             * when we locked the board.
             */
            this.setSquareClickMode(squares[i], this.lockedSquaresModes[i]);

            // Remove disabled effect from the square.
            this.removeSquareEffect(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Show status of game on the board.
     */
    public showStatus(status: GameStatus): void
    {
        if(status == GameStatus.WhiteInCheck || status == GameStatus.BlackInCheck)
            this._showCheck(status);
        else if(status == GameStatus.WhiteVictory || status == GameStatus.BlackVictory)
            this._showCheckmateMessage(status);
        else if(status == GameStatus.Draw)
            this._showStalemateMessage();
    }

    /**
     * Show check status on the board.
     */
    private _showCheck(checkedStatus: GameStatus.WhiteInCheck | GameStatus.BlackInCheck): void
    {
        const color: Color = checkedStatus == GameStatus.WhiteInCheck ? Color.White : Color.Black;
        const king: HTMLDivElement = document.querySelector(`.piece[data-piece="${PieceType.King}"][data-color="${color}"]`) as HTMLDivElement;
        this.setSquareEffect(king.parentElement as HTMLDivElement, SquareEffect.Checked)
        Logger.save(`King's square[${king.parentElement!.getAttribute("data-square-id")!}] found on DOM and Checked effect added`, "_showCheck", Source.ChessBoard);
    }

    /**
     * Show checkmate status on the board.
     */
    private _showCheckmateMessage(wonStatus: GameStatus.WhiteVictory | GameStatus.BlackVictory): void
    {
        this.lockBoard(false);
        this._showMessage(`${wonStatus == GameStatus.WhiteVictory ? "White" : "Black"} won!`);
        Logger.save(`Board locked and Checkmate message[${wonStatus}] showed on board.`, "_showCheckmateMessage", Source.ChessBoard);
    }

    /**
     * Show stalemate status on the board.
     */
    private _showStalemateMessage(): void
    {
        this.lockBoard(false);
        this._showMessage("Draw!");
        Logger.save(`Board locked and Draw message showed on board.`, "_showStalemateMessage", Source.ChessBoard);
    }

    /**
     * Show result message on the board.
     */
    private _showMessage(message: string): void
    {
        // Create the message element.
        const messageElement: HTMLDivElement = document.createElement("div");
        messageElement.className = "result-message";
        messageElement.innerHTML = message;

        // Add the message to the board.
        document.getElementById("chessboard")?.appendChild(messageElement);
    }

    /**
     * Show promotion menu.
     */
    private _showPromotions(promotedPawn: HTMLDivElement): void
    {
        // Get the square of the promoted pawn.
        const square: Square = parseInt(promotedPawn.parentElement!.getAttribute("data-square-id")!) as Square;

        /**
         * Disable the board. We don't want to allow player to
         * move pieces while choosing promotion piece.
         */
        this.lockBoard();
        Logger.save("Board locked for promotion screen", "_showPromotions", Source.ChessBoard);

        // Hide the promoted pawn.
        promotedPawn.remove();
        Logger.save(`Promoted Pawn is removed from square[${square}] on board`, "_showPromotions", Source.ChessBoard);

        // Create promotion options. (Queen, Rook, Bishop, Knight)
        const PROMOTION_TYPES: Array<string> = [PieceType.Queen, PieceType.Rook, PieceType.Bishop, PieceType.Knight];

        // Create promotion menu for every promotion option.
        for(let i = 0; i < 4; i++){
            // Create promotion option and set attributes.
            let promotionOption: HTMLDivElement = document.createElement("div");
            promotionOption.className = "piece";
            promotionOption.className += " promotion-option";

            // Set piece type of promotion option.
            promotionOption.setAttribute("data-piece", PROMOTION_TYPES[i]);

            // Set color of promotion option to the color of promoted pawn.
            promotionOption.setAttribute("data-color", promotedPawn.getAttribute("data-color") as string);

            /**
             * Set position.
             * Promotion options are placed in the same column as the promoted pawn.
             * Example for white: square = 1, first promotion option(queen) is 1 + 8 = 9, second promotion option(rook) is 1 + 8 + 8 = 17, etc.
             * Example for black: square = 57, first promotion option(queen) is 57 - 8 = 49, second promotion option(rook) is 57 - 8 - 8 = 41, etc.
             */
            let targetSquare: HTMLDivElement = document.querySelector(
                `[data-square-id="${(square < 9 ? square + (i * 8) : square - (i * 8)).toString()}"]`
            ) as HTMLDivElement;
            targetSquare.appendChild(promotionOption);

            // Set click mode and remove disabled effect.
            this.removeSquareEffect(targetSquare, SquareEffect.Disabled);
            this.setSquareClickMode(targetSquare, SquareClickMode.Promote);
            Logger.save("Promote options are created, disabled effect removed and click modes set to promote", "_showPromotions", Source.ChessBoard);
        }
        Logger.save("Promotion screen showed on board.", "_showPromotions", Source.ChessBoard);
    }

    /**
     * Close promotion menu.
     */
    private _closePromotions(): void
    {
        // Find promotion options
        let promotionOptions: NodeListOf<Element> = document.querySelectorAll(".promotion-option");

        // Remove promotion options.
        for(let i = 0; i < 3; i++)
            promotionOptions[i].remove();
        Logger.save("Promotion screen closed.", "_closePromotions", Source.ChessBoard);

        /**
         * Enable the board. If the player choose a promotion piece then
         * allow player to interact with the board.
         */
        this.unlockBoard();
        Logger.save("Board unlocked after promotion screen closed.", "_closePromotions", Source.ChessBoard);
    }

    /**
     * This function sets the click mode of the given square element or id(squareID).
     */
    private setSquareClickMode(square: Square|HTMLDivElement|Element, mode:SquareClickMode): void
    {
        // If the game is finished then do not allow to change the click mode.
        if(document.querySelector(".result-message"))
            return;

        // If the square is a number then get the square element by id/number.
        if(typeof square === "number")
            square = document.querySelector(`[data-square-id="${square.toString()}"]`) as HTMLDivElement;

        // Set the click mode to the square.
        square.setAttribute("data-click-mode", mode);
    }

    /**
     * This function sets the effect of the given square element or id(squareID).
     */
    private setSquareEffect(square: Square|HTMLDivElement|Element, effect: SquareEffect): void
    {
        // If the square is a number then get the square element by id/number.
        if(typeof square === "number")
            square = document.querySelector(`[data-square-id="${square.toString()}"]`) as HTMLDivElement;

        // Add the effect to the square's class name.
        square.className += ` square-effect--${effect}`;
    }

    /**
     * This function clears the effect of the given square element or id(squareID).
     * @example removeEffectOfSquare(1, SquareEffect.Select); // Removes the select effect of the square with id 1.
     * @example removeEffectOfSquare(1); // Removes all effects of the square with id 1.
     * @example removeEffectOfSquare(1, [SquareEffect.Select, SquareEffect.Move]); // Removes the select and move effects of the square with id 1.
     */
    private removeSquareEffect(square: Square|HTMLDivElement|Element, effect: SquareEffect|Array<SquareEffect>|null = null): void
    {
        // If the square is a number then get the square element by id/number.
        if(typeof square === "number")
            square = document.querySelector(`[data-square-id="${square.toString()}"]`) as HTMLDivElement;

        /**
         * If the effect is null then remove all effects from the square with regex.
         * If the effect is an array then remove all effects from the square which are in the array.
         * If the effect is not an array then convert it to an array and remove all effects from the square which are in the array.
         */
        if(effect == null)
            square.className = square.className.replace(/square-effect--\w+/g, "");
        else{
            // Convert the effect to an array if it is not an array.
            if(!Array.isArray(effect))
                effect = [effect];

            // Remove all effects from the square which are in the array.
            for(let e of effect)
                square.className = square.className.replace(`square-effect--${e}`, "");
        }
    }

    /**
     * Find and remove the given effects from all squares.
     */
    private removeEffectFromAllSquares(effects: Array<SquareEffect>): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");

        // Remove the given effect from all squares.
        for(let i = 0; i <= 63; i++)
            this.removeSquareEffect(squares[i], effects);
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