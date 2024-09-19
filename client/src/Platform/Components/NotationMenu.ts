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
                        <div class="player-name" id="black-player-name">
                            Black Player
                        </div> 
                        <div class="duration hidden" id="black-player-duration">
                            <div style="display: flex;align-items: end;">
                                <span class="minute-second">00:00</span> <small class="milliseconds">.00</small>
                            </div>
                        </div>
                        <div class="player-status">
                            <span class="status-icon" id="black-player-status"></span>
                        </div>
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
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.LastMove}" disabled="true" data-tooltip-text="Go Last Move">⟫</button>
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
                        <div class="player-name" id="white-player-name">
                            White Player
                        </div> 
                        <div class="duration hidden" id="white-player-duration">
                            <div style="display: flex;align-items: end;">
                                <span class="minute-second">00:00</span> <small class="milliseconds">.00</small>
                            </div>
                        </div>
                        <div class="player-status">
                            <span class="status-icon" id="white-player-status"></span>
                        </div>
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
     * @param force If force is true then the notation table will be updated
     * even if the notation is not changed.
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
    public displayNewGameUtilityMenu(): void
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
    public displayLobbyUtilityMenu(): void
    {
        const utilityMenuSections = document.querySelectorAll(".utility-toggle-menu-section") as NodeListOf<HTMLElement>;
        utilityMenuSections.forEach((section: HTMLElement) => {
            section.classList.remove("active");
        });

        document.getElementById(`lobby-utility-menu`)!.classList.add("active");
    }

    /**
     * Add white player name to the menu.
     */
    private displayWhitePlayerName(name: string): void
    {
        const whitePlayerName = document.getElementById(`white-player-name`)!;
        if(!whitePlayerName) return;
        whitePlayerName.textContent = name;
    }

    /**
     * Add black player name to the menu.
     */
    private displayBlackPlayerName(name: string): void
    {
        const blackPlayerName = document.getElementById(`black-player-name`)!;
        if(!blackPlayerName) return;
        blackPlayerName.textContent = name;
    }

    /**
     * Change the player status to online.
     */
    public updatePlayerAsOnline(color: Color): void
    {
        const playerStatus = document.getElementById(`${color.toLowerCase()}-player-status`)!;
        if(!playerStatus) return;
        playerStatus.classList.add("online");
        playerStatus.classList.remove("offline");
    }

    /**
     * Change the player status to offline.
     */
    public updatePlayerAsOffline(color: Color): void
    {
        const playerStatus = document.getElementById(`${color.toLowerCase()}-player-status`)!;
        if(!playerStatus) return;
        playerStatus.classList.add("offline");
        playerStatus.classList.remove("online");
    }

    /**
     * Display the white player duration on the notation menu.
     */
    private displayPlayerDurations(duration: [number, number]): void
    {
        (document.querySelectorAll(".duration") as NodeListOf<HTMLElement>).forEach((durationItem) => {
            durationItem.classList.remove("hidden");
            durationItem.textContent = duration[0].toString().concat(":", duration[1].toString());
        });
    }

    /**
     * Update the player names, durations and online status.
     */
    public updatePlayerCards(
        whitePlayer: {name: string, isOnline: boolean}, 
        blackPlayer: {name: string, isOnline: boolean}, 
        duration: [number, number] | null = null
    ): void
    {
        this.showPlayerCards();
        this.displayWhitePlayerName(whitePlayer.name);
        this.displayBlackPlayerName(blackPlayer.name);
        if(whitePlayer.isOnline) this.updatePlayerAsOnline(Color.White);
        else this.updatePlayerAsOffline(Color.White);
        if(blackPlayer.isOnline) this.updatePlayerAsOnline(Color.Black);
        else this.updatePlayerAsOffline(Color.Black);
        //if(duration) this.displayPlayerDurations(duration);
    }

    /**
     * Hide the player cards.
     */
    public hidePlayerCards(): void
    {
        (document.querySelectorAll(".player-section") as NodeListOf<HTMLElement>).forEach((playerCard) => {
            playerCard.classList.add("hidden");
        });
    }

    /**
     * Show the player cards.
     */
    public showPlayerCards(): void
    {
        (document.querySelectorAll(".player-section") as NodeListOf<HTMLElement>).forEach((playerCard) => {
            playerCard.classList.remove("hidden");
        });
    }

    /**
     * Start the given player duration.
     */
    public startPlayerDuration(color: Color): void
    {
        const playerDuration = document.getElementById(`${color.toLowerCase()}-player-duration`)!;
        playerDuration.classList.add("running");
    }

    /**
     * Stop the given player duration.
     */
    public stopPlayerDuration(color: Color): void
    {
        const playerDuration = document.getElementById(`${color.toLowerCase()}-player-duration`)!;
        playerDuration.classList.remove("running");
    }

    /**
     * Change the turn indicator to the given color.
     */
    public changeTurnIndicator(color: Color): void
    {
        document.querySelector(`.your-turn-effect`)?.classList.remove("your-turn-effect");
        document.getElementById(`${color.toLowerCase()}-player-section`)!.classList.add("your-turn-effect");
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        this.renderComponent();
        this.moveCount = 0;
        this.lastScore = {[Color.White]: 0, [Color.Black]: 0};
    }
}
