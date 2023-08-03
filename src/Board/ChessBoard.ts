/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/rule).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Converter } from "../Utils/Converter";
import { StartPosition, Color, PieceType, Square, SquareClickMode, SquareEffect } from "../Enums.ts";

export class ChessBoard {
    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     */
    createBoard(position:StartPosition|Array<{color: Color, type:PieceType, square:Square}> = StartPosition.Standard): void
    {

        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position);

        // Create the board.
        this.createSquares();

        // Create the pieces.
        this.createPieces(position);
    }

    /**
     * This function creates the background of the chess board.
     */
    private createSquares(): void
    {
        // Remove the board if it exists.
        document.getElementById("chessboard")?.remove();

        // Create the board.
        let board: HTMLDivElement = document.createElement("div");
        board.id = "chessboard";
        board.className = "chessboard";
        document.body.appendChild(board);

        // Create the squares.
        for (let i = 1; i <= 64; i++) {
            // Create the square.
            let square: HTMLDivElement = document.createElement("div");
            square.id = i.toString();
            square.className = "square";

            // Set the background color of the square.
            if (i % 2 == 0)
                square.className += " square-white";
            else
                square.className += " square-black";

            // Create numbers of the board
            if(i > 56 && i < 65)
                square.innerHTML = `<div class="column-coordinate">${String.fromCharCode(64 + (i % 8 || 8))}</div>`;

            // Create letters of the board
            if(i % 8 == 0)
                square.innerHTML = `<div class="row-coordinate">${8 - Math.floor(i / 8)}</div>`;

            // Set the click mode of the square.
            this.setClickModeForSquare(square, SquareClickMode.Clear);

            // Add the square to the board.
            board.appendChild(square);
        }
    }

    /**
     * This function creates the pieces on the chess board.
     */
    createPieces(position:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of position)
            this.createPiece(piece.color, piece.type, piece.square);
    }

    /**
     * This function creates a piece on the chess board.
     */
    createPiece(color: Color, type:PieceType, square:Square): void
    {
        // Remove the piece if it exists.
        this.removePiece(square);

        // Create the piece.
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";
        piece.setAttribute("data-piece", type);
        piece.setAttribute("data-color", color);

        // Set the click mode of the piece square.
        this.setClickModeForSquare(square, SquareClickMode.Select);

        // Add the piece to the board.
        document.getElementById(square.toString())?.appendChild(piece);
    }

    /**
     * This function removes the piece from the chess board.
     */
    removePiece(square:Square): void
    {
        // Clear the effects of the square.
        this.removeEffectOfSquare(square);

        // Remove the piece if it exists.
        document.getElementById(square.toString())?.firstChild?.remove();

        // Set the click mode of the square.
        this.setClickModeForSquare(square, SquareClickMode.Clear);
    }

    /**
     * This function moves the piece from the given square to the given square.
     */
    movePiece(from:Square, to:Square): void
    {
        // Remove the piece if it exists.
        this.removePiece(to);

        // Move the piece.
        document.getElementById(to.toString())?.appendChild(document.getElementById(from.toString())?.firstChild as HTMLDivElement);

        // Set the click mode of the square.
        this.setClickModeForSquare(from, SquareClickMode.Clear);
        this.setClickModeForSquare(to, SquareClickMode.Select);
    }

    /**
     * This function shows the possible moves of the given piece.
     */
    showMoves(moves:Array<Square>): void
    {
        for(let move of moves){
            // Set the effect of the square.
            if(document.getElementById(move.toString())?.firstChild) // If the square has a piece
                this.setEffectForSquare(move, SquareEffect.Killable);
            else // If the square does not have a piece
                this.setEffectForSquare(move, SquareEffect.Playable);

            // Set the click mode of the square.
            this.setClickModeForSquare(move, SquareClickMode.Play);
        }
    }

    /**
     * This function removes the effects from board.
     */
    refreshBoard(): void
    {
        let squares = document.querySelectorAll(".square");
        for(let i = 1; i <= 64; i++){
            // Get ID of the square.
            let id = parseInt(squares[i].id);

            // Control Squares and piece ID for changing on DOM(Security measures). If any id change after the start then set its id to its position
            if (id !== i + 1)
                squares[i].id = (i+1).toString();

            // Remove the effects of the square(except check effect, because it is effect for next move).
            this.removeEffectOfSquare(squares[i], [SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Selected]);

            // Set the click mode of the square.
            if (squares[i].firstChild) // If the square has a piece
                this.setClickModeForSquare(squares[i], SquareClickMode.Select);
            else // If the square does not have a piece
                this.setClickModeForSquare(squares[i], SquareClickMode.Clear);
        }
    }

    /**
     * Disable the board.
     * @param disableClick Disable click mode of the squares.
     * @param disableEffect Disable effect of the squares.
     */
    disableBoard(disableClick: boolean = true, disableEffect: boolean = true): void
    {
        // Disable all squares.
        let squares = document.querySelectorAll(".square");
        for(let i = 1; i <= 64; i++){
            // Set the click mode of the square.
            if(disableClick)
                this.setClickModeForSquare(squares[i], SquareClickMode.Disable);

            // Set the effect of the square.
            if(disableEffect)
                this.setEffectForSquare(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Toggle promotion window.
     */
    togglePromotion(square: Square): void
    {
        // Disable the board.
        this.disableBoard();

        // Hide promoted pawn.
        let promotedPawn: HTMLDivElement = document.getElementById(square.toString())!.firstChild as HTMLDivElement;
        promotedPawn.style.display = "none";

        // Create promotion options.
        const PROMOTION_TYPES: Array<string> = ["queen", "rook", "bishop", "knight"];

        // Create window.
        for(let i = 0; i < 4; i++){
            // Create promotion option.
            let promotionOption: HTMLDivElement = document.createElement("div");
            promotionOption.className = "piece";
            promotionOption.className += " promotion-option";
            promotionOption.setAttribute("data-piece", PROMOTION_TYPES[i]);
            promotionOption.setAttribute("data-color", promotedPawn.getAttribute("data-color") as string);

            /**
             * Set position.
             * Promotion options are placed in the same column as the promoted pawn.
             * Example for white: square = 1, first promotion option(queen) is 1 + 8 = 9, second promotion option(rook) is 1 + 8 + 8 = 17, etc.
             * Example for black: square = 57, first promotion option(queen) is 57 - 8 = 49, second promotion option(rook) is 57 - 8 - 8 = 41, etc.
             */
            let targetSquare: HTMLDivElement = document.getElementById((square < 9 ? square + (i * 8) : square - (i * 8)).toString()) as HTMLDivElement;
            targetSquare.appendChild(promotionOption);

            // Set click mode and remove disabled effect.
            this.removeEffectOfSquare(targetSquare, SquareEffect.Disabled);
            this.setClickModeForSquare(targetSquare, SquareClickMode.Promote);
        }
    }

    /**
     * This function sets the click mode of the given square element or id(squareID).
     */
    private setClickModeForSquare(square: Square|HTMLDivElement|Element, mode:SquareClickMode): void
    {
        if(typeof square === "number")
            square = document.getElementById(square.toString()) as HTMLDivElement;

        square.setAttribute("onclick", `BoardHandler.${mode}(this)`);
    }

    /**
     * This function sets the effect of the given square element or id(squareID).
     */
    private setEffectForSquare(square: Square|HTMLDivElement|Element, effect: SquareEffect): void
    {
        if(typeof square === "number")
            square = document.getElementById(square.toString()) as HTMLDivElement;

        square.className += ` square-effect--${effect}`;
    }

    /**
     * This function clears the effect of the given square element or id(squareID).
     * @example removeEffectOfSquare(1, SquareEffect.Select); // Removes the select effect of the square with id 1.
     * @example removeEffectOfSquare(1); // Removes all effects of the square with id 1.
     * @example removeEffectOfSquare(1, [SquareEffect.Select, SquareEffect.Move]); // Removes the select and move effects of the square with id 1.
     */
    private removeEffectOfSquare(square: Square|HTMLDivElement|Element, effect: SquareEffect|Array<SquareEffect>|null = null): void
    {
        if(typeof square === "number")
            square = document.getElementById(square.toString()) as HTMLDivElement;

        if(effect == null)
            square.className = square.className.replace(/square-effect--\w+/g, "");
        else if(Array.isArray(effect))
            for(let e of effect)
                square.className = square.className.replace(`square-effect--${e}`, "");
        else
            square.className = square.className.replace(`square-effect--${effect}`, "");
    }
}