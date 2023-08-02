/**
 * @module ChessBoard
 * @description This module provides users to create and manage a chess board(does not include any mechanic/rule).
 * @version 1.0.0
 * @created by Berkay Kaya
 * @url https://github.com/bberkay/chess
 */

import { Converter } from "../Utils/Converter";
import { StartPosition, Color, PieceType, Square, SquareClickMode } from "../Enums.ts";

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
        document.getElementById(square.toString())?.firstChild?.remove();
    }

    /**
     * This function sets the click mode of the given square element or id.
     */
    private setClickModeForSquare(square: HTMLDivElement|number, mode:SquareClickMode): void
    {
       if(typeof square === "number")
           square = document.getElementById(square.toString()) as HTMLDivElement;

       square.setAttribute("onclick", `BoardHandler.${mode}(this)`);
    }
}