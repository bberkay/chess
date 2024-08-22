/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/logic).
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import {Color, GameStatus, JsonNotation, Moves, MoveType, PieceType, Square, StartPosition} from "../Types";
import {SoundEffect, SquareClickMode, SquareEffect} from "./Types";
import {Converter} from "../Utils/Converter.ts";
import {Logger, Source} from "../Services/Logger.ts";

/**
 * This class provides users to create and manage a chess board(does not include any mechanic/logic).
 */
export class ChessBoard {

    private sounds: {[key in SoundEffect]: HTMLAudioElement} = {
        Start: new Audio("./sounds/game-start.mp3"),
        WhiteMove: new Audio("./sounds/move-self.mp3"),
        BlackMove: new Audio("./sounds/move-opponent.mp3"),
        Capture: new Audio("./sounds/capture.mp3"),
        Castle: new Audio("./sounds/castle.mp3"),
        Check: new Audio("./sounds/move-check.mp3"),
        Promote: new Audio("./sounds/promote.mp3"),
        End: new Audio("./sounds/game-end.mp3"),
    };
    private lockedSquaresModes: Array<SquareClickMode> = [];
    public turnColor: Color.White | Color.Black = Color.White;

    /**
     * Constructor of the class which load css file of
     * the chess board.
     */
    constructor(){
        this._loadCSS();
        this._loadSounds();
    }

    /**
     * This function loads the css file of the chess board.
     */
    private _loadCSS(): void
    {
        if(document.getElementById("chessboard-css"))
            return;

        let link: HTMLLinkElement = document.createElement("link");
        link.id = "chessboard-css";
        link.rel = "stylesheet";
        link.href = './css/chessboard.css';
        document.head.appendChild(link);
    }

    /**
     * This function loads the sounds files of the chess board.
     */
    private _loadSounds(): void
    {
        for(const sound of Object.values(this.sounds)){
            document.body.appendChild(sound);
        }
    }

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void
    {
        this.createBoard();
        Logger.save("Chessboard created.", "createGame", Source.ChessBoard);

        this.createPieces(typeof position == "string" ? Converter.fenToJson(position).board : position.board);
        Logger.save("Pieces created on ChessBoard.", "createGame", Source.ChessBoard);

        this.playSound(SoundEffect.Start);
    }

    /**
     * Current player of the game.
     */
    public setTurnColor(color: Color.White | Color.Black): void
    {
        this.turnColor = color;
        document.querySelectorAll(`.piece`).forEach((element) => {
            const square = element.parentElement!;
            if(!square.lastElementChild?.className.includes("promotion-option") && element.getAttribute("data-color") == this.turnColor)
                this.setSquareClickMode(square, SquareClickMode.Select);
            else
                this.setSquareClickMode(square, SquareClickMode.Clear);
        });
    }

