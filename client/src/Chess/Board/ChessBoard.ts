/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/logic).
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { CastlingSide, Color, GameStatus, JsonNotation, Moves, MoveType, PieceType, Square, StartPosition } from "../Types";
import { SoundEffect, SquareClickMode, SquareEffect } from "./Types";
import { Converter } from "../Utils/Converter.ts";
import { Logger } from "@Services/Logger.ts";

export const PIECE_ANIMATION_DURATION: number = 0.15; // seconds
export const PIECE_ANIMATION_DURATION_MS: number = PIECE_ANIMATION_DURATION * 1000; // milliseconds

/**
 * This class provides users to create and manage a chess board(does not include any mechanic/logic).
 */
export class ChessBoard {

    private readonly sounds: { [key in SoundEffect]: string } = {
        Start: "./assets/sounds/game-start.mp3",
        Move: "./assets/sounds/move.mp3",
        Capture: "./assets/sounds/capture.mp3",
        Castle: "./assets/sounds/castle.mp3",
        Check: "./assets/sounds/move-check.mp3",
        Promote: "./assets/sounds/promote.mp3",
        LowTime: "./assets/sounds/low-time.mp3",
        End: "./assets/sounds/game-end.mp3",
    };

    private turnColor: Color.White | Color.Black = Color.White;
    private _isMouseUpEventBound: boolean = false;
    private _disabledPreSelectionColor: Color | null = null;
    private _lockedSquaresModes: Record<string, SquareClickMode> = {};
    private _isBoardMoveEventBound: boolean = false;

    private readonly _bindDragPiece: (e: MouseEvent) => void = this.dragPiece.bind(this);
    public readonly logger: Logger = new Logger("src/Chess/Board/ChessBoard.ts");

    /**
     * Constructor of the class which load css file of
     * the chess board.
     */
    constructor() {
        this._loadCSS();
    }

    /**
     * This function loads the css file of the chess board.
     */
    private _loadCSS(): void {
        if (document.getElementById("chessboard-css"))
            return;

        let link: HTMLLinkElement = document.createElement("link");
        link.id = "chessboard-css";
        link.rel = "stylesheet";
        link.href = './css/chessboard.css';
        document.head.appendChild(link);
    }

    /**
     * Set the properties of the chess board to the initial values.
     */
    private clearProperties(): void {
        this.turnColor = Color.White;
        this._lockedSquaresModes = {};
        this._isBoardMoveEventBound = false;
        this._disabledPreSelectionColor = null;
        this.logger.save("Properties of the board are cleared.");
    }

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     */
    public createGame(position: JsonNotation | StartPosition | string = StartPosition.Standard): void {
        this.clearProperties();

        this.createBoard();
        this.logger.save("Chessboard created.");

        this.createPieces(typeof position == "string" ? Converter.fenToJson(position).board : position.board);
        this.logger.save("Pieces created on ChessBoard.");

        this.playSound(SoundEffect.Start);
    }

    /**
     * This function creates the background of the chess board in #chessboard div
     */
    private createBoard(): void {
        let board: HTMLDivElement = document.getElementById("chessboard") as HTMLDivElement;
        board.innerHTML = "";

        for (let i = 1; i <= 64; i++) {
            let square: HTMLDivElement = document.createElement("div");
            this.setSquareId(square, i);
            square.className = "square";
            this.setSquareClickMode(square, SquareClickMode.Disable);

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
            if (i > 56 && i < 65)
                square.innerHTML += `<div class="column-coordinate">${String.fromCharCode(96 + (i % 8 || 8))}</div>`;

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
            if (i % 8 == 0)
                square.innerHTML += `<div class="row-coordinate">${9 - Math.floor(i / 8)}</div>`;

            board.appendChild(square);
        }
    }

    /**
     * This function creates the pieces on the chess board.
     */
    public createPieces(position: Array<{ color: Color, type: PieceType, square: Square }>): void {
        for (let piece of position)
            this.createPiece(piece.color, piece.type, piece.square);
    }

    /**
     * This function removes all pieces from the chess board.
     */
    public removePieces(): void {
        this.getAllPieces().forEach((piece) => piece.remove());
    }

    /**
     * This function creates a piece on the chess board.
     */
    public createPiece(color: Color, type: PieceType, square: Square, isPreview: boolean = false): void {
        this.removePiece(square);
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";
        piece.setAttribute("data-piece", type);
        piece.setAttribute("data-color", color);
        this.getSquareElement(square).appendChild(piece);
        if (!isPreview) {
            this.setSquareClickMode(
                this.getSquareElementOfPiece(piece),
                this.isLocked() ? SquareClickMode.Disable : SquareClickMode.PreSelect
            );
        } else {
            piece.classList.add("ghost");
        }
    }

    /**
     * This function removes the piece from the chess board if exists.
     */
    public removePiece(square: HTMLDivElement | HTMLElement | Element | Square): void {
        if (typeof square == "number")
            square = this.getSquareElement(square);
        const piece = square.querySelector(".piece");
        if(piece) piece.remove();
    }

    /**
     * Current player of the game.
     */
    public setTurnColor(color: Color.White | Color.Black): void {
        this.turnColor = color;
        this.getAllPieces().forEach((pieceElement) => {
            const square = this.getSquareElementOfPiece(pieceElement);
            const pieceColor = this.getPieceColor(square);
            if (!pieceElement.className.includes("promotion-option")) {
                if(pieceColor === this.turnColor && !this.isLocked())
                    this.setSquareClickMode(square, SquareClickMode.Select);
                else
                    this.setSquareClickMode(
                        square, 
                        this._disabledPreSelectionColor == pieceColor 
                            ? SquareClickMode.Disable 
                            : SquareClickMode.PreSelect
                    );
            }
        });
    }

