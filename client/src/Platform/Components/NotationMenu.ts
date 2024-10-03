import { Color, Durations, GameStatus, PieceType, Scores } from "@Chess/Types";
import { Component } from "./Component.ts";
import { Chess } from "@Chess/Chess.ts";
import { BoardEditorOperation, NavigatorModalOperation, NotationMenuOperation } from "../Types";
import { SocketOperation } from "../../Types";

/**
 * This class provide a table to show the notation.
 */
export class NotationMenu extends Component {
    private readonly chess: Chess;
    private moveCount: number = 0;
    private lastScore: Record<Color, number> = { [Color.White]: 0, [Color.Black]: 0 };
    private activeIntervalId: number = -1;

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
     * Get default new game utility menu content.
     */
    private getNewGameUtilityMenuContent(): string {
        return `<button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}" data-tooltip-text="Create New Game">+ New Game</button>`;
    }

    /**
     * Get default lobby utility menu content.
     */
    private getLobbyUtilityMenuContent(): string {
        return `
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendUndoOffer}" data-tooltip-text="Send Undo Offer">↺ Undo</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendDrawOffer}" data-tooltip-text="Send Draw Offer">Draw</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.Resign}" data-tooltip-text="Resign From Game">⚐ Resign</button>
        `;
    }

    /**
     * Get default play again utility menu content.
     */
    private getPlayAgainUtilityMenuContent(): string {
        return `
            <button data-menu-operation="${NotationMenuOperation.SendPlayAgainOffer}">Play Again</button>
            <button class="menu-item" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}" data-tooltip-text="Create New Game">+ New Game</button>
        `;
    }

    /**
     * Get default confirmation utility menu content.
     */
    private getConfirmationUtilityMenuContent(): string {
        return `
            <button class="menu-item hidden" data-socket-operation="${SocketOperation.CancelOffer}" data-tooltip-text="Cancel Offer">Cancel</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.GoBack}" data-tooltip-text="Go Back">Back</button>
            <button class="menu-item" id="confirm-button" data-socket-operation="" data-tooltip-text=""></button>
        `;
    }

    /**
     * Get default offer utility menu content.
     */
    private getOfferUtilityMenuContent(): string {
        return `
            <span class="offer-message"></span>
            <div class="offer-buttons">
                <button class="menu-item" data-socket-operation="${SocketOperation.DeclineSentOffer}" data-tooltip-text="Decline Offer">Decline</button>
                <button class="menu-item" id="accept-button" data-socket-operation="" data-tooltip-text=""></button>
            </div>
        `;
    }