    /**
     * This function creates the background of the chess board in #chessboard div
     */
    private createBoard(): void
    {
        let board: HTMLDivElement = document.getElementById("chessboard") as HTMLDivElement;
        board.innerHTML = "";

        for (let i = 1; i <= 64; i++) {
            let square: HTMLDivElement = document.createElement("div");
            this.setSquareID(square, i);
            square.className = "square";
            this.setSquareClickMode(square, SquareClickMode.Clear); // Default mode

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
        this.removePiece(square);
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";
        piece.setAttribute("data-piece", type);
        piece.setAttribute("data-color", color);
        this.getSquareElement(square).appendChild(piece);
        this.setSquareClickMode(piece.parentElement!, SquareClickMode.Select);
    }

    /**
     * This function removes the piece from the chess board if exists.
     */
    private removePiece(squareID: Square): void
    {
        const squareElement = this.getSquareElement(squareID);
        squareElement?.querySelector(".piece")?.remove();
    }

    /**
     * 
     */
    public listenForMove(callbacks: {
        onClick?: (square: HTMLElement) => void,
        onMouseDown?: (square: HTMLElement) => void,
        onMouseUp?: (element?: any) => void
    }): void
    {
        Logger.save("Listening for move.", "listenForMove", Source.ChessBoard);
        const squares = this.getAllSquares();
        squares.forEach(square => {
            if(callbacks.onClick){
                square.addEventListener("click", (e) => {
                    callbacks.onClick!(square);
                });
            }
            if (callbacks.onMouseDown){
                square.addEventListener("mousedown", (e) => {
                    if(square.querySelector(".piece")?.getAttribute("data-color") != this.turnColor)
                        return;

                    callbacks.onMouseDown!(square);
                    this.stickPieceToCursor(e, square);
              });
            }
        });
        if (callbacks.onMouseUp){
            document.addEventListener("mouseup", (e) => {
                if(!document.querySelector(".piece.cloned"))
                    return;
                
                this.dropPiece(e);
                const targetSquare = document.elementFromPoint(e.clientX, e.clientY)?.parentElement;
                callbacks.onMouseUp!(targetSquare);
            });
        }
    }

    /**
     * This function selects the square on the chess board.
     */
    public selectPiece(squareID: Square): void
    {
        this.refresh();
        const selectedSquare = this.getSquareElement(squareID);
        this.setSquareEffect(selectedSquare, SquareEffect.Selected);
        Logger.save(`Selected square[${squareID}] found on DOM and Selected effect added.`, "selectPiece", Source.ChessBoard);

        /**
         * Set the click mode "Clear" to the square because
         * we want to clear the square when it is clicked again.
         */
        this.setSquareClickMode(selectedSquare, SquareClickMode.Clear);
        Logger.save(`Selected square's[${squareID}] click mode set to clear.`, "selectPiece", Source.ChessBoard);
    }

    /**
     * Stick the piece to the cursor when the user clicks on the piece.
     */
    private stickPieceToCursor(downEvent: MouseEvent, square: HTMLElement): void {
        const originalPiece = square.querySelector(".piece") as HTMLElement;
        if (!originalPiece || document.querySelector(".piece.cloned")) return;
        const clonedPiece = originalPiece.cloneNode(true) as HTMLElement;
        originalPiece.classList.add("dragging");
        clonedPiece.classList.add("cloned");
        document.body.appendChild(clonedPiece);
        clonedPiece.style.position = "absolute";
        clonedPiece.style.top = `calc(${downEvent.clientY}px - ${clonedPiece.offsetHeight / 2}px)`;
        clonedPiece.style.left = `calc(${downEvent.clientX}px - ${clonedPiece.offsetWidth / 2}px)`;
        document.addEventListener("mousemove", this.dragPiece);
    }

    /**
     * Drag the cloned piece with the cursor.
     */
    private dragPiece(moveEvent: MouseEvent): void {
        const clonedPiece = document.querySelector(".piece.cloned") as HTMLElement;
        if (!clonedPiece) return;
        clonedPiece.style.top = `calc(${moveEvent.clientY}px - ${clonedPiece.offsetHeight / 2}px)`;
        clonedPiece.style.left = `calc(${moveEvent.clientX}px - ${clonedPiece.offsetWidth / 2}px)`;

        // Highlight the square where the cursor is.
        /*document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY).forEach((square) => {
            console.log(square);
            if(square.className.includes('square') && this.getSquareClickMode(square) == SquareClickMode.Play){
                this.getAllSquares().forEach((square) => {
                    this.removeSquareEffect(square, SquareEffect.Hovering);
                });
                this.setSquareEffect(square, SquareEffect.Hovering);
            }
         });*/
    }

    /**
     * Drop the piece to the square where the cursor is.
     */
    private dropPiece(upEvent: MouseEvent): void {
        const originalPiece = document.querySelector(".piece.dragging") as HTMLElement;
        const clonedPiece = document.querySelector(".piece.cloned") as HTMLElement;
        if (clonedPiece) {
            clonedPiece.remove();
            const targetSquare: Element | null = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
            if (targetSquare 
                && targetSquare.className.includes(`square`) 
                && this.getSquareClickMode(targetSquare) == SquareClickMode.Play
            )
                targetSquare.appendChild(originalPiece);
        }
        if(originalPiece) originalPiece.classList.remove("dragging");
        document.removeEventListener("mousemove", this.dragPiece);
    }

    /**
     * This function shows the possible moves of the given piece on the chess board.
     * @param {Moves|null} moves - Possible moves of the piece, null for is standalone version and
     * all squares will be highlighted.
     */
    public highlightMoves(moves: Moves | null = null): void
    {
        // If board is not standalone but moves is null then return.
        if(moves == null)
            return;

        for(let moveType in moves){
            if(!moves[moveType as MoveType])
                continue;

            for(let move of moves[moveType as MoveType]!)
            {
                // if the board is standalone then don't set the effect
                // because there will be no "enemy" since there is no engine to calculate that.
                const square = this.getSquareElement(move);
                const squareContent = square.lastElementChild;
                if(squareContent && squareContent.className.includes("piece"))
                    this.setSquareEffect(move, SquareEffect.Killable);
                else
                    this.setSquareEffect(move, SquareEffect.Playable);
                this.setSquareClickMode(move, (moveType == MoveType.Castling ? SquareClickMode.Castling : null)
                    || (moveType == MoveType.EnPassant ? SquareClickMode.EnPassant : null)
                    || (moveType == MoveType.Promotion ? SquareClickMode.Promotion : null) || SquareClickMode.Play);
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
        Logger.save(`From[${from}], To[${to}] and Checked Square's(if exits) effects are cleaned.`, "playMove", Source.ChessBoard);
        const fromSquare: HTMLDivElement = this.getSquareElement(from);
        const toSquare: HTMLDivElement = this.getSquareElement(to);
        this.setSquareEffect(fromSquare, SquareEffect.From);
        this.setSquareEffect(toSquare, SquareEffect.To);
        Logger.save(`Moved From and Moved To effects given the From[${from}] and To[${from}] squares.`, "playMove", Source.ChessBoard);

        const moveType: SquareClickMode = this.getSquareClickMode(toSquare);
        switch(moveType){
            case SquareClickMode.Castling:
                this._doCastling(fromSquare, toSquare).then();
                break;
            case SquareClickMode.EnPassant:
                this._doEnPassant(fromSquare, toSquare).then();
                break;
            case SquareClickMode.Promotion:
                this._doPromotion(fromSquare, toSquare).then();
                break;
            case SquareClickMode.Promote:
                this._doPromote(toSquare);
                break;
            default:
                this._doNormalMove(fromSquare, toSquare).then();
                break;
        }
    }

    /**
     * Do the normal move(move piece to another square) with animation on the chess board.
     */
    private _doNormalMove(fromSquare:HTMLDivElement, toSquare:HTMLDivElement, playMoveSound: boolean = true): Promise<void>
    {
        return new Promise((resolve) => {
            this.removePiece(this.getSquareID(toSquare));
            Logger.save(`Target square[${this.getSquareID(toSquare)}] removed on board`, "playMove", Source.ChessBoard);

            /*const piece: HTMLDivElement = fromSquare.querySelector(".piece") as HTMLDivElement;
            this.animatePieceToSquare(piece, toSquare);*/

            if(playMoveSound){
                if(toSquare.lastElementChild && toSquare.lastElementChild.className.includes("piece"))
                    this.playSound(SoundEffect.Capture);
                else
                  this.playSound(this.turnColor == Color.White ? SoundEffect.WhiteMove : SoundEffect.BlackMove);
            }
            resolve();
        });
    }

    /**
     * Move the piece to the square with animation.
     */
    private animatePieceToSquare(piece: HTMLElement, square: HTMLElement): void {
        if (!piece) return;
        const pieceRect = piece.getBoundingClientRect();
        const marginLeft = Math.abs(piece.parentElement!.getBoundingClientRect().left - pieceRect.left);
        const marginTop = Math.abs(piece.parentElement!.getBoundingClientRect().top - pieceRect.top);

        document.body.appendChild(piece);
        piece.style.top = `${pieceRect.top}px`;
        piece.style.left = `${pieceRect.left}px`;
        piece.style.animation = "move 0.3s ease-in-out forwards";
        piece.style.setProperty("--move-from-left", `${pieceRect.left}px`);
        piece.style.setProperty("--move-from-top", `${pieceRect.top}px`);
        piece.style.setProperty("--move-to-left", `calc(${marginLeft}px + ${square.getBoundingClientRect().left}px)`);
        piece.style.setProperty("--move-to-top", `calc(${marginTop}px + ${square.getBoundingClientRect().top}px)`);

        piece.addEventListener("animationend", () => {
          square.appendChild(piece);
          piece.style.animation = "";
          piece.style.top = "";
          piece.style.left = "";
        });
    }

    /**
     * Do the castling move on the chess board.
     */
    private async _doCastling(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): Promise<void>
    {
        const fromSquareId: number = this.getSquareID(fromSquare)
        const toSquareId: number = this.getSquareID(toSquare);

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
        await this._doNormalMove(
            fromSquare,
            this.getSquareElement(kingNewSquare)
        )
        Logger.save(`King moved to target square[${kingNewSquare}] by determined castling type[${castlingType}] on board`, "playMove", Source.ChessBoard);

        /**
         * If the castling is long and the king's current square
         * is "e1"(61) then the rook's current square is "a1"(57) and rook's
         * new square is "d1"(60).
         */
        const rook: number = castlingType == "Long" ? fromSquareId - 4 : fromSquareId + 3;
        const rookNewSquare: number = castlingType == "Long" ? kingNewSquare + 1 : kingNewSquare - 1;
        await this._doNormalMove(
            this.getSquareElement(rook),
            this.getSquareElement(rookNewSquare),
            false
        );
        this.playSound(SoundEffect.Castle);
        Logger.save(`Rook moved to target square[${rookNewSquare}] by determined castling type[${castlingType}] on board`, "playMove", Source.ChessBoard);
    }

    /**
     * Do the en passant move on the chess board.
     */
    private async _doEnPassant(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): Promise<void>
    {
        await this._doNormalMove(fromSquare, toSquare);
        Logger.save(`Piece moved to target square[${this.getSquareID(toSquare)}] on board`, "playMove", Source.ChessBoard);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square. If toSquare is in the 3rd row
         * then toSquare has white pawn add 8 otherwise toSquare
         * has black pawn subtract 8.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const toSquareID = this.getSquareID(toSquare)
        const killedPieceSquare = toSquareID + (Math.ceil(toSquareID / 8) == 3 ? 8 : -8);
        this.removePiece(killedPieceSquare);
        this.playSound(SoundEffect.Capture);
        Logger.save(`Captured piece by en passant move is found on square[${killedPieceSquare}] and removed on board`, "playMove", Source.ChessBoard);
    }

    /**
     * Do the promotion move on the chess board.
     */
    private async _doPromotion(fromSquare:HTMLDivElement, toSquare:HTMLDivElement): Promise<void>
    {
        await this._doNormalMove(fromSquare, toSquare);
        Logger.save(`Piece moved to target square[${this.getSquareID(toSquare)}] on board`, "playMove", Source.ChessBoard);
        this._showPromotions(toSquare);
    }

    /**
     * Do the promote move on the chess board.
     */
    private _doPromote(selectedSquare:HTMLDivElement): void
    {
        const selectedOption: HTMLDivElement = selectedSquare.lastElementChild as HTMLDivElement;
        const color: Color = selectedOption.getAttribute("data-color") as Color;
        const pieceType: PieceType = selectedOption.getAttribute("data-piece") as PieceType;

        /**
         * Create the piece first row if the piece is white otherwise create the piece last row
         * by finding the first row of the square. For example, if the square is "a7" then the
         * first row of the square is "a8". If the square is "h2" then the first row of the square
         * is "h1".
         */
        let firstRowOfSquare: string | Square = Converter.squareIDToSquare(this.getSquareID(selectedSquare));
        firstRowOfSquare = Converter.squareToSquareID(firstRowOfSquare.replace(firstRowOfSquare.slice(-1), (color == Color.White ? "8" : "1")));
        this.createPiece(color, pieceType, firstRowOfSquare);
        this._closePromotions();

        // Set the square effect of the promoted square on the last row.
        this.setSquareEffect(firstRowOfSquare, SquareEffect.To);
        this.playSound(SoundEffect.Promote);
        Logger.save(`Player's[${color}] Piece[${pieceType}] created on square[${firstRowOfSquare}] on board`, "playMove", Source.ChessBoard);
    }

    /**
     * This function removes the effects from board.
     */
    public refresh(): void
    {
        const squares: NodeListOf<Element> = this.getAllSquares();
        const isFlipped = this.isFlipped();
        const loopRange = isFlipped ? [63, -1, -1] : [0, 64, 1];
        for(let i = loopRange[0]; i != loopRange[1]; i+=loopRange[2]){
            const id = this.getSquareID(squares[Math.abs(loopRange[0] - i)]);

            /**
             * If the square id is not equal to i + forInc[2] then set the square id to i + forInc[2].
             * This scenario can happen when the player change square is id in DOM with devtools.
             * So, we need to fix the square id's.
             */
            if (id !== i + Math.abs(loopRange[2])){
                this.setSquareID(squares[i], i + loopRange[2]);
                Logger.save(`ID of square's fixed from[${id}] to [${(i + loopRange[2]).toString()}] on board`, "refreshBoard", Source.ChessBoard);
            }
        }
        this.removeEffectFromAllSquares([SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Selected]);
        this.setTurnColor(this.turnColor);
        Logger.save("Playable, Killable, Selected effects are cleaned and Square Click Modes changes to Clear and Select(if square has piece)", "refreshBoard", Source.ChessBoard);
    }

    /**
     * This function checks if the board is flipped or not.
     */
    private isFlipped(): boolean
    {
      return this.getAllSquares()[56].querySelector(".column-coordinate")!.textContent == "h";
    }

    /**
     * Flips the board without changing the square ids.
     */
    public flip(): void
    {
        this.refresh();

        // Changes pieces
        for(let id = 64; id >= 33; id--){
            const normalSquare = this.getSquareElement(id);
            const flippedSquare = this.getSquareElement(65 - id);
            const normalSquarePiece = normalSquare.querySelector(".piece");
            const flippedSquarePiece = flippedSquare.querySelector(".piece");
            if(normalSquarePiece) flippedSquare.appendChild(normalSquarePiece);
            if(flippedSquarePiece) normalSquare.appendChild(flippedSquarePiece);
            this.setSquareID(normalSquare, 65 - id);
            this.setSquareID(flippedSquare, id);
            const normalSquareClickMode = this.getSquareClickMode(normalSquare);
            const flippedSquareClickMode = this.getSquareClickMode(flippedSquare);
            this.setSquareClickMode(normalSquare, flippedSquareClickMode);
            this.setSquareClickMode(flippedSquare, normalSquareClickMode);
        }

        // Flip coordinates of rows and columns
        const squares: NodeListOf<Element> = this.getAllSquares();
        for (let i = 8; i >= 1; i--){
            const rowSquare = squares[(8 * i) - 1].querySelector(" .row-coordinate");
            rowSquare!.textContent = String(9 - parseInt(rowSquare!.textContent as string));
        }

        const isFlipped = this.isFlipped();
        for (let i = 1; i <= 8; i++){
            const columnSquare = squares[(56 + i) - 1].querySelector(" .column-coordinate");
            columnSquare!.textContent = String.fromCharCode(isFlipped ? 96 + i : 105 - i);
        }
    }

    /**
     * Lock board interactions.
     */
    private lock(useDisableEffect: boolean = true): void
    {
        let squares: NodeListOf<Element> = this.getAllSquares();
        for(let i = 0; i <= 63; i++){
            this.lockedSquaresModes.push(this.getSquareClickMode(squares[i]));
            this.setSquareClickMode(squares[i], SquareClickMode.Disable);
            if(useDisableEffect) this.setSquareEffect(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Enable board interactions.
     */
    private unlock(): void
    {
        let squares: NodeListOf<Element> = this.getAllSquares();
        for(let i = 0; i <= 63; i++){
            this.setSquareClickMode(squares[i], this.lockedSquaresModes[i]);
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
        this.setSquareEffect(king.parentElement as HTMLDivElement, SquareEffect.Checked);
        this.playSound(SoundEffect.Check);
        Logger.save(`King's square[${this.getSquareID(king.parentElement!)}] found on DOM and Checked effect added`, "_showCheck", Source.ChessBoard);
    }

    /**
     * Show checkmate status on the board.
     */
    private _showCheckmateMessage(wonStatus: GameStatus.WhiteVictory | GameStatus.BlackVictory): void
    {
        this.lock(false);
        this._showMessage(`${wonStatus == GameStatus.WhiteVictory ? "White" : "Black"} won!`);
        Logger.save(`Board locked and Checkmate message[${wonStatus}] showed on board.`, "_showCheckmateMessage", Source.ChessBoard);
    }

    /**
     * Show stalemate status on the board.
     */
    private _showStalemateMessage(): void
    {
        this.lock(false);
        this._showMessage("Draw!");
        Logger.save(`Board locked and Draw message showed on board.`, "_showStalemateMessage", Source.ChessBoard);
    }

    /**
     * Show result message on the board.
     */
    private _showMessage(message: string): void
    {
        const messageElement: HTMLDivElement = document.createElement("div");
        messageElement.className = "result-message";
        messageElement.innerHTML = message;
        document.getElementById("chessboard")?.appendChild(messageElement);
        this.playSound(SoundEffect.End);
    }

    /**
     * Show promotion menu.
     */
    private _showPromotions(promotionSquare: HTMLDivElement): void
    {
        const square: Square = this.getSquareID(promotionSquare);
        this.removePiece(square);
        Logger.save(`Promoted Pawn is removed from square[${square}] on board`, "_showPromotions", Source.ChessBoard);

        /**
         * Disable the board. We don't want to allow player to
         * move pieces while choosing promotion piece.
         */
        this.lock();
        Logger.save("Board locked for promotion screen", "_showPromotions", Source.ChessBoard);

        const PROMOTION_TYPES: Array<string> = [PieceType.Queen, PieceType.Rook, PieceType.Bishop, PieceType.Knight];
        for(let i = 0; i < 4; i++){
            let promotionOption: HTMLDivElement = document.createElement("div");
            promotionOption.className = "piece";
            promotionOption.className += " promotion-option";
            promotionOption.setAttribute("data-piece", PROMOTION_TYPES[i]);
            promotionOption.setAttribute("data-color", square < 9 ? Color.White : Color.Black);

            /**
             * Set position.
             * Promotion options are placed in the same column as the promoted pawn.
             * Example for white: square = 1, first promotion option(queen) is 1 + 8 = 9, second promotion option(rook) is 1 + 8 + 8 = 17, etc.
             * Example for black: square = 57, first promotion option(queen) is 57 - 8 = 49, second promotion option(rook) is 57 - 8 - 8 = 41, etc.
             */
          let targetSquare: HTMLDivElement = this.getSquareElement(square < 9 ? square + (i * 8) : square - (i * 8));
            targetSquare.appendChild(promotionOption);

            this.removeSquareEffect(targetSquare, SquareEffect.Disabled);
            this.setSquareClickMode(targetSquare, SquareClickMode.Promote);
        }
        Logger.save("Promotion screen showed on board.", "_showPromotions", Source.ChessBoard);
    }

    /**
     * Close promotion menu.
     */
    private _closePromotions(): void
    {
        let promotionOptions: NodeListOf<Element> = document.querySelectorAll(".promotion-option");
        for(let i = 0; i < 3; i++)
            promotionOptions[i].remove();

        Logger.save("Promotion screen closed.", "_closePromotions", Source.ChessBoard);

        /**
         * Enable the board. If the player choose a promotion piece then
         * allow player to interact with the board.
         */
        this.unlock();
        Logger.save("Board unlocked after promotion screen closed.", "_closePromotions", Source.ChessBoard);
    }

    /**
     * Get all squares on the board.
     */
    private getAllSquares(): NodeListOf<HTMLDivElement> {
        return document.querySelectorAll(".square");
    }

    /**
     * Get the square element by squareID(data-square-id)
     */
    private getSquareElement(squareID: Square): HTMLDivElement {
        return document.querySelector(`[data-square-id="${squareID.toString()}"]`) as HTMLDivElement;
    }

    /**
     * Get the squareID(data-square-id) by square element.
     */
    private getSquareID(squareElement: HTMLDivElement | Element): Square {
        return parseInt(squareElement.getAttribute("data-square-id")!) as Square;
    }

    /**
     * Set the squareID(data-square-id) to the square element.
     */
    private setSquareID(squareElement: HTMLDivElement | Element, squareID: Square): void {
        squareElement.setAttribute("data-square-id", squareID.toString());
    }

    /**
     * Get the click mode of the given square element or id(squareID).
     */
    private getSquareClickMode(square: Square | HTMLDivElement | Element): SquareClickMode {
      if (typeof square === "number")
        square = this.getSquareElement(square);
      return square.getAttribute("data-click-mode") as SquareClickMode;
    }

    /**
     * This function sets the click mode of the given square element or id(squareID).
     */
    private setSquareClickMode(square: Square|HTMLDivElement|Element, mode:SquareClickMode): void
    {
        if(document.querySelector(".result-message"))
            return;

        if(typeof square === "number")
            square = this.getSquareElement(square);
        square.setAttribute("data-click-mode", mode);
    }

    /**
     * This function sets the effect of the given square element or id(squareID).
     */
    private setSquareEffect(square: Square|HTMLDivElement|Element, effect: SquareEffect): void {
        if(typeof square === "number")
            square = this.getSquareElement(square);
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
        if(typeof square === "number")
          square = this.getSquareElement(square);

        if(effect == null)
            square.className = square.className.replace(/square-effect--\w+/g, "");
        else{
            if(!Array.isArray(effect))
                effect = [effect];

            for(let e of effect)
                square.className = square.className.replace(`square-effect--${e}`, "");
        }
    }

    /**
     * Find and remove the given effects from all squares.
     */
    private removeEffectFromAllSquares(effects: Array<SquareEffect>): void {
        let squares: NodeListOf<Element> = this.getAllSquares();
        for(let i = 0; i <= 63; i++)
            this.removeSquareEffect(squares[i], effects);
    }

    /**
     * This function plays the given sound.
     */
    private playSound(name: SoundEffect): void
    {
        this.sounds[name].play().then();
    }

    /**
     * This function returns the logs of the game on engine.
     */
    public getLogs(): Array<{source: string, message: string}>
    {
        return Logger.get();
    }
}