    /**
     * Bind functions to the specific events of the chess board.
     */
    public bindMoveEventCallbacks(callbacks: {
        onPieceSelected: (squareId: Square) => void,
        onPiecePreSelected: (squareId: Square) => void,
        onPieceMoved: (squareId: Square, squareClickMode: SquareClickMode) => void,
        onPiecePreMoved: (squareId: Square, squareClickMode: SquareClickMode) => void,
        onPreMoveCanceled: () => void
    }): void {
        if (this._isBoardMoveEventBound) throw Error("Move event callbacks already bound.");
        this._isBoardMoveEventBound = true;

        let mouseUpTriggered: boolean = false;
        const squares = this.getAllSquares();
        squares.forEach(square => {
            square.addEventListener("mousedown", (e: MouseEvent) => {
                mouseUpTriggered = false;
                this.handleSquareDown(
                    e,
                    this.getClosestSquareElement(square)!,
                    callbacks.onPieceSelected!,
                    callbacks.onPiecePreSelected!,
                    callbacks.onPreMoveCanceled!
                );
            });
            square.addEventListener("click", () => {
                if (!mouseUpTriggered)
                    return this.handleSquareClick(
                        this.getClosestSquareElement(square)!,
                        callbacks.onPieceMoved,
                        callbacks.onPiecePreMoved
                    );
            });
        });

        if (!this._isMouseUpEventBound) {
            this._isMouseUpEventBound = true;
            document.addEventListener("mouseup", (e: MouseEvent) => {
                mouseUpTriggered = true;
                return this.handleMouseUp(
                    e,
                    callbacks.onPieceMoved,
                    callbacks.onPiecePreMoved
                );
            });
        }

        this.logger.save("Move event callbacks bound to the board.");
    }

    /**
     * This function handles the square down event on the chess board.
     */
    private handleSquareDown(
        mouseDownEvent: MouseEvent,
        square: HTMLElement,
        onPieceSelected: (squareId: Square) => void,
        onPiecePreSelected: (squareId: Square) => void,
        onPreMoveCanceled: () => void
    ): void {
        const squareClickMode = this.getSquareClickMode(square);
        if (squareClickMode == SquareClickMode.Clear) {
            this.refresh();
            onPreMoveCanceled();
            return;
        }

        this.stickPieceToCursor(mouseDownEvent, square);
        if ([SquareClickMode.PreSelected, SquareClickMode.Selected].includes(squareClickMode)) {
            this.setSquareClickMode(square, SquareClickMode.Clear);
            return;
        }

        const squareId = this.getSquareId(square);
        if ([SquareClickMode.PreSelect, SquareClickMode.Select].includes(squareClickMode)) {
            const isPreSelect = squareClickMode == SquareClickMode.PreSelect;

            if (isPreSelect) this.addSquareEffects(square, SquareEffect.PreSelected);
            else  this.removeEffectFromAllSquares([SquareEffect.PreSelected]);
            
            this.selectPiece(squareId, isPreSelect);
            
            if(isPreSelect) onPiecePreSelected(squareId);
            else onPieceSelected(squareId);
        }
    }

    /**
     * This function handles the square click event on the chess board.
     */
    private handleSquareClick(
        square: HTMLElement,
        onPieceMovedByClicking: (squareId: Square, squareClickMode: SquareClickMode) => void,
        onPiecePreMovedByClicking: (squareId: Square, squareClickMode: SquareClickMode) => void
    ): void {
        const squareClickMode = this.getSquareClickMode(square);

        if (![SquareClickMode.PreSelect,
        SquareClickMode.Select,
        SquareClickMode.PreSelected,
        SquareClickMode.Selected,
        SquareClickMode.Clear,
        SquareClickMode.Disable,
        ].includes(squareClickMode)) {
            const squareId = this.getSquareId(square);
            if (squareClickMode.startsWith("Pre")) {
                this.highlightPreMove(squareId, squareClickMode);
                onPiecePreMovedByClicking!(squareId, squareClickMode);
            } else {
                onPieceMovedByClicking!(squareId, squareClickMode);
            }
        }
    }

    /**
     * This function handles the mouse up event on the chess board.
     */
    private handleMouseUp(
        mouseUpEvent: MouseEvent,
        onPieceMovedByDragging: (squareId: Square, squareClickMode: SquareClickMode) => void,
        onPiecePreMovedByDragging: (squareId: Square, squareClickMode: SquareClickMode) => void
    ): void {
        if (document.querySelector(".piece.cloned"))
            this.dropPiece(mouseUpEvent);

        let targetSquare = document.elementFromPoint(
            mouseUpEvent.clientX,
            mouseUpEvent.clientY
        );
        if (targetSquare && targetSquare.closest("#chessboard")) {
            targetSquare = this.getClosestSquareElement(targetSquare as HTMLElement) as HTMLElement;
            if (targetSquare) {
                const targetSquareClickMode = this.getSquareClickMode(targetSquare);
                const targetSquareEffects = this.getSquareEffects(targetSquare);

                if (targetSquareClickMode == SquareClickMode.Clear
                    && (targetSquareEffects.includes(SquareEffect.Selected)
                        || targetSquareEffects.includes(SquareEffect.PreSelected)))
                    this.refresh();

                if (![SquareClickMode.PreSelect,
                SquareClickMode.Select,
                SquareClickMode.PreSelected,
                SquareClickMode.Selected,
                SquareClickMode.Clear,
                SquareClickMode.Disable,
                ].includes(targetSquareClickMode)) {
                    const targetSquareId = this.getSquareId(targetSquare);
                    if (targetSquareClickMode.startsWith("Pre")) {
                        this.highlightPreMove(targetSquareId, targetSquareClickMode);
                        onPiecePreMovedByDragging!(targetSquareId, targetSquareClickMode);
                    } else {
                        onPieceMovedByDragging!(targetSquareId, targetSquareClickMode);
                    }
                }
            }
        }
    }

