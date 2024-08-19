import { Color, PieceType } from "../../Chess/Types";
import { Component } from "./Component.ts";
import { Chess} from "../../Chess/Chess.ts";
import { MenuOperation } from "../Types";

/**
 * This class provide a table to show the notation.
 */
export class NotationMenu extends Component{
    protected readonly chess: Chess;
    private moveCount: number = 0;
    private lastScore: Record<Color, number> = {[Color.White]: 0, [Color.Black]: 0};

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        super();
        this.chess = chess;
        this.renderComponent();
        document.addEventListener("DOMContentLoaded", () => {
            this.update(this.chess.engine.getNotation(), this.chess.engine.getScores());
        });
    }

    /**
     * This function render the notation table.
     */
    protected renderComponent(): void
    {
        this.loadHTML("notation-menu", `
                <div class="turn-indicator" id="black-turn-indicator"><span></span><span>Black's turn</span></div>
                <div class = "score-table" id = "black-player-pieces"></div>
                <table id = "notation-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>White</th>
                            <th>Black</th>
                        </tr>
                    </thead>
                    <tbody id = "notations"></tbody>
                </table>
                <div class="utility-menu">
                    <button class="menu-item" data-menu-operation="${MenuOperation.FlipBoard}">F</button>
                    <button class="menu-item" data-menu-operation="undo">&lt;</button>
                    <button class="menu-item" data-menu-operation="undo">&lt;</button>
                    <button class="menu-item" data-menu-operation="redo">&gt;</button>
                    <button class="menu-item" data-menu-operation="redo">&gt;</button>
                    <button class="menu-item" data-menu-operation="reset">R</button>
                </div>
                <!-- A new menu might be added here for draw, resign etc. options. -->
                <div class="score-table" id="white-player-pieces"></div>
                <div class="turn-indicator" id="white-turn-indicator"><span></span><span>White's turn</span></div>
        `);
        this.loadCSS("notation-menu.css");
    }

    /**
     * This function adds a row/notation to the table.
     */
    private addNotation(notations: Array<string>): void
    {
        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notationMenu: HTMLElement = document.getElementById("notations")!;

        // If the notation is empty then add the first notation.
        if(notationMenu.innerHTML == "")
        {
            for(let i = 0; i < notations.length; i += 1){
                if(i % 2 == 0){
                    notationMenu.innerHTML +=
                        `
                        <tr>
                            <td>${(i / 2) + 1}</td>
                            <td>${notations[i]}</td>
                            <td></td>
                        </tr>
                    `;
                }else{
                    notationMenu.lastElementChild!.innerHTML = notationMenu.lastElementChild!.innerHTML.replace("<td></td>", "<td>" + notations[i] + "</td>");
                }
            }
        }
        else
        {
            // Add the notation to the last row and also check if the notation is not repeated.
            const lastNotation: string = notations[notations.length - 1];
            const lastRow: HTMLElement = notationMenu.lastElementChild as HTMLElement;

            /**
             * If notation length is even then move is black, so add the notation to the
             * last row as td, otherwise create new row and add the notation as td.
             */
            if(notations.length % 2 == 0)
                lastRow.innerHTML = lastRow.innerHTML.replace(`<td></td>`, `<td>${lastNotation}</td>`);
            else
                lastRow.insertAdjacentHTML("afterend", `<tr><td>${Math.ceil(notations.length / 2)}</td><td>${lastNotation}</td><td></td></tr>`);
        }

        // Scroll to the bottom of the table.
        const notationTable: HTMLElement = document.querySelector("#notation-table tbody")!;
        notationTable.scrollTop = notationTable.scrollHeight;

        // Set the move count.
        this.moveCount = notations.length;
    }

    /**
     * This function shows the score of the players top and bottom of the table.
     */
    private setScore(scores: Record<Color, {score: number, pieces: PieceType[]}>): void
    {
        if(this.lastScore.White == scores.White.score && this.lastScore.Black == scores.Black.score)
            return;

        // Clear the score table.
        document.getElementById("white-player-pieces")!.innerHTML = "";
        document.getElementById("black-player-pieces")!.innerHTML = "";

        // Unicode of the pieces.
        const pieceUnicode: {[key in PieceType]?: string} = {
            [PieceType.Pawn]: "&#9817;",
            [PieceType.Rook]: "&#9814;",
            [PieceType.Knight]: "&#9816;",
            [PieceType.Bishop]: "&#9815;",
            [PieceType.Queen]: "&#9813;",
        }

        // Show the pieces of the players on the top and bottom of the table.
        scores[Color.White].pieces.forEach((piece: PieceType) => {
            document.getElementById("white-player-pieces")!.innerHTML += " " + pieceUnicode[piece];
        });
        scores[Color.Black].pieces.forEach((piece: PieceType) => {
            document.getElementById("black-player-pieces")!.innerHTML += " " + pieceUnicode[piece];
        });

        // Show the score of the players on the top and bottom of the table.
        const whiteScore = scores[Color.White].score;
        const blackScore = scores[Color.Black].score;
        document.getElementById("white-player-pieces")!.innerHTML += whiteScore <= 0 ? "" : " +" + whiteScore;
        document.getElementById("black-player-pieces")!.innerHTML += blackScore <= 0 ? "" : " +" + blackScore;

        // Set the last score.
        this.lastScore = {[Color.White]: whiteScore, [Color.Black]: blackScore};
    }

    private changeIndicator(): void
    {
        const current_player_color = this.chess.engine.getNotation().length % 2 == 0 ? 'white' : 'black';
        const previous_player_color = current_player_color == 'white' ? 'black' : 'white';
        document.getElementById(`${previous_player_color}-turn-indicator`)!.classList.remove("visible");
        document.getElementById(`${current_player_color}-turn-indicator`)!.classList.add("visible");
    }

    /**
     * Update the notation table.
     */
    public update(notation: Array<string>, scores: Record<Color, {score: number, pieces: PieceType[]}>): void
    {
        if(this.chess.engine.getNotation().length == this.moveCount)
            return;

        this.setScore(scores);
        this.addNotation(notation);
        this.changeIndicator();
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        document.getElementById("notations")!.innerHTML = "";
        document.getElementById("black-player-pieces")!.innerHTML = "";
        document.getElementById("white-player-pieces")!.innerHTML = "";
        this.moveCount = 0;
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};
    }
}
