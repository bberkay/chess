/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/logic).
 * @version 1.0.0
 * @author Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Converter } from "../Utils/Converter.ts";
import { Color, PieceType, SquareClickMode, SquareEffect, StartPosition, Square } from "../Types.ts";

export class ChessBoard {
    /**
     * This class provides users to create and manage a chess board(does not include any mechanic/logic).
     */

    /**
     * Store locked squares click modes
     * to restore them after unlock the board.
     */
    private lockedSquaresModes: Array<SquareClickMode> = [];
    private colorOfSelectedPiece: Color | null = null;

    /**
     * Constructor of the ChessBoard class.
     * @param isStandalone If this parameter is true, the board will work standalone. Otherwise, it will work with the Chess class.
     */
    constructor(isStandalone: boolean = true) {
        console.log("isStandalone: " + isStandalone);
        // IsStandalone olduğunda managerlar ile beraber geliştirilir.
    }

    /**
     * This function creates a chess board with the given position(fen notation or json notation).
     * @example createGame(StartPosition.Standard);
     * @example createGame("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
     * @example createGame([{"color":Color.White, "type":PieceType.Pawn, "square":Square.a2}, {"color":Color.White, "type":PieceType.Pawn, "square":Square.b2}, ...]);
     */
    public createGame(position: Array<{color: Color, type:PieceType, square:Square}> | StartPosition | string = StartPosition.Standard): void
    {
        // If position is not an array(string means fen notation), convert it to JSON notation.
        if(!Array.isArray(position))
            position = Converter.convertFENToJSON(position as StartPosition);

        // Create squares in the board.
        this.createBoard();

        // Create the pieces.
        this.createPieces(position);
    }

    /**
     * This function creates the background of the chess board in #chessboard div
     */
    private createBoard(): void
    {
        // Find the chess board element and clear it.
        let board: HTMLDivElement = document.getElementById("chessboard") as HTMLDivElement;
        board.innerHTML = "";

        // Create the squares.
        for (let i = 1; i <= 64; i++) {
            // Create the square and set the
            let square: HTMLDivElement = document.createElement("div");
            square.id = i.toString();
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
            square.className += ((Math.floor((i - 1) / 8) + i) % 2 === 0) ? " square--white" : " square--black";

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
            if(i % 8 == 0)
                square.innerHTML += `<div class="row-coordinate">${9 - Math.floor(i / 8)}</div>`;

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
        // Clear square if it is not empty.
        this.clearSquare(square);

        // Create the piece element and set the class name.
        let piece: HTMLDivElement = document.createElement("div");
        piece.className = "piece";

        // Set the piece type and color to the piece element.
        piece.setAttribute("data-piece", type.toLowerCase());
        piece.setAttribute("data-color", color.toLowerCase());

        /**
         * Set the click mode "Select" to the square which means
         * the square will be selected when it is clicked.
         */
        this.setSquareClickMode(square, SquareClickMode.Select);

        // Add the piece to the board.
        document.getElementById(square.toString())?.appendChild(piece);
    }

    /**
     * This function removes the piece from the chess board.
     */
    public clearSquare(square:Square): void
    {
        // Clear the effects of the square.
        this.removeSquareEffect(square);

        // Remove the piece element if it exists.
        const squareElement = document.getElementById(square.toString());
        squareElement?.querySelector(".piece")?.remove();
    }

    /**
     * This function selects the square on the chess board.
     */
    public highlightSelect(squareID: Square): void
    {
        // Clear/Restore the board its default state before selecting the square.
        this.clearBoard();

        // Get the selected square by its id.
        const selectedSquare: HTMLDivElement = document.getElementById(squareID.toString()) as HTMLDivElement;

        // Get the color of the selected piece(if exists).
        this.colorOfSelectedPiece = selectedSquare.querySelector(".piece")?.getAttribute("data-color") as Color;

        // Add selected effect to the selected square.
        this.setSquareEffect(selectedSquare, SquareEffect.Selected);

        /**
         * Set the click mode "Clear" to the square because
         * we want to clear the square when it is clicked again.
         */
        this.setSquareClickMode(selectedSquare, SquareClickMode.Clear);
    }

    /**
     * This function moves the piece from the given square to the given square on the chess board.
     */
    public playMove(from:Square, to:Square): void
    {
        // Remove piece at the target square(to) if it exists.
        this.clearSquare(to);

        // Move piece from the source square(from) to the target square(to).
        document.getElementById(to.toString())?.appendChild(document.getElementById(from.toString())?.firstChild as HTMLDivElement);
    }

    /**
     * This function shows the possible moves of the given piece on the chess board.
     */
    public highlightMoves(moves:Array<Square>): void
    {
        for(let move of moves){
            /**
             * If the move square has a piece then set the square
             * effect "Killable" otherwise set "Playable".
             */
            let squareContent = document.getElementById(move.toString())?.lastElementChild;
            if(squareContent && squareContent.className.includes("piece") && squareContent.getAttribute("data-color") !== this.colorOfSelectedPiece)
                this.setSquareEffect(move, SquareEffect.Killable);
            else
                this.setSquareEffect(move, SquareEffect.Playable);

            // Set the click mode of the square(square's content doesn't matter because it's playable).
            this.setSquareClickMode(move, SquareClickMode.Play);
        }
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
            let id = parseInt(squares[i].id);

            /**
             * If the square id is not equal to i + 1 then set the square id to i + 1.
             * This scenario can happen when the player change square is id in DOM with devtools.
             * So, we need to fix the square id's.
             */
            if (id !== i + 1)
                squares[i].id = (i+1).toString();

            // Remove the effects of the square(except check effect, because it is effect for next move/player, not current state).
            this.removeSquareEffect(squares[i], [SquareEffect.Playable, SquareEffect.Killable, SquareEffect.Selected]);

            /**
             * If the square has a piece then set the click mode "Select" otherwise
             * set the click mode "Clear" to the square.
             */
            if (squares[i].lastElementChild?.className.includes("piece"))
                this.setSquareClickMode(squares[i] as HTMLDivElement, SquareClickMode.Select);
            else // If the square does not have a piece
                this.setSquareClickMode(squares[i] as HTMLDivElement, SquareClickMode.Clear);
        }
    }