    /**
     * This function selects the square on the chess board.
     */
    public selectPiece(squareID: Square, preSelect: boolean = false): void {
        this.refresh(true);
        const selectedSquare = this.getSquareElement(squareID);
        this.setSquareClickMode(selectedSquare, preSelect ? SquareClickMode.PreSelected : SquareClickMode.Selected);
        this.addSquareEffects(selectedSquare, preSelect ? SquareEffect.PreSelected : SquareEffect.Selected);
        this.logger.save(`Square[${squareID}] selected on board.`);
    }

    /**
     * Stick the piece to the cursor when the user clicks on the piece.
     */
    private stickPieceToCursor(downEvent: MouseEvent, square: HTMLElement): void {
        if (this.getSquareClickMode(square) == SquareClickMode.Disable) return;

        const originalPiece = square.querySelector(".piece") as HTMLElement;
        if (!originalPiece || originalPiece.className.includes("promotion-option")) return;
        if (document.querySelector(".piece.cloned")) return;

        const clonedPiece = originalPiece.cloneNode(true) as HTMLElement;
        originalPiece.classList.add("dragging");
        clonedPiece.classList.add("cloned");
        document.body.appendChild(clonedPiece);
        clonedPiece.style.position = "absolute";
        clonedPiece.style.top = `calc(${downEvent.clientY + window.scrollY}px - ${clonedPiece.offsetHeight / 2}px)`;
        clonedPiece.style.left = `calc(${downEvent.clientX + window.scrollX}px - ${clonedPiece.offsetWidth / 2}px)`;

        document.removeEventListener("mousemove", this._bindDragPiece);
        document.addEventListener("mousemove", this._bindDragPiece);
    }

    /**
     * Drag the cloned piece with the cursor.
     */
    private dragPiece(moveEvent: MouseEvent): void {
        const clonedPiece = document.querySelector(".piece.cloned") as HTMLElement;
        if (!clonedPiece) return;
        clonedPiece.style.top = `calc(${moveEvent.clientY + window.scrollY}px - ${clonedPiece.offsetHeight / 2}px)`;
        clonedPiece.style.left = `calc(${moveEvent.clientX + window.scrollX}px - ${clonedPiece.offsetWidth / 2}px)`;

        // Highlight the square where the cursor is.
        /*this.removeSquareEffect(document.querySelector(`[class*="${SquareEffect.Hovering}"]`)!, SquareEffect.Hovering);
        const elements = document.elementsFromPoint(moveEvent.clientX, moveEvent.clientY);
        const square = elements.length > 2 ? elements[1] : null;
        if(square && square.className.includes('square') && this.getSquareClickMode(square) == SquareClickMode.Play)
            this.addSquareEffects(square, SquareEffect.Hovering);*/
    }

    /**
     * Drop the piece to the square where the cursor is.
     */
    private dropPiece(upEvent: MouseEvent): void {
        const originalPiece = document.querySelector(".piece.dragging") as HTMLElement;
        const clonedPiece = document.querySelector(".piece.cloned") as HTMLElement;
        if (clonedPiece) {
            clonedPiece.remove();

            let targetSquare: Element | null = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
            if (targetSquare) {
                targetSquare = this.getClosestSquareElement(targetSquare as HTMLElement) as HTMLElement;
                if (!targetSquare) return;

                if (targetSquare.className.includes("piece"))
                    targetSquare = this.getSquareElementOfPiece(targetSquare);

                if (targetSquare && targetSquare.className.includes("square")) {
                    const targetSquareClickMode = this.getSquareClickMode(targetSquare);
                    if ([SquareClickMode.Play, 
                        SquareClickMode.Promotion, 
                        SquareClickMode.PrePlay, 
                        SquareClickMode.PrePromotion
                    ].includes(targetSquareClickMode)) {
                        const isPreMove = targetSquareClickMode.startsWith("Pre");
                        const targetPiece = targetSquare.querySelector(".piece");
                        if (targetPiece && !isPreMove) {
                            targetSquare.removeChild(targetPiece);
                            this.playSound(SoundEffect.Capture);
                        } 
                        
                        if(!isPreMove) {
                            targetSquare.appendChild(originalPiece);
                        } else if(!targetPiece) {
                            this.createPiece(
                                this.getPieceColor(originalPiece), 
                                this.getPieceType(originalPiece), 
                                this.getSquareId(targetSquare),
                                true
                            );
                        }

                        if (!targetPiece && !isPreMove) 
                            this.playSound(SoundEffect.Move);
                    }
                }
            }
        }

        if (originalPiece) originalPiece.classList.remove("dragging");
        document.removeEventListener("mousemove", this._bindDragPiece);
    }

    /**
     * Highlight the pre move that player wants to play 
     * on the chess board.
     */
    public highlightPreMove(squareId: Square, preMoveType: SquareClickMode | null = null): void {
        this.removeEffectFromAllSquares([SquareEffect.PrePlayable, SquareEffect.PreKillable]);
        this.addSquareEffects(squareId, SquareEffect.PrePlayed);
        if(preMoveType === SquareClickMode.PrePromote){
            this.removePiece(squareId);
            const { color, type, square } = this._findPromotedOptionBySquare(squareId);
            this.createPiece(color, type, square, true);
        }
        this.refresh(true);
    }