    /**
     * This function render the notation table.
     */
    protected renderComponent(): void {
        this.loadHTML("notation-menu", `
                <div class="player-section your-turn-effect" id="black-player-section">
                    <div class="player-name-container">
                        <div class="player-name" id="black-player-name">
                            Black Player
                        </div> 
                        <div class="duration hidden" id="black-player-duration">
                            <div style="display: flex;align-items: end;">
                                <span class="minute-second">00:00</span> <small class="decisecond">.00</small>
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
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.ToggleUtilityMenu}">☰</button>
                    </div>
                    <div class="utility-menu utility-toggle-menu visible">
                        <div class="utility-toggle-menu-section active" id="new-game-utility-menu">
                            ${this.getNewGameUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section" id="lobby-utility-menu">
                            ${this.getLobbyUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section" id="play-again-utility-menu">
                            ${this.getPlayAgainUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section confirmation" id="confirmation-utility-menu">
                            ${this.getConfirmationUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section confirmation" id="offer-utility-menu">
                            ${this.getOfferUtilityMenuContent()}
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
                                <span class="minute-second">00:00</span> <small class="decisecond">.00</small>
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
    private addNotation(notations: ReadonlyArray<string>): void {
        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notationMenu: HTMLElement = document.getElementById("notations")!;
        if (notationMenu.innerHTML == "") {
            for (let i = 0; i < notations.length; i += 1) {
                const notationUnicoded = this.convertStringNotationToUnicodedNotation(notations[i]);
                if (i % 2 == 0) {
                    notationMenu.innerHTML +=
                        `
                        <tr>
                            <td>${(i / 2) + 1}</td>
                            <td>${notationUnicoded}</td>
                            <td></td>
                        </tr>
                    `;
                } else {
                    notationMenu.lastElementChild!.innerHTML = notationMenu.lastElementChild!.innerHTML.replace("<td></td>", "<td>" + notationUnicoded + "</td>");
                }
            }
        }
        else {
            const lastNotation: string = this.convertStringNotationToUnicodedNotation(notations[notations.length - 1]);
            const lastRow: HTMLElement = notationMenu.lastElementChild as HTMLElement;
            if (notations.length % 2 == 0)
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
    private setScore(scores: Scores): void {
        if (this.lastScore.White == scores.White.score && this.lastScore.Black == scores.Black.score)
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

        this.lastScore = { [Color.White]: whiteScore, [Color.Black]: blackScore };
    }

    /**
     * This function converts the string notation to unicode notation.
     * @example convertStringNotationToUnicodedNotation("Kf3") returns "&#9812;f3"
     */
    private convertStringNotationToUnicodedNotation(notation: string): string {
        if (notation.length <= 2 || notation == "O-O-O")
            return notation;

        const pieceInfo = notation[0].toUpperCase();
        switch (pieceInfo) {
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
    private getPieceUnicode(piece: PieceType | string): string {
        switch (piece) {
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
    private changeIndicator(): void {
        const current_player_color = this.chess.engine.getTurnColor();
        const previous_player_color = current_player_color == Color.White ? Color.Black : Color.White
        document.getElementById(`${previous_player_color.toLowerCase()}-player-section`)!.classList.remove("your-turn-effect");
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
     * This function opens/closes the utility menu.
     */
    private toggleUtilityMenu(): void {
        document.querySelector(`#notation-menu .utility-toggle-menu`)!.classList.toggle("visible");
    }

    /**
     * Show the new game utility menu section. This menu contains
     * new game and info buttons.
     */
    public displayNewGameUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML("new-game-utility-menu", this.getNewGameUtilityMenuContent());
        document.getElementById(`new-game-utility-menu`)!.classList.add("active");
    }

