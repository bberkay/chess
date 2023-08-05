/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/rule).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import {Color, PieceType, Square, SquareClickMode, SquareEffect, StartPosition} from "../Enums.ts";
import {Converter} from "../Utils/Converter.ts";

export class ChessBoard {

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     */
    public createBoard(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // Set the game position.
        if(!Array.isArray(position)) // If fen notation is given
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create the board.
        this.createSquares();

        // Create the pieces.
        this.createPieces(position);
    }

    /**
     * This function creates the background of the chess board in #chessboard div
     */
    private createSquares(): void
    {
        // Clear board.
        let board: HTMLDivElement = document.getElementById("chessboard") as HTMLDivElement;

        // Create the squares.
        for (let i = 1; i <= 64; i++) {
            // Create the square.
            let square: HTMLDivElement = document.createElement("div");
            square.id = i.toString();
            square.className = "square";

            // Set the background color of the square.
            square.className += ((Math.floor((i - 1) / 8) + i) % 2 === 0) ? " square--white" : " square--black";

            // Create numbers of the board
            if(i > 56 && i < 65)
                square.innerHTML += `<div class="column-coordinate">${String.fromCharCode(64 + (i % 8 || 8)).toLowerCase()}</div>`;

            // Create letters of the board
            if(i % 8 == 0)
                square.innerHTML += `<div class="row-coordinate">${9 - Math.floor(i / 8)}</div>`;

            // Set the click mode of the square.
            this.setClickModeForSquare(square, SquareClickMode.Refresh);

            // Add the square to the board.
            board.appendChild(square);
        }
    }

    /**
     * This function creates the pieces on the chess board.
     */
    public createPieces(position:Array<{color: Color, type:PieceType, square:Square}>): void
    {
        for(let piece of position)
            this.createPiece(piece.color, piece.type, piece.square);
    }

    /**
     * This function creates a piece on the chess board.
     */
    public createPiece(color: Color, type:PieceType, square:Square): void
    {
        // Clear square.
        this.clearSquare(square);

        // Create the piece.
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";
        piece.setAttribute("data-piece", type.toLowerCase());
        piece.setAttribute("data-color", color.toLowerCase());

        // Set the click mode of the piece square.
        this.setClickModeForSquare(square, SquareClickMode.Select);

        // Add the piece to the board.
        document.getElementById(square.toString())?.appendChild(piece);
    }

    /**
     * This function removes the piece from the chess board.
     */
    public clearSquare(square:Square): void
    {
        // Clear the effects of the square.
        this.removeEffectOfSquare(square);

        // Remove the piece element if it exists.
        const squareElement = document.getElementById(square.toString());
        squareElement?.querySelector(".piece")?.remove();
    }

    /**
     * This function selects the square on the chess board.
     */
    public highlightSquare(squareID: Square): void
    {
        // Clear the effects of the board.
        this.refreshBoard();

        // Get the selected square.
        const selectedSquare: HTMLDivElement = document.getElementById(squareID.toString()) as HTMLDivElement;

        // Set the effect of the selected square.
        this.setEffectOfSquare(selectedSquare, SquareEffect.Selected);

        // Set the click mode of the selected square.
        this.setClickModeForSquare(selectedSquare, SquareClickMode.Refresh);
    }

    /**
     * This function moves the piece from the given square to the given square on the chess board.
     */
    public highlightMove(from:Square, to:Square): void
    {
        // Remove the piece if it exists.
        this.clearSquare(to);

        // Move the piece to the square(to).
        document.getElementById(to.toString())?.appendChild(document.getElementById(from.toString())?.firstChild as HTMLDivElement);
    }

    /**
     * This function shows the possible moves of the given piece on the chess board.
     */
    public highlightMoves(moves:Array<Square>): void
    {
        for(let move of moves){
            // Set the effect of the square.
            if(document.getElementById(move.toString())?.firstChild) // If the square has a piece
                this.setEffectOfSquare(move, SquareEffect.Killable);
            else // If the square does not have a piece
                this.setEffectOfSquare(move, SquareEffect.Playable);

            // Set the click mode of the square.
            this.setClickModeForSquare(move, SquareClickMode.Play);
        }
    }

    /**
     * This function removes the effects from board.
     */
    public refreshBoard(): void
    {
        let squares = document.querySelectorAll(".square");
        for(let i = 0; i <= 63; i++){
            // Get ID of the square.
            let id = parseInt(squares[i].id);

            // Control Squares and piece ID for changing on DOM(Security measures). If any id change after the start then set its id to its position
            if (id !== i + 1)
                squares[i].id = (i+1).toString();

            // Remove the effects of the square(except check effect, because it is effect for next move).
            this.removeEffectOfSquare(squares[i], [SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Selected]);

            // Set the click mode of the square.
            if (squares[i].lastElementChild?.className.includes("piece")) // If the square has a piece
                this.setClickModeForSquare(squares[i] as HTMLDivElement, SquareClickMode.Select);
            else // If the square does not have a piece
                this.setClickModeForSquare(squares[i] as HTMLDivElement, SquareClickMode.Refresh);
        }
    }

    /**
     * Disable the board.
     * @param disableClick Disable click mode of the squares.
     * @param disableEffect Disable effect of the squares.
     */
    public disableBoard(disableClick: boolean = true, disableEffect: boolean = true): void
    {
        // Disable all squares.
        let squares = document.querySelectorAll(".square");
        for(let i = 1; i <= 64; i++){
            // Set the click mode of the square.
            if(disableClick)
                this.setClickModeForSquare(squares[i], SquareClickMode.Disable);

            // Set the effect of the square.
            if(disableEffect)
                this.setEffectOfSquare(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Toggle promotion window.
     */
    public togglePromotion(square: Square): void
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

       square.setAttribute("data-click-mode", mode);
    }

    /**
     * This function sets the effect of the given square element or id(squareID).
     */
    private setEffectOfSquare(square: Square|HTMLDivElement|Element, effect: SquareEffect): void
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