    /**
     * This function shows the possible moves of the selected or pre selected 
     * piece on the chess board.
     */
    public highlightMoves(moves: Moves | null = null, isPreMove: boolean = false): void {
        if (moves == null)
            return;

        const selectedSquare = this.getSelectedSquareElement();
        if (!selectedSquare) return;

        const squareModeMoveTypeMap: Partial<Record<MoveType, SquareClickMode>> = {
            [MoveType.Normal]: isPreMove ? SquareClickMode.PrePlay : SquareClickMode.Play,
            [MoveType.Castling]: isPreMove ? SquareClickMode.PreCastling : SquareClickMode.Castling,
            [MoveType.EnPassant]: isPreMove ? SquareClickMode.PreEnPassant : SquareClickMode.EnPassant,
            [MoveType.Promotion]: isPreMove ? SquareClickMode.PrePromotion : SquareClickMode.Promotion
        };

        for (let moveType in moves) {
            if (!moves[moveType as MoveType])
                continue;

            for (let move of moves[moveType as MoveType]!) {
                const square = this.getSquareElement(move);
                const squareContent = square.querySelector(".piece");
                this.addSquareEffects(
                    move,
                    squareContent
                        ? (isPreMove ? SquareEffect.PreKillable : SquareEffect.Killable)
                        : (isPreMove ? SquareEffect.PrePlayable : SquareEffect.Playable)
                );

                this.setSquareClickMode(move, squareModeMoveTypeMap[moveType as MoveType]!);
            }
        }

        this.logger.save(`Possible moves[${JSON.stringify(moves)}] highlighted on board.`);
    }

    /**
     * This function moves the piece from the given square to the given square on the chess board.
     * @param {MoveType|null} moveType - If it is not given the function will determine the 
     * move type by checking the square click mode of the target square(`to`). Mostly, this 
     * parameter is used by the bot/system/server etc.
     */
    public async playMove(from: Square, to: Square, moveType: MoveType | null = null): Promise<void> {
        this.removeEffectFromAllSquares();
        this.logger.save(`From[${from}], To[${to}] and Checked Square's(if exits) effects are cleaned.`);
        const fromSquare: HTMLDivElement = this.getSquareElement(from);
        const toSquare: HTMLDivElement = this.getSquareElement(to);
        this.addSquareEffects(fromSquare, SquareEffect.From);
        this.addSquareEffects(toSquare, SquareEffect.To);
        this.logger.save(`Moved From and Moved To effects given the From[${from}] and To[${from}] squares.`);

        const finalMoveType: MoveType | SquareClickMode = moveType ?? this.getSquareClickMode(toSquare);
        switch (finalMoveType) {
            case SquareClickMode.Castling:
                this._doCastling(fromSquare, toSquare);
                break;
            case SquareClickMode.EnPassant:
                this._doEnPassant(fromSquare, toSquare);
                break;
            case SquareClickMode.Promotion:
                this._doPromotion(fromSquare, toSquare, moveType === null);
                break;
            case SquareClickMode.Promote:
                this._doPromote(toSquare);
                break;
            default:
                await this._doNormalMove(fromSquare, toSquare);
                break;
        }
    }

    /**
     * Do the normal move(move piece to another square) with animation on the chess board.
     */
    private async _doNormalMove(fromSquare: HTMLDivElement, toSquare: HTMLDivElement, playMoveSound: boolean = true): Promise<void> {
        const piece: HTMLDivElement = fromSquare.querySelector(".piece") as HTMLDivElement;
        if (!piece) return;
        await this._animatePieceToSquare(piece, toSquare, playMoveSound)
        this.logger.save(`Piece moved to target square[${this.getSquareId(toSquare)}] on board`);
    }

    /**
     * Move the piece to the square with animation.
     */
    private _animatePieceToSquare(piece: HTMLElement, square: HTMLElement, playMoveSound: boolean = true): Promise<void> {
        return new Promise((resolve) => {
            const toSquareContent = square.querySelector(`.piece`);
            // FIXME: .piece[data-color="${this.getPieceColor(piece) === Color.White ? Color.Black : Color.White}"]

            if (toSquareContent && this.getPieceColor(toSquareContent) !== this.getPieceColor(piece)) {
                // This is the case when the player captures 
                // the opponent's piece by drag and drop.
                if (!piece) this.removePiece(this.getSquareElementOfPiece(toSquareContent));
                if (playMoveSound) this.playSound(SoundEffect.Capture);
            } else if (playMoveSound) {
                this.playSound(SoundEffect.Move);
            }

            if (!piece) return;
            this.logger.save(`Target square[${this.getSquareId(square)}] cleared`);

            const pieceSquare = this.getSquareElementOfPiece(piece);
            const pieceRect = piece.getBoundingClientRect();
            const marginLeft = Math.abs(pieceSquare.getBoundingClientRect().left - pieceRect.left);
            const marginTop = Math.abs(pieceSquare.getBoundingClientRect().top - pieceRect.top);

            document.body.appendChild(piece);
            piece.style.top = `${pieceRect.top + window.scrollY}px`;
            piece.style.left = `${pieceRect.left + window.scrollX}px`;
            piece.style.animation = `move ${PIECE_ANIMATION_DURATION}s ease-in-out forwards`;
            piece.style.setProperty("--chessboard-move-from-left", `${pieceRect.left + window.scrollX}px`);
            piece.style.setProperty("--chessboard-move-from-top", `${pieceRect.top + window.scrollY}px`);
            piece.style.setProperty("--chessboard-move-to-left", `calc(${marginLeft}px + ${square.getBoundingClientRect().left + window.scrollX}px)`);
            piece.style.setProperty("--chessboard-move-to-top", `calc(${marginTop}px + ${square.getBoundingClientRect().top + window.scrollY}px)`);

            piece.addEventListener("animationend", () => {
                if (toSquareContent) this.removePiece(this.getSquareElementOfPiece(toSquareContent));
                square.appendChild(piece);
                piece.style.animation = "";
                piece.style.top = "";
                piece.style.left = "";
                resolve();
            });
        });
    }