    /**
     * Show the lobby utility menu section. This menu contains
     * undo, draw and resign buttons.
     */
    public displayLobbyUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML("lobby-utility-menu", this.getLobbyUtilityMenuContent());
        document.getElementById(`lobby-utility-menu`)!.classList.add("active");
    }

    /**
     * Show the new game utility menu section. This menu contains
     * new game and play again buttons. This menu is shown when the
     * online game is finished.
     */
    public displayPlayAgainUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML("play-again-utility-menu", this.getPlayAgainUtilityMenuContent());
        document.getElementById(`play-again-utility-menu`)!.classList.add("active");
    }

    /**
     * Update the notation table and the score of the players.
     * @param force If force is true then the notation table will be updated
     * even if the notation is not changed.
     */
    public update(force: boolean = false): void {
        const moveCount = this.chess.engine.getMoveHistory().length;

        if ([
            GameStatus.WhiteVictory,
            GameStatus.BlackVictory,
            GameStatus.Draw
        ].includes(this.chess.engine.getGameStatus())){
            this.stopTimers();
            this.displayPlayAgainUtilityMenu();
        }

        if (!force && moveCount == 0 || moveCount == this.moveCount)
            return;

        this.setScore(this.chess.engine.getScores());
        this.addNotation(this.chess.engine.getAlgebraicNotation());
        this.changeIndicator();

        if ([
            GameStatus.WhiteInCheck,
            GameStatus.BlackInCheck,
            GameStatus.InPlay
        ].includes(this.chess.engine.getGameStatus())
            && moveCount >= 2
            && this.chess.engine.getDurations())
            this.startOrUpdateTimers();
    }

    /**
     * Update the player names, durations and online status.
     */
    public updatePlayerCards(
        whitePlayer: { name: string, isOnline: boolean },
        blackPlayer: { name: string, isOnline: boolean }
    ): void {
        this.showPlayerCards();
        this.displayWhitePlayerName(whitePlayer.name);
        this.displayBlackPlayerName(blackPlayer.name);

        if (whitePlayer.isOnline) this.updatePlayerAsOnline(Color.White);
        else this.updatePlayerAsOffline(Color.White);

        if (blackPlayer.isOnline) this.updatePlayerAsOnline(Color.Black);
        else this.updatePlayerAsOffline(Color.Black);

        this.showPlayerDurations();
    }

    /**
     * Add white player name to the menu.
     */
    private displayWhitePlayerName(name: string): void {
        const whitePlayerName = document.getElementById(`white-player-name`)!;
        if (!whitePlayerName) return;
        whitePlayerName.textContent = name;
    }

    /**
     * Add black player name to the menu.
     */
    private displayBlackPlayerName(name: string): void {
        const blackPlayerName = document.getElementById(`black-player-name`)!;
        if (!blackPlayerName) return;
        blackPlayerName.textContent = name;
    }

    /**
     * Change the player status to online.
     */
    public updatePlayerAsOnline(color: Color): void {
        const playerStatus = document.getElementById(`${color.toLowerCase()}-player-status`)!;
        if (!playerStatus) return;
        playerStatus.classList.add("online");
        playerStatus.classList.remove("offline");
    }

    /**
     * Change the player status to offline.
     */
    public updatePlayerAsOffline(color: Color): void {
        const playerStatus = document.getElementById(`${color.toLowerCase()}-player-status`)!;
        if (!playerStatus) return;
        playerStatus.classList.add("offline");
        playerStatus.classList.remove("online");
    }

    /**
     * Display the white player duration on the notation menu.
     */
    private showPlayerDurations(): void {
        if (!this.chess.engine.getDurations()) return;

        // White
        let milliseconds = Math.round(this.chess.engine.getPlayersRemainingTime()[Color.White]);
        let [minutes, seconds, _] = this.formatRemainingTimeForTimer(milliseconds);

        const whitePlayerDuration = document.getElementById("white-player-duration")!;
        whitePlayerDuration.classList.remove("hidden");
        whitePlayerDuration.querySelector(".minute-second")!.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        // Black
        milliseconds = Math.round(this.chess.engine.getPlayersRemainingTime()[Color.Black]);
        [minutes, seconds, _] = this.formatRemainingTimeForTimer(milliseconds);

        const blackPlayerDuration = document.getElementById("black-player-duration")!;
        blackPlayerDuration.classList.remove("hidden");
        blackPlayerDuration.querySelector(".minute-second")!.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    /**
     * Hide the player cards.
     */
    public hidePlayerCards(): void {
        (document.querySelectorAll(".player-section") as NodeListOf<HTMLElement>).forEach((playerCard) => {
            playerCard.classList.add("hidden");
        });
    }

    /**
     * Show the player cards.
     */
    public showPlayerCards(): void {
        (document.querySelectorAll(".player-section") as NodeListOf<HTMLElement>).forEach((playerCard) => {
            playerCard.classList.remove("hidden");
        });
    }

    /**
     * Start/Update the timers by starting the timer of the player
     * and stopping the timer of the opponent.
     */
    private startOrUpdateTimers(): void {
        this.stopOpponentTimerIfActive();
        this.startPlayerTimer(this.chess.engine.getTurnColor());
    }

    /**
     * Format the given milliseconds to the mm:ss format.
     * @returns [minutes, seconds, deciseconds]
     */
    private formatRemainingTimeForTimer(milliseconds: number): number[] {
        const totalDeciseconds = Math.floor(milliseconds / 100);
        const totalSeconds = Math.floor(totalDeciseconds / 10);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const deciseconds = totalDeciseconds % 10;
        return [minutes, seconds, deciseconds];
    }

    /**
     * Start the given player's timer by checking the remaining time
     * of the player in every 100 milliseconds from the engine.
     */
    private startPlayerTimer(color: Color): void {
        const playerTimer = document.getElementById(`${color.toLowerCase()}-player-duration`)!;
        const playerMinuteSecond = playerTimer.querySelector(".minute-second")!;
        const playerDecisecond = playerTimer.querySelector(".decisecond")!;

        let isDecisecondActive = false;
        this.activeIntervalId = window.setInterval(() => {
            const [minutes, seconds, deciseconds] = this.formatRemainingTimeForTimer(
                Math.round(this.chess.engine.getPlayersRemainingTime()[color])
            );

            playerMinuteSecond.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

            if (minutes <= 0 && seconds <= 10) {
                if (!isDecisecondActive) {
                    playerDecisecond.classList.add("active");
                    isDecisecondActive = true;
                }
                playerDecisecond.textContent = "." + deciseconds;
            }
        }, 100)
    }

    /**
     * Stop the oppenent's timer. Clearing the active
     * interval id is enough to stop the timer because
     * only one timer/interval can be active at a time.
     */
    private stopOpponentTimerIfActive(): void {
        if (this.activeIntervalId != -1)
            clearInterval(this.activeIntervalId);
    }

    /**
     * Stop the timer of the both players.
     */
    public stopTimers() {
        this.stopOpponentTimerIfActive();
    }

    /**
     * Set the turn indicator to the given color.
     */
    public setTurnIndicator(color: Color): void {
        document.querySelector(`.your-turn-effect`)?.classList.remove("your-turn-effect");
        document.getElementById(`${color.toLowerCase()}-player-section`)!.classList.add("your-turn-effect");
    }

    /**
     * This function clears the table.
     */
    public clear(): void {
        this.renderComponent();
        this.moveCount = 0;
        this.lastScore = { [Color.White]: 0, [Color.Black]: 0 };
    }

    /**
     * Ask for confirmation before resigning or sending draw offer.
     */
    private showConfirmation(
        confirmationOperation: NotationMenuOperation.Resign 
        | NotationMenuOperation.SendDrawOffer 
        | NotationMenuOperation.SendPlayAgainOffer
    ): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML("confirmation-utility-menu", this.getConfirmationUtilityMenuContent());

        const confirmationMenu = document.getElementById(`confirmation-utility-menu`)!;
        confirmationMenu.classList.add("active");

        const textContent = document.querySelector(`[data-menu-operation="${confirmationOperation}"]`)!.textContent;
        const tooltipText = document.querySelector(`[data-menu-operation="${confirmationOperation}"]`)!.getAttribute("data-tooltip-text")!;

        const confirmButton = confirmationMenu.querySelector("#confirm-button")!;
        confirmButton.textContent = textContent;
        confirmButton.setAttribute("data-tooltip-text", tooltipText);

        // This is a hacky way to set the operation to the button.
        // Since the operation is not a socket operation, but has
        // same value with the "correct" socket operation, we can
        // set the operation to the button and use it as a socket
        // operation. For example, SocketOperation.Resign="Resign" 
        // is equal to NotationMenuOperation.Resign="Resign" so we
        // can set the operation to the button and use it as a socket
        // operation.
        confirmButton.setAttribute("data-socket-operation", confirmationOperation);
    }

    /**
     * Show the offer menu with the given message and operation.
     */
    private _showOffer(
        offerMessage: string, 
        offerOperation: SocketOperation.AcceptDrawOffer | SocketOperation.AcceptPlayAgainOffer
    ): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML("offer-utility-menu", this.getOfferUtilityMenuContent());

        const offerMenu = document.getElementById(`offer-utility-menu`)!;
        offerMenu.classList.add("active");

        offerMenu.querySelector(".offer-message")!.textContent = offerMessage;

        const acceptButton = offerMenu.querySelector("#accept-button")!;
        acceptButton.textContent = "Accept";
        acceptButton.setAttribute("data-tooltip-text", "Accept Offer");
        acceptButton.setAttribute("data-socket-operation", offerOperation);
    }

    /**
     * Show the draw offer from the opponent. If the player accepts,
     * client will send the accepted message to the server. If the player
     * declines, client will send the declined message to the server. Shouldn't
     * be called without the offer coming from the server.
     */
    public showDrawOffer(): void {
        this._showOffer(
            "Opponent has offered a draw.",
            SocketOperation.AcceptDrawOffer
        );
    }

    /**
     * Show the play again offer screen that has 2 options to 
     * accept or decline. If the player accepts, client will send
     * the accepted message to the server. If the player declines,
     * client will send the declined message to the server. Shouldn't
     * be called without the offer coming from the server.
     */
    public showPlayAgainOffer(): void
    {
        this._showOffer(
            "Your opponet has offered to play again.",
            SocketOperation.AcceptPlayAgainOffer
        );
    }

    /**
     * Show the given message on the information menu.
     */
    public _showSentRequest(sentRequestButton: HTMLElement): void {
        if(!sentRequestButton) return;
        sentRequestButton.textContent = "Offered";
        sentRequestButton.setAttribute("disabled", "true");
        sentRequestButton.setAttribute("data-tooltip-text", "Opponent waiting...");
        
        const confirmationMenu = document.getElementById(`confirmation-utility-menu`)!;
        confirmationMenu.querySelector(`[data-menu-operation="${NotationMenuOperation.GoBack}"]`)!.classList.add("hidden");
        confirmationMenu.querySelector(`[data-socket-operation="${SocketOperation.CancelOffer}"]`)!.classList.remove("hidden");
    }

    /**
     * Show the given message on the information menu. This function
     * is a feedback for the player that the play again offer is sent.
     * This function should be called after the play again offer is sent.
     */
    public showPlayAgainOfferSent(): void {
        this._showSentRequest(document.querySelector(`[data-socket-operation="${SocketOperation.SendPlayAgainOffer}"]`)!);
    }

    /**
     * Show the given message on the information menu. This function
     * is a feedback for the player that the draw offer is sent.
     * This function should be called after the draw offer is sent.
     */
    public showDrawOfferSent(): void {
        this._showSentRequest(document.querySelector(`[data-socket-operation="${NotationMenuOperation.SendDrawOffer}"]`)!);
    }

    /**
     * Back to the previous menu. This function should be called
     * after the offer menu is opened and the player declines 
     * the offer or sender cancels the offer.
     */
    public goBack(): void {
        if(![GameStatus.BlackVictory, 
            GameStatus.WhiteVictory, 
            GameStatus.Draw
        ].includes(this.chess.engine.getGameStatus()))
            this.displayLobbyUtilityMenu();
        else 
            this.displayNewGameUtilityMenu();
    }

    /**
     * Handle the notation menu operation.
     */
    public handleOperation(operation: NotationMenuOperation): void {
        switch (operation) {
            case NotationMenuOperation.ToggleUtilityMenu:
                this.toggleUtilityMenu();
                break;
            case NotationMenuOperation.ShowLobbyUtilityMenu:
                this.displayLobbyUtilityMenu();
                break;
            case NotationMenuOperation.Resign:
                this.showConfirmation(NotationMenuOperation.Resign);
                break;
            case NotationMenuOperation.SendDrawOffer:
                this.showConfirmation(NotationMenuOperation.SendDrawOffer);
                break;
            case NotationMenuOperation.SendPlayAgainOffer:
                this.showConfirmation(NotationMenuOperation.SendPlayAgainOffer);
                break;
            case NotationMenuOperation.GoBack:
                this.goBack();
                break;
        }
    }
}
