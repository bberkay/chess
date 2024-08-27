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
            this.update();
        });
    }

    /**
     * This function render the notation table.
     */
    protected renderComponent(): void
    {
        this.loadHTML("notation-menu", `
                <div class="player-score-section" id="black-player-score-section">
                    <div class="turn-indicator" id="black-turn-indicator">
                        <span class = "indicator-icon"></span>
                        <span>Black's turn</span>
                    </div>
                    <div class = "score-table" id = "white-captured-pieces"></div>
                </div>
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
                    <button class="menu-item" data-menu-operation="undo">⟪</button>
                    <button class="menu-item" data-menu-operation="undo">◀</button>
                    <button class="menu-item" data-menu-operation="redo">▶</button>
                    <button class="menu-item" data-menu-operation="redo">⟫</button>
                    <button class="menu-item" data-menu-operation="reset">R</button>
                </div>
                <!-- A new menu might be added here for draw, resign etc. options. -->
                <div class="player-score-section" id="white-player-score-section">
                    <div class="score-table" id="black-captured-pieces"></div>
                    <div class="turn-indicator visible" id="white-turn-indicator">
                        <span class = "indicator-icon"></span>
                        <span>White's turn</span>
                    </div>
                </div>
        `);
        this.loadCSS("notation-menu.css");
    }

    /**
     * This function adds a row/notation to the table.
     */
    private addNotation(notations: ReadonlyArray<string>): void
    {
        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notationMenu: HTMLElement = document.getElementById("notations")!;
        if(notationMenu.innerHTML == "")
        {
            for(let i = 0; i < notations.length; i += 1){
                const notationUnicoded = this.convertStringNotationToUnicodedNotation(notations[i]);
                if(i % 2 == 0){
                    notationMenu.innerHTML +=
                        `
                        <tr>
                            <td>${(i / 2) + 1}</td>
                            <td>${notationUnicoded}</td>
                            <td></td>
                        </tr>
                    `;
                }else{
                    notationMenu.lastElementChild!.innerHTML = notationMenu.lastElementChild!.innerHTML.replace("<td></td>", "<td>" + notationUnicoded + "</td>");
                }
            }
        }
        else
        {
            const lastNotation: string = this.convertStringNotationToUnicodedNotation(notations[notations.length - 1]);
            const lastRow: HTMLElement = notationMenu.lastElementChild as HTMLElement;
            if(notations.length % 2 == 0)
                lastRow.innerHTML = lastRow.innerHTML.replace(`<td></td>`, `<td>${lastNotation}</td>`);
            else
                lastRow.insertAdjacentHTML(
                    "afterend", 
                    `<tr><td>${Math.ceil(notations.length / 2)}</td><td>${lastNotation}</td><td></td></tr>`
                );
        }

        const notationTable: HTMLElement = document.querySelector("#notation-table tbody")!;
        notationTable.scrollTop = notationTable.scrollHeight;

        this.moveCount = notations.length;
    }

    /**
     * This function shows the score of the players top and bottom of the table.
     */
    private setScore(scores: Record<Color, {score: number, pieces: PieceType[]}>): void
    {
        if(this.lastScore.White == scores.White.score && this.lastScore.Black == scores.Black.score)
            return;

        document.getElementById("white-captured-pieces")!.innerHTML = '<span class="piece-icons"></span><span></span>';
        document.getElementById("black-captured-pieces")!.innerHTML = '<span class="piece-icons"></span><span></span>';

        scores[Color.White].pieces.forEach((piece: PieceType) => {
            document.querySelector("#black-captured-pieces .piece-icons")!.innerHTML += " " + this.getPieceUnicode(piece);
        });
        scores[Color.Black].pieces.forEach((piece: PieceType) => {
            document.querySelector("#white-captured-pieces .piece-icons")!.innerHTML += " " + this.getPieceUnicode(piece);
        });

        const whiteScore = scores[Color.White].score;
        const blackScore = scores[Color.Black].score;
        document.querySelector("#black-captured-pieces :not(.piece-icons)")!.innerHTML += whiteScore <= 0 ? "" : " +" + whiteScore;
        document.querySelector("#white-captured-pieces :not(.piece-icons)")!.innerHTML += blackScore <= 0 ? "" : " +" + blackScore;

        this.lastScore = {[Color.White]: whiteScore, [Color.Black]: blackScore};
    }

    /**
     * This function converts the string notation to unicode notation.
     * @example convertStringNotationToUnicodedNotation("Kf3") returns "&#9812;f3"
     */
    private convertStringNotationToUnicodedNotation(notation: string): string
    {
        if(notation.length <= 2 || notation == "O-O-O")
            return notation;

        const pieceInfo = notation[0].toUpperCase();
        switch(pieceInfo){
            case "K": return this.getPieceUnicode(PieceType.King) + notation.slice(1);
            case "N": return this.getPieceUnicode(PieceType.Knight) + notation.slice(1);
            case "B": return this.getPieceUnicode(PieceType.Bishop) + notation.slice(1);
            case "R": return this.getPieceUnicode(PieceType.Rook) + notation.slice(1);
            case "Q": return this.getPieceUnicode(PieceType.Queen) + notation.slice(1);
            default: return notation;
        }
    }

    /**
     * This function returns the unicode of the piece
     * according to the given piece type.
     */
    private getPieceUnicode(piece: PieceType | string): string
    {       
        switch(piece)
        {
            case PieceType.Pawn: return "&#9817;";
            case PieceType.Rook: return "&#9814;";
            case PieceType.Knight: return "&#9816;";
            case PieceType.Bishop: return "&#9815;";
            case PieceType.Queen: return "&#9813;";
            case PieceType.King: return "&#9812;";
            default: return "";
        }
    }

    /**
     * This function changes the indicator of the turn.
     */
    private changeIndicator(): void
    {
        const current_player_color = this.chess.engine.getNotation().length % 2 == 0 ? 'white' : 'black';
        const previous_player_color = current_player_color == 'white' ? 'black' : 'white';
        document.getElementById(`${previous_player_color}-turn-indicator`)!.classList.remove("visible");
        document.getElementById(`${current_player_color}-turn-indicator`)!.classList.add("visible");
    }

    /**
     * Flip the notation table.
     */
    public flip(): void {
        this.chess.board!.flip();
                
        let playerScoreSectionOnTop = document.querySelector(".player-score-section")!;
        playerScoreSectionOnTop.append(playerScoreSectionOnTop.firstElementChild!)
        playerScoreSectionOnTop.parentElement!.append(playerScoreSectionOnTop);
        
        playerScoreSectionOnTop = document.querySelector(".player-score-section")!;
        playerScoreSectionOnTop.append(playerScoreSectionOnTop.firstElementChild!)
        playerScoreSectionOnTop.parentElement!.prepend(playerScoreSectionOnTop!);
    }

    /**
     * Update the notation table and the score of the players.
     */
    public update(): void
    {
        if(this.chess.engine.getNotation().length == this.moveCount)
            return;

        this.setScore(this.chess.engine.getScores());
        this.addNotation(this.chess.engine.getNotation());
        this.changeIndicator();
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        document.getElementById("notations")!.innerHTML = "";
        document.getElementById("white-captured-pieces")!.innerHTML = "";
        document.getElementById("black-captured-pieces")!.innerHTML = "";
        document.getElementById("white-turn-indicator")!.classList.add("visible");
        document.getElementById("black-turn-indicator")!.classList.remove("visible");
        this.moveCount = 0;
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};
    }
}