    /**
     * Do the castling move on the chess board.
     */
    private _doCastling(fromSquare: HTMLDivElement, toSquare: HTMLDivElement): void {
        let fromSquareId: number = this.getSquareId(fromSquare)
        let toSquareId: number = this.getSquareId(toSquare);

        /**
         * Get the castling type by measuring the distance between
         * the fromSquare(king) and toSquare(rook). If the distance
         * is greater than 3 then it is a long castling otherwise
         * it is a short castling.
         *
         * @see For more information about castling, see https://en.wikipedia.org/wiki/Castling
         * @see For more information about square ids, see src/Chess/Types/index.ts
         */
        const castlingSide: CastlingSide = fromSquareId > toSquareId ? CastlingSide.Long : CastlingSide.Short;
        this.logger.save(`Castling type determined[${castlingSide}] on board`);

        // Find the target rook square if it is clicked two square left or right of the king
        // instead of the rook square itself.
        const getColumn = (squareId: number): number => squareId % 8 === 0 ? 8 : squareId % 8;
        if(castlingSide == CastlingSide.Long && getColumn(toSquareId) !== 1)
            toSquareId = toSquareId - 2 as Square;
        else if(castlingSide == CastlingSide.Short && getColumn(toSquareId) !== 8)
            toSquareId = toSquareId + 1 as Square;

        /**
         * If the castling is long then the king's new square is
         * 2 squares left of the fromSquare otherwise 2 squares
         * right of the fromSquare.
         */
        const kingNewSquare: number = castlingSide == CastlingSide.Long ? fromSquareId - 2 : fromSquareId + 2;
        this._doNormalMove(fromSquare, this.getSquareElement(kingNewSquare));
        this.logger.save(`King moved to target square[${kingNewSquare}] by determined castling type[${castlingSide}] on board`);

        /**
         * If the castling is long and the king's current square
         * is "e1"(61) then the rook's current square is "a1"(57) and rook's
         * new square is "d1"(60).
         */
        const rook: number = castlingSide == CastlingSide.Long ? fromSquareId - 4 : fromSquareId + 3;
        const rookNewSquare: number = castlingSide == CastlingSide.Long ? kingNewSquare + 1 : kingNewSquare - 1;
        this._doNormalMove(
            this.getSquareElement(rook),
            this.getSquareElement(rookNewSquare),
            false
        );
        this.playSound(SoundEffect.Castle);
        this.logger.save(`Rook moved to target square[${rookNewSquare}] by determined castling type[${castlingSide}] on board`);
    }

    /**
     * Do the en passant move on the chess board.
     */
    private _doEnPassant(fromSquare: HTMLDivElement, toSquare: HTMLDivElement): void {
        this._doNormalMove(fromSquare, toSquare);
        this.logger.save(`Piece moved to target square[${this.getSquareId(toSquare)}] on board`);

        /**
         * Get the square of the killed piece by adding 8 to
         * the target square. If toSquare is in the 3rd row
         * then toSquare has white pawn add 8 otherwise toSquare
         * has black pawn subtract 8.
         * @see For more information about en passant, see https://en.wikipedia.org/wiki/En_passant
         * @see For more information about the square ids, see src/Chess/Types/index.ts
         */
        const toSquareID = this.getSquareId(toSquare)
        const killedPieceSquare = toSquareID + (Math.ceil(toSquareID / 8) == 3 ? 8 : -8);
        this.removePiece(killedPieceSquare);
        this.playSound(SoundEffect.Capture);
        this.logger.save(`Captured piece by en passant move is found on square[${killedPieceSquare}] and removed on board`);
    }

    /**
     * Do the promotion move on the chess board.
     */
    private _doPromotion(fromSquare: HTMLDivElement, toSquare: HTMLDivElement, showPromotionMenu: boolean = true): void {
        //this._doNormalMove(fromSquare, toSquare)
        this.removePiece(fromSquare);
        this.logger.save(`Piece moved to target square[${this.getSquareId(toSquare)}] on board`);
        if(showPromotionMenu) this.showPromotionMenu(toSquare);
    }

    /**
     * Do the promote move on the chess board.
     */
    private _doPromote(selectedSquare: HTMLDivElement): void {
        const { color, type, square } = this._findPromotedOptionBySquare(selectedSquare);

        this.createPiece(color, type, square);
        this.playSound(SoundEffect.Promote);
        this.closePromotionMenu();

        // Set the square effect of the promoted square on the last row.
        this.addSquareEffects(square, SquareEffect.To);
        this.logger.save(`Player's[${color}] Piece[${type}] created on square[${square}] on board`);
    }

    /**
     * This function determines the promoted option by clicked square id.
     * Example: Promoted pawn is white and on the "a8" square. Promotion options are
     * queen(on a8), rook(on b8), bishop(on c8), knight(on d8). If the player selects
     * other than queen the piece must be created not on the clicked square(if the player
     * selects rook the selected square will be "b8" not "a8"). So, we need to find the
     * first square of row to create piece on the "a8" square.
     */
    private _findPromotedOptionBySquare(promoteSquare: HTMLElement | Square): { color: Color, type: PieceType, square: number} {
        const squareId = promoteSquare instanceof HTMLElement ? this.getSquareId(promoteSquare) : promoteSquare;
        const color = squareId < 33 ? Color.White : Color.Black;
        let firstSquareOfRow: string | Square = Converter.squareIDToSquare(squareId);
        firstSquareOfRow = Converter.squareToSquareID(
            firstSquareOfRow.replace(firstSquareOfRow.slice(-1), (color == Color.White ? "8" : "1"))
        );
        
        let pieceType: PieceType;
        const getRow = (squareId: number): number => Math.ceil(squareId / 8);
        switch(getRow(squareId)) {
            case 1:
            case 8:
                pieceType = PieceType.Queen;
                break;
            case 2:
            case 7:
                pieceType = PieceType.Rook;
                break;
            case 3:
            case 6:
                pieceType = PieceType.Bishop;
                break;
            case 4:
            case 5:
                pieceType = PieceType.Knight;
                break;
            default:
                throw Error("Promotion type is not found. There was an error while promoting the piece on the board.");
        }

        return { color, type: pieceType, square: firstSquareOfRow };
    }

