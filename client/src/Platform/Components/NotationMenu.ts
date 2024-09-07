import { Color, PieceType } from "@Chess/Types";
import { Component } from "./Component.ts";
import { Chess } from "@Chess/Chess.ts";
import { BoardEditorOperation, NavigatorModalOperation, NotationMenuOperation } from "../Types";

/**
 * This class provide a table to show the notation.
 */
export class NotationMenu extends Component{
    private readonly chess: Chess;
    private moveCount: number = 0;
    private lastScore: Record<Color, number> = {[Color.White]: 0, [Color.Black]: 0};

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        super();
        this.chess = chess;
        this.loadCSS("notation-menu.css");
        this.renderComponent();
        document.addEventListener("DOMContentLoaded", () => {
            this.update(true);
        });
    }

    /**
     * This function render the notation table.
     */
    protected renderComponent(): void
    {
        this.loadHTML("notation-menu", `
                <div class="player-section your-turn-effect" id="black-player-section">
                    <div class="player-name-container">
                        <div class="player-name" id="black-player-name">Black Player</div> 
                    </div>
                    <div class="score-table" id="white-captured-pieces"></div>
                </div>
                <div>
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
                        <button class="menu-item" data-menu-operation="${BoardEditorOperation.FlipBoard}" data-tooltip-text="Flip Board">F</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.FirstMove}" disabled="true" data-tooltip-text="Go First Move">⟪</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.PreviousMove}" disabled="true" data-tooltip-text="Go Previous Move">❮</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.NextMove}" disabled="true" data-tooltip-text="Go Next Move">❯</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.LastMove}" disabled="true" data-tooltip-text="Go Last Move">⟪</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.ToggleNotationMenuUtilityMenu}">☰</button>
                    </div>
                    <div class="utility-menu utility-toggle-menu visible">
                        <div class="utility-toggle-menu-section active" id="new-game-utility-menu">
                            <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}" data-tooltip-text="Create New Game">+ New Game</button>
                            <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowWelcome}" data-tooltip-text="About Project">Info</button>
                        </div>
                        <div class="utility-toggle-menu-section" id="lobby-utility-menu">
                            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendUndoOffer}" data-tooltip-text="Send Undo Offer">↺ Undo</button>
                            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendDrawOffer}" data-tooltip-text="Send Draw Offer">Draw</button>
                            <button class="menu-item" data-menu-operation="${NotationMenuOperation.Resign}" data-tooltip-text="Resign From Game">⚐ Resign</button>
                        </div>
                    </div>
                </div>
                <div class="player-section your-turn-effect" id="white-player-section">
                    <div class="player-name-container">
                        <div class="player-name" id="white-player-name">White Player</div> 
                    </div>
                    <div class="score-table" id="black-captured-pieces"></div>
                </div>
        `);
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
        const current_player_color = this.chess.engine.getTurnColor();
        const previous_player_color = current_player_color == Color.White ? Color.Black : Color.White
        document.getElementById(`${previous_player_color.toLowerCase()  }-player-section`)!.classList.remove("your-turn-effect");
        document.getElementById(`${current_player_color.toLowerCase()}-player-section`)!.classList.add("your-turn-effect");
    }

    /**
     * Flip the notation table.
     */
    public flip(): void {                
        let playerScoreSectionOnTop = document.querySelector(".player-section")!;
        playerScoreSectionOnTop.parentElement!.append(playerScoreSectionOnTop);
        
        playerScoreSectionOnTop = document.querySelector(".player-section")!;
        playerScoreSectionOnTop.parentElement!.prepend(playerScoreSectionOnTop!);
    }

    /**
     * Update the notation table and the score of the players.
     */
    public update(force: boolean = false): void
    {
        if(!force && this.chess.engine.getNotation().length == this.moveCount)
            return;

        this.setScore(this.chess.engine.getScores());
        this.addNotation(this.chess.engine.getNotation());
        this.changeIndicator();
    }

    /**
     * This function opens/closes the utility menu.
     */
    public toggleUtilityMenu(): void
    {
        document.querySelector(`#notation-menu .utility-toggle-menu`)!.classList.toggle("visible");
    }

    /**
     * Show the new game utility menu section. This menu contains
     * new game and info buttons.
     */
    public setUtilityMenuToNewGame(): void
    {
        const utilityMenuSections = document.querySelectorAll(".utility-toggle-menu-section") as NodeListOf<HTMLElement>;
        utilityMenuSections.forEach((section: HTMLElement) => {
            section.classList.remove("active");
        });

        document.getElementById(`new-game-utility-menu`)!.classList.add("active");
    }

    /**
     * Show the lobby utility menu section. This menu contains
     * undo, draw and resign buttons.
     */
    public setUtilityMenuToLobby(): void
    {
        const utilityMenuSections = document.querySelectorAll(".utility-toggle-menu-section") as NodeListOf<HTMLElement>;
        utilityMenuSections.forEach((section: HTMLElement) => {
            section.classList.remove("active");
        });

        document.getElementById(`lobby-utility-menu`)!.classList.add("active");
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        document.getElementById("notations")!.innerHTML = "";
        document.getElementById("white-captured-pieces")!.innerHTML = "";
        document.getElementById("black-captured-pieces")!.innerHTML = "";
        document.getElementById("white-player-section")!.classList.add("your-turn-effect");
        document.getElementById("black-player-section")!.classList.remove("your-turn-effect");
        this.moveCount = 0;
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};
    }
}