    /**
     * Lock board interactions.
     */
    public lockBoard(): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");
        for(let i = 1; i <= 64; i++){
            // Save the click mode of the square. We will use it when we unlock the board.
            this.lockedSquaresModes.push(squares[i].getAttribute("data-click-mode") as SquareClickMode);

            // Set the click mode "Disable" to the square.
            this.setSquareClickMode(squares[i], SquareClickMode.Disable);

            // Set disabled effect to the square.
            this.setSquareEffect(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Enable board interactions.
     */
    public unlockBoard(): void
    {
        // Get all squares on the board.
        let squares: NodeListOf<Element> = document.querySelectorAll(".square");

        for(let i = 1; i <= 64; i++){
            /**
             * Set the click mode of the square to the mode which we saved
             * when we locked the board.
             */
            this.setSquareClickMode(squares[i], this.lockedSquaresModes[i-1]);

            // Remove disabled effect from the square.
            this.removeSquareEffect(squares[i], SquareEffect.Disabled);
        }
    }

    /**
     * Show promotion menu.
     */
    public showPromotionMenu(square: Square): void
    {
        /**
         * Disable the board. We don't want to allow player to
         * move pieces while choosing promotion piece.
         */
        this.lockBoard();

        // Find and hide promoted pawn on the board.
        let promotedPawn: HTMLDivElement = document.getElementById(square.toString())!.firstChild as HTMLDivElement;
        promotedPawn.style.display = "none";

        // Create promotion options. (Queen, Rook, Bishop, Knight)
        const PROMOTION_TYPES: Array<string> = [PieceType.Queen, PieceType.Rook, PieceType.Bishop, PieceType.Knight];

        // Create promotion menu for every promotion option.
        for(let i = 0; i < 4; i++){
            // Create promotion option and set attributes.
            let promotionOption: HTMLDivElement = document.createElement("div");
            promotionOption.className = "piece";
            promotionOption.className += " promotion-option";

            // Set piece type of promotion option.
            promotionOption.setAttribute("data-piece", PROMOTION_TYPES[i].toLowerCase());

            // Set color of promotion option to the color of promoted pawn.
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
            this.removeSquareEffect(targetSquare, SquareEffect.Disabled);
            this.setSquareClickMode(targetSquare, SquareClickMode.Promote);
        }
    }

    /**
     * Close promotion menu.
     */
    public closePromotionMenu(): void
    {
        // Find promotion options
        let promotionOptions: NodeListOf<Element> = document.querySelectorAll(".promotion-option");

        // Remove promotion options.
        for(let i = 0; i < 4; i++)
            promotionOptions[i].remove();

        /**
         * Enable the board. If the player choose a promotion piece then
         * allow player to interact with the board.
         */
        this.unlockBoard();
    }

    /**
     * This function sets the click mode of the given square element or id(squareID).
     */
    private setSquareClickMode(square: Square|HTMLDivElement|Element, mode:SquareClickMode): void
    {
        // If the square is a number then get the square element by id/number.
        if(typeof square === "number")
            square = document.getElementById(square.toString()) as HTMLDivElement;

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
            square = document.getElementById(square.toString()) as HTMLDivElement;

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
            square = document.getElementById(square.toString()) as HTMLDivElement;

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
}