    /**
     * This function removes the effects from board.
     */
    public refresh(savePreMoveEffects: boolean = false): void {
        const squares: NodeListOf<Element> = this.getAllSquares();
        const isFlipped = this.isFlipped();
        const loopRange = isFlipped ? [63, -1, -1] : [0, 64, 1];
        for (let i = loopRange[0]; i != loopRange[1]; i += loopRange[2]) {
            if (![SquareClickMode.Select,
                SquareClickMode.PreSelect
            ].includes(this.getSquareClickMode(squares[i]))) {
                this.setSquareClickMode(squares[i], SquareClickMode.Clear);
            }

            this.removeSquareEffect(squares[i], [
                SquareEffect.Playable,
                SquareEffect.PrePlayable,
                SquareEffect.Killable,
                SquareEffect.PreKillable,
                SquareEffect.Selected,
            ].concat(savePreMoveEffects ? [] : [
                SquareEffect.PrePlayed,
                SquareEffect.PreKilled,
                SquareEffect.PreSelected,
            ]));

            if (!savePreMoveEffects) {
                const piece = this.getPieceElementOnSquare(squares[i]);
                if(piece && piece.className.includes("ghost"))
                    piece.remove();
            }

            /**
             * If the square id is not equal to i + forInc[2] then set the square id to i + forInc[2].
             * This scenario can happen when the player change square is id in DOM with devtools.
             * So, we need to fix the square id's.
             */
            const currentId = this.getSquareId(squares[Math.abs(loopRange[0] - i)]);
            if (currentId !== i + Math.abs(loopRange[2])) {
                const newCorrectId = i + loopRange[2];
                this.setSquareId(squares[i], newCorrectId);
                this.logger.save(`ID of square's fixed from[${currentId}] to [${newCorrectId}] on board`);
            }
        }
        this.setTurnColor(this.turnColor);
        this.logger.save("Board refreshed. Playable, Killable, Selected effects removed.");
    }

    /**
     * This function checks if the board is flipped or not.
     */
    private isFlipped(): boolean {
        return this.getAllSquares()[56].querySelector(".column-coordinate")!.textContent == "h";
    }

    /**
     * Flips the board without changing the square ids.
     */
    public flip(): void {
        // Changes pieces
        for (let id = 64; id >= 33; id--) {
            const normalSquare = this.getSquareElement(id);
            const flippedSquare = this.getSquareElement(65 - id);

            const normalSquarePiece = normalSquare.querySelector(".piece");
            const flippedSquarePiece = flippedSquare.querySelector(".piece");
            if (normalSquarePiece) flippedSquare.appendChild(normalSquarePiece);
            if (flippedSquarePiece) normalSquare.appendChild(flippedSquarePiece);

            this.setSquareId(normalSquare, 65 - id);
            this.setSquareId(flippedSquare, id);

            const normalSquareClickMode = this.getSquareClickMode(normalSquare);
            const flippedSquareClickMode = this.getSquareClickMode(flippedSquare);
            this.setSquareClickMode(normalSquare, flippedSquareClickMode);
            this.setSquareClickMode(flippedSquare, normalSquareClickMode);

            const normalSquareEffect = this.getSquareEffects(normalSquare);
            const flippedSquareEffect = this.getSquareEffects(flippedSquare);
            this.removeSquareEffect(normalSquare, normalSquareEffect);
            this.removeSquareEffect(flippedSquare, flippedSquareEffect);
            this.addSquareEffects(normalSquare, flippedSquareEffect);
            this.addSquareEffects(flippedSquare, normalSquareEffect);
        }

        // Flip coordinates of rows and columns
        const squares: NodeListOf<Element> = this.getAllSquares();
        for (let i = 8; i >= 1; i--) {
            const rowSquare = squares[(8 * i) - 1].querySelector(" .row-coordinate");
            rowSquare!.textContent = String(9 - parseInt(rowSquare!.textContent as string));
        }

        const isFlipped = this.isFlipped();
        for (let i = 1; i <= 8; i++) {
            const columnSquare = squares[(56 + i) - 1].querySelector(" .column-coordinate");
            columnSquare!.textContent = String.fromCharCode(isFlipped ? 96 + i : 105 - i);
        }
    }

    /**
     * Lock board interactions.
     */
    public lock(disablePreSelection: boolean = true, showDisabledEffect: boolean = false): void {
        if(this.isLocked()) 
            return;

        this.getAllSquares().forEach(square => {
            const squareClickMode = this.getSquareClickMode(square);
            this._lockedSquaresModes[this.getSquareId(square)] = squareClickMode
            
            if (showDisabledEffect)
                this.addSquareEffects(square, SquareEffect.Disabled);

            if (!disablePreSelection) {
                if (this.getPieceElementOnSquare(square)
                    && this.getPieceColor(square) !== this._disabledPreSelectionColor)
                    return;
            } 
            
            this.setSquareClickMode(square, !disablePreSelection ? SquareClickMode.Clear : SquareClickMode.Disable);
        });
    }

    /**
     * Enable board interactions.
     */
    public unlock(): void {
        if (!this.isLocked()) 
            return;
        
        this.getAllSquares().forEach(square => {
            this.setSquareClickMode(square, this._lockedSquaresModes[this.getSquareId(square)]);
            this.removeSquareEffect(square, SquareEffect.Disabled);
        });
        this._lockedSquaresModes = {};
    }

    /**
     * Is board locked?
     */
    public isLocked(): boolean {
        return Object.values(this._lockedSquaresModes).length > 0;
    }

    /**
     * Show status of game on the board.
     */
    public showStatus(status: GameStatus): void {
        if (status == GameStatus.WhiteInCheck || status == GameStatus.BlackInCheck) {
            const checkedColor: Color = status == GameStatus.WhiteInCheck ? Color.White : Color.Black;
            const checkedKingSquare = this.getSquareElementOfPiece(document.querySelector(
                `.piece[data-piece="${PieceType.King}"][data-color="${checkedColor}"]`
            )!);
            this.addSquareEffects(checkedKingSquare as HTMLDivElement, SquareEffect.Checked);
            this.playSound(SoundEffect.Check);
            this.logger.save(`King's square[${this.getSquareId(checkedKingSquare)}] found on DOM and Checked effect added`);
        }
        else if (status == GameStatus.WhiteVictory || status == GameStatus.BlackVictory || status == GameStatus.Draw) {
            this.lock();
            let winnerSquares: HTMLElement[] = [];
            if (status === GameStatus.Draw) {
                winnerSquares.push(this.getSquareElementOfPiece(document.querySelector(
                    `[data-color="${Color.White}"][data-piece="${PieceType.King}"]`
                )!)!);
                winnerSquares.push(this.getSquareElementOfPiece(document.querySelector(
                    `[data-color="${Color.Black}"][data-piece="${PieceType.King}"]`
                )!));
            }
            else {
                winnerSquares.push(this.getSquareElementOfPiece(document.querySelector(
                    `[data-color="${status == GameStatus.WhiteVictory
                        ? Color.White
                        : Color.Black
                    }"][data-piece="${PieceType.King}"]`
                )!)!);
            }
            winnerSquares.forEach(winnerKingSquare => {
                this.addSquareEffects(winnerKingSquare, SquareEffect.Winner);
            });
            this.playSound(SoundEffect.End);
            this.logger.save("Game ended. Board locked.");
        }
    }

    /**
     * Lock the board and show the promotion menu.
     */
    public showPromotionMenu(promotionSquare: HTMLElement | Square): void {
        const square: Square = (promotionSquare instanceof HTMLElement) 
            ? this.getSquareId(promotionSquare) 
            : promotionSquare;
        
        const promoteColor = square < 9 ? Color.White : Color.Black;
        const isPrePromotion = promoteColor !== this.turnColor;

        if (!isPrePromotion) {
            this.removePiece(promotionSquare);
            this.logger.save(`Promoted Pawn is removed from square[${square}] on board`);
        }

        /**
         * Disable the board. We don't want to allow player to
         * move pieces while choosing promotion piece.
         */
        this.lock(!isPrePromotion, true);
        this.logger.save("Board locked for promotion screen");

        const PROMOTION_TYPES: Array<string> = [PieceType.Queen, PieceType.Rook, PieceType.Bishop, PieceType.Knight];
        for (let i = 0; i < 4; i++) {
            let promotionOption: HTMLDivElement = document.createElement("div");
            promotionOption.className = "piece";
            promotionOption.className += " promotion-option";
            promotionOption.setAttribute("data-piece", PROMOTION_TYPES[i]);
            promotionOption.setAttribute("data-color", promoteColor);

            /**
             * Set position.
             * Promotion options are placed in the same column as the promoted pawn.
             * Example for white: square = 1, first promotion option(queen) is 1 + 8 = 9, second promotion option(rook) is 1 + 8 + 8 = 17, etc.
             * Example for black: square = 57, first promotion option(queen) is 57 - 8 = 49, second promotion option(rook) is 57 - 8 - 8 = 41, etc.
             */
            let targetSquare: HTMLDivElement = this.getSquareElement(square < 9 ? square + (i * 8) : square - (i * 8));
            targetSquare.appendChild(promotionOption);

            this.removeSquareEffect(targetSquare, SquareEffect.Disabled);
            this.setSquareClickMode(targetSquare, isPrePromotion ? SquareClickMode.PrePromote : SquareClickMode.Promote);
        }
        this.logger.save("Promotion screen showed on board.");
    }

    /**
     * Close the promotion menu and unlock the board.
     */
    public closePromotionMenu(): void {
        let promotionOptions: NodeListOf<Element> = document.querySelectorAll(".promotion-option");
        if(promotionOptions.length === 0) 
            return;

        promotionOptions.forEach(promotionOption => {
            promotionOption.remove();
        });

        this.logger.save("Promotion screen closed.");

        /**
         * Enable the board. If the player choose a promotion piece then
         * allow player to interact with the board.
         */
        this.unlock();
        this.logger.save("Board unlocked after promotion screen closed.");
    }

    /**
     * Disable the preselection of the given color pieces.
     */
    public disablePreSelection(color: Color): void {
        this._disabledPreSelectionColor = color;
        this.setTurnColor(this.turnColor);
    }

    /**
     * Get all squares on the board.
     */
    public getAllSquares(): NodeListOf<HTMLDivElement> {
        return document.querySelectorAll("#chessboard .square");
    }

    /**
     * Get all pieces on the board.
     */
    public getAllPieces(): NodeListOf<HTMLDivElement> {
        return document.querySelectorAll("#chessboard .piece");
    }

    /**
     * Get the closest square element of the given element.
     * If the given element is already a square element 
     * then return itself.
     */
    public getClosestSquareElement(element: HTMLElement): HTMLElement | null {
        return element.getAttribute("data-square-id") ? element : element.closest("[data-square-id]");
    }

    /**
     * Get the square element by squareID(data-square-id)
     */
    public getSquareElement(squareID: Square): HTMLDivElement {
        return document.querySelector(`[data-square-id="${squareID.toString()}"]`) as HTMLDivElement;
    }

    /**
     * Get the piece element on the square.
     */
    public getPieceElementOnSquare(squareElement: HTMLDivElement | Element | Square): HTMLDivElement {
        if (typeof squareElement == "number")
            squareElement = this.getSquareElement(squareElement);

        return (squareElement.className.includes("piece")
            ? squareElement
            : squareElement.querySelector(".piece")
        ) as HTMLDivElement;
    }

    /**
     * Get the selected or preselected piece element on the board.
     */
    public getSelectedSquareElement(): HTMLDivElement | null {
        return (document.querySelector(`.square[data-click-mode="${SquareClickMode.Selected}"]`) as HTMLDivElement)
            || (document.querySelector(`.square[data-click-mode="${SquareClickMode.PreSelected}"]`) as HTMLDivElement);
    }

    /**
     * Get the color of the piece by square element or piece itself.
     */
    public getPieceColor(squareOrPieceElement: HTMLDivElement | Element | Square): Color {
        if (typeof squareOrPieceElement === "number")
            squareOrPieceElement = this.getSquareElement(squareOrPieceElement);
        else if (squareOrPieceElement.className.includes("square"))
            squareOrPieceElement = this.getPieceElementOnSquare(squareOrPieceElement);

        return squareOrPieceElement.getAttribute("data-color") as Color;
    }

    /**
     * Get the type of the piece by square element or piece itself.
     */
    public getPieceType(squareOrPieceElement: HTMLDivElement | Element | Square): PieceType {
        if (typeof squareOrPieceElement === "number")
            squareOrPieceElement = this.getSquareElement(squareOrPieceElement);
        else if (squareOrPieceElement.className.includes("square"))
            squareOrPieceElement = this.getPieceElementOnSquare(squareOrPieceElement);

        return squareOrPieceElement.getAttribute("data-piece") as PieceType;
    }

    /**
     * Get the square element of given piece element.
     */
    public getSquareElementOfPiece(pieceElement: HTMLDivElement | Element): HTMLDivElement {
        return pieceElement.parentElement! as HTMLDivElement;
    }

    /**
     * Get the squareID(data-square-id) by square element.
     */
    public getSquareId(squareElement: HTMLDivElement | Element): Square {
        return parseInt(squareElement.getAttribute("data-square-id")!) as Square;
    }

    /**
     * Set the squareID(data-square-id) to the square element.
     */
    private setSquareId(squareElement: HTMLDivElement | Element, squareID: Square): void {
        squareElement.setAttribute("data-square-id", squareID.toString());
    }

    /**
     * Get the click mode of the given square element or id(squareID).
     */
    public getSquareClickMode(square: Square | HTMLDivElement | Element): SquareClickMode {
        if (typeof square === "number")
            square = this.getSquareElement(square);
        return square.getAttribute("data-click-mode") as SquareClickMode;
    }

    /**
     * Get the effect of the given square element or id(squareID).
     */
    public getSquareEffects(square: Square | HTMLDivElement | Element): SquareEffect[] {
        if (typeof square === "number")
            square = this.getSquareElement(square);

        const squareEffect = square.querySelector(".square-effect") as HTMLDivElement;
        if (!squareEffect) return [];

        const matches = squareEffect.className.match(/square-effect--(\w+)/g) || [];
        const effects: SquareEffect[] = [];

        matches.forEach((match) => {
            effects.push(match.split('--')[1] as SquareEffect);
        });

        return effects;
    }

    /**
     * This function sets the click mode of the given square element or id(squareID).
     */
    public setSquareClickMode(square: Square | HTMLDivElement | Element, mode: SquareClickMode): void {
        if (document.querySelector(".result-message"))
            return;

        if (typeof square === "number")
            square = this.getSquareElement(square);

        if (square.className.includes("square"))
            square.setAttribute("data-click-mode", mode);
    }

    /**
     * This function sets the effect of the given square element or id(squareID).
     */
    public addSquareEffects(
        square: Square | HTMLDivElement | Element,
        effect: SquareEffect | Array<SquareEffect>
    ): void {
        if (typeof square === "number")
            square = this.getSquareElement(square);

        if (!Array.isArray(effect))
            effect = [effect];

        let squareEffect = square.querySelector(".square-effect") as HTMLDivElement;
        if (!squareEffect) {
            square.innerHTML += `
                <div class="square-effect">
                    <div class="square-effect-layer"></div>
                    <div class="square-effect-icon"></div>
                </div>
            `;
            squareEffect = square.querySelector(".square-effect") as HTMLDivElement;
        }

        for (let e of effect) {
            if (!squareEffect.className.includes(`square-effect--${e}`))
                squareEffect.className += ` square-effect--${e}`;
        }
    }

    /**
     * This function clears the effect of the given square element or id(squareID).
     * @example removeEffectOfSquare(1, SquareEffect.Select); // Removes the select effect of the square with id 1.
     * @example removeEffectOfSquare(1); // Removes all effects of the square with id 1.
     * @example removeEffectOfSquare(1, [SquareEffect.Select, SquareEffect.Move]); // Removes the select and move effects of the square with id 1.
     */
    public removeSquareEffect(
        square: Square | HTMLDivElement | Element,
        effects: SquareEffect | Array<SquareEffect> | null = null
    ): void {
        if (!square) return;

        if (typeof square === "number")
            square = this.getSquareElement(square);

        const squareEffect = square.querySelector(".square-effect") as HTMLDivElement;
        if (!squareEffect) return;

        if (effects == null)
            squareEffect.remove();
        else {
            if (!Array.isArray(effects))
                effects = [effects];

            for (let e of effects)
                squareEffect.className = squareEffect.className.replaceAll(`square-effect--${e}`, "");

            if (squareEffect.className.trim() == "square-effect")
                squareEffect.remove();
        }
    }

    /**
     * Find and remove the given effects from all squares.
     */
    public removeEffectFromAllSquares(effects: Array<SquareEffect> | null = null): void {
        let squares: NodeListOf<Element> = this.getAllSquares();
        for (let i = 0; i <= 63; i++)
            this.removeSquareEffect(squares[i], effects);
    }

    /**
     * This function plays the given sound.
     */
    public playSound(name: SoundEffect): void {
        const audio = new Audio(this.sounds[name]);

        audio.addEventListener('ended', () => {
            audio.remove();
        });

        audio.play().catch(error => {
            console.error("Error while playing sound: ", error);
            audio.remove();
        });
    }
}
