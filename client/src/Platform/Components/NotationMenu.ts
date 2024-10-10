import { ChessEvent, Color, Durations, GameStatus, PieceType, Scores } from "@Chess/Types";
import { Component } from "./Component.ts";
import { Chess } from "@Chess/Chess.ts";
import { BoardEditorOperation, NavigatorModalOperation, NotationMenuOperation } from "../Types";
import { SocketOperation } from "../../Types";
import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage.ts";
import { NOTATION_MENU_ID } from "@Platform/Consts";

/**
 * This enum provides the utility menu types.
 */
enum UtilityMenuType{
    OnlineGame="online-game-utility-menu",
    SingleplayerGame="singleplayer-game-utility-menu",
    NewGame="new-game-utility-menu",
    PlayAgain="play-again-utility-menu",
    Confirmation="confirmation-utility-menu",
    Offer="offer-utility-menu"
}

/**
 * This class provide a table to show the notation.
 */
export class NotationMenu extends Component {
    private readonly chess: Chess;
    private moveCount: number = 0;
    private lastScore: Record<Color, number> = { [Color.White]: 0, [Color.Black]: 0 };
    private activeIntervalId: number = -1;
    private activeUtilityMenu: UtilityMenuType = UtilityMenuType.NewGame;
    private confirmedOperation: NotationMenuOperation | null = null;

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        super();
        this.chess = chess;
        this.loadCSS("notation-menu.css");
        this.renderComponent();
        this.loadLocalStorage();
        this.addShortcutListeners();
        document.addEventListener("DOMContentLoaded", () => {
            this.update(true);
        });
    }

    /**
     * Load the local storage data.
     */
    private loadLocalStorage(): void {
        if(LocalStorage.isExist(LocalStorageKey.BoardEditorEnabled))
            this.hidePlayerCards();

        if(LocalStorage.isExist(LocalStorageKey.LastBoard)){
            if(LocalStorage.isExist(LocalStorageKey.LastLobbyConnection))
                this.displayOnlineGameUtilityMenu();
            else
                this.displaySingleplayerGameUtilityMenu();
        }

        if(LocalStorage.isExist(LocalStorageKey.LastBot)){
            const {color, _} = LocalStorage.load(LocalStorageKey.LastBot);
            if(color === Color.White) this.flip();
        }
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
    private getOnlineGameUtilityMenuContent(): string {
        return `
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendUndoOffer}" data-tooltip-text="Send Undo Offer">↺ Undo</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendDrawOffer}" data-tooltip-text="Send Draw Offer">Draw</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.Resign}" data-tooltip-text="Resign From Game">⚐ Resign</button>
        `;
    }

    /**
     * Get default single player game utility menu content.
     */
    private getSingleplayerGameUtilityMenuContent(): string {
        return `
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.SendUndoOffer}" data-tooltip-text="Send Undo Offer">↺ Undo</button>
            <button class="menu-item" data-menu-operation="${NotationMenuOperation.Resign}" data-tooltip-text="Resign From Game">⚐ Resign</button>
        `;
    }

    /**
     * Get default play again utility menu content.
     */
    private getPlayAgainUtilityMenuContent(): string {
        return `
            <button class="menu-item" data-menu-operation="${
                this.activeUtilityMenu === UtilityMenuType.OnlineGame 
                    ? NotationMenuOperation.SendPlayAgainOffer 
                    : NotationMenuOperation.PlayAgain
                }" data-tooltip-text="Play Again from Same Start">Play Again</button>
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
            <button class="menu-item" id="confirm-button" data-socket-operation="" data-menu-operation="" data-tooltip-text=""></button>
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
     * Adds keyboard shortcuts for navigating the chess game.
     * - "ArrowRight" moves the game forward.
     * - "ArrowLeft" moves the game backward.
     * - "ArrowUp" jumps to the first move.
     * - "ArrowDown" jumps to the last move.
     */
    private addShortcutListeners(): void {
        document.addEventListener("keydown", (e) => {
            switch (e.key) {
                case "ArrowRight":
                    this.takeForward();
                    break;
                case "ArrowLeft":
                    this.takeBack();
                    break;
                case "ArrowUp":
                    this.goToFirstMove();
                    break;
                case "ArrowDown":
                    this.goToLastMove();
                    break;
            }
        });
    }

    /**
     * This function render the notation table.
     */
    protected renderComponent(): void {
        this.loadHTML(NOTATION_MENU_ID, `
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
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.FirstMove}" data-tooltip-text="Go First Move">⟪</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.PreviousMove}" data-tooltip-text="Go Previous Move">❮</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.NextMove}" data-tooltip-text="Go Next Move">❯</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.LastMove}" data-tooltip-text="Go Last Move">⟫</button>
                        <button class="menu-item" data-menu-operation="${NotationMenuOperation.ToggleUtilityMenu}">☰</button>
                    </div>
                    <div class="utility-menu utility-toggle-menu visible">
                        <div class="utility-toggle-menu-section active" id="${UtilityMenuType.NewGame}">
                            ${this.getNewGameUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section" id="${UtilityMenuType.OnlineGame}">
                            ${this.getOnlineGameUtilityMenuContent()}
                        </div>
                         <div class="utility-toggle-menu-section" id="${UtilityMenuType.SingleplayerGame}">
                            ${this.getSingleplayerGameUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section" id="${UtilityMenuType.PlayAgain}">
                            ${this.getPlayAgainUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section confirmation" id="${UtilityMenuType.Confirmation}">
                            ${this.getConfirmationUtilityMenuContent()}
                        </div>
                        <div class="utility-toggle-menu-section confirmation" id="${UtilityMenuType.Offer}">
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
     * This function returns the adjacent move of the given move.
     * 
     * @param {number} increment The increment value. 
     * If the current notation element is given then the function
     * returns the adjacent move of the given notation element by
     * using the increment value. If the current notation element
     * is not given then the function returns the last move if the
     * increment value is < 0, or the first move if the increment value 
     * is >= 0. 
     * 
     * @param {HTMLElement|null} currentNotationElement The current notation element.
     * If the current notation element is given then the function
     * returns the adjacent move of the given notation element by
     * using the increment value. If the current notation element
     * is not given then the function returns the last move or the
     * first move according to the increment value. If there is no adjacent 
     * move then the function returns null.
     */
    private getAdjacentMove(
        increment: number, 
        currentNotationElement: HTMLElement | null = null
    ): HTMLElement | null {
        const notations = document.getElementById("notations")!;
        if(increment < 0 && !currentNotationElement) {
            return notations.querySelector("tr:last-child td:last-child:has(.move)")
                || notations.querySelector("tr:last-child td:nth-child(2):has(.move)");
        } else if(increment >= 0 && !currentNotationElement) {
            return document.querySelector("#notations tr:first-child td:nth-child(2)");
        }

        if(!currentNotationElement)
            return null;

        const moves = Array.from(
            document.getElementById("notations")!.querySelectorAll("td:has(.move)")
        );
        if(moves.length == 0) return null;

        const index = moves.indexOf(currentNotationElement);
        if(index == -1) return null;

        return (index + increment >= 0 && moves.length > index + increment) 
            ? (moves[index + increment] as HTMLElement)
            : null;
    }

    /**
     * This function adds a row/notation to the table.
     */
    private addNotation(notations: ReadonlyArray<string>): void {
        /**
         * This function formats the unicode notation for adding to 
         * the table notation. For example, if the notation is "&#9812;f3"
         * then the function will return "<span class="piece-icon">&#9812;</span><span class="move">f3</span>".
         * If the notation is "f3" then the function will return "<span class="move">f3</span>".
         */
        const formatUnicodeNotation = (notation: string): string => {
            if (notation.startsWith("&")) {
                return `<span class="piece-icon">${notation.slice(0, 7)}</span><span class="move">${notation.slice(7)}</span>`;
            }

            return `<span class="move">${notation}</span>`;
        }

        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notationMenu: HTMLElement = document.getElementById("notations")!;
        if (notationMenu.innerHTML == "") {
            for (let i = 0; i < notations.length; i += 1) {
                const notationUnicoded = formatUnicodeNotation(
                    this.convertStringNotationToUnicodedNotation(notations[i])
                );
                if (i % 2 == 0) {
                    notationMenu.innerHTML +=
                        `
                        <tr>
                            <td><span>${(i / 2) + 1}</span></td>
                            <td>${notationUnicoded}</td>
                            <td></td>
                        </tr>
                    `;
                } else {
                    notationMenu.lastElementChild!.innerHTML = notationMenu.lastElementChild!.innerHTML.replace("<td></td>", `<td>${notationUnicoded}</td>`);
                }
            }

            notationMenu.addEventListener("click", (event) => {
                if(event.target instanceof HTMLElement && event.target.closest("td")) {
                    const clickedNotation = event.target.closest("td") as HTMLTableCellElement;
                    if(!clickedNotation.querySelector(".move")) return;
                    this.chess.goToSpecificMove(
                        Array.from(
                            notationMenu.querySelectorAll("td:not(td:first-child)")
                        ).indexOf(clickedNotation)
                    );
                    this.showNotationAsCurrent(clickedNotation);
                    this.setScore(this.chess.getScores());
                }
            });
        }
        else {
            const lastNotation: string = formatUnicodeNotation(
                this.convertStringNotationToUnicodedNotation(notations[notations.length - 1])
            );
            const lastRow: HTMLElement = notationMenu.lastElementChild as HTMLElement;
            if (notations.length % 2 == 0)
                lastRow.innerHTML = lastRow.innerHTML.replace(`<td></td>`, `<td>${lastNotation}</td>`);
            else
                lastRow.insertAdjacentHTML(
                    "afterend",
                    `<tr><td><span>${Math.ceil(notations.length / 2)}</span></td><td>${lastNotation}</td><td></td></tr>`
                );
        }

        this.showNotationAsCurrent();

        const notationTable: HTMLElement = document.getElementById("notation-table")!.querySelector("tbody")!;
        setTimeout(() => {
            notationTable.scrollTop = notationTable.scrollHeight;
        }, 0);

        this.moveCount = notations.length;
    }

    /**
     * This function takes one move back from the current move. Only
     * on the board doesn't affect the game state.
     */
    private takeBack(): void {
        const previousMoveElement = this.getAdjacentMove(-1, document.querySelector(".current-move") as HTMLElement);
        if(previousMoveElement) {
            this.showNotationAsCurrent(previousMoveElement);
            const notationTable: HTMLElement = document.getElementById("notation-table")!.querySelector("tbody")!;
            const previousMoveElementRect = previousMoveElement.getBoundingClientRect();
            if(previousMoveElementRect.top <= notationTable.getBoundingClientRect().top) {
                notationTable.scrollTop -= previousMoveElementRect.height;
            }
            this.chess.takeBack();
        }
    }

    /**
     * This function takes one move forward from the current move. Only
     * on the board doesn't affect the game state.
     */
    private takeForward(): void {
        const nextMoveElement = this.getAdjacentMove(1, document.querySelector(".current-move") as HTMLElement);
        if(nextMoveElement) {
            this.showNotationAsCurrent(nextMoveElement);
            const notationTable: HTMLElement = document.getElementById("notation-table")!.querySelector("tbody")!;
            const nextMoveElementRect = nextMoveElement.getBoundingClientRect();
            if(nextMoveElementRect.top + nextMoveElementRect.height > notationTable.getBoundingClientRect().bottom) {
                notationTable.scrollTop += nextMoveElementRect.height;
            }
            this.chess.takeForward();
        }
    }

    /**
     * This function goes to the first move of the game. Only
     * on the board doesn't affect the game state.
     */
    private goToFirstMove(): void {
        this.showNotationAsCurrent(this.getAdjacentMove(0));
        document.getElementById("notation-table")!.querySelector("tbody")!.scrollTop = 0;
        this.chess.goToSpecificMove(0);
    }

    /**
     * This function goes to the last move of the game. Only
     * on the board doesn't affect the game state.
     */
    private goToLastMove(): void {
        this.showNotationAsCurrent();
        const notationTable: HTMLElement = document.getElementById("notation-table")!.querySelector("tbody")!;
        notationTable.scrollTop = notationTable.scrollHeight;
        this.chess.goToSpecificMove(this.chess.engine.getMoveHistory().length - 1);
    }

    /**
     * This function shows the given notation as the current move.
     * 
     * @param {HTMLElement|null} notationTd The notation td element.
     * This function shows the last notation that has a move 
     * as the current move if the notationTd is not given. If 
     * the notationTd is given then the given notationTd will be 
     * shown as the current move.
     */
    private showNotationAsCurrent(notationTd: HTMLElement | null = null): void {
        document.querySelector(".current-move")?.classList.remove("current-move");

        // Add current move effect to the last notation.
        // First td is the move number, second td is the white move,
        // and the last td is the black move. Since there is 3 td 
        // in the row, and the last td that has a move must be the 
        // current/last move.
        if(!notationTd) {
            this.getAdjacentMove(-1)!.classList.add("current-move");
        } else {
            notationTd.classList.add("current-move");
        }
    }

    /**
     * This function shows the score of the players top and bottom of the table.
     */
    private setScore(scores: Scores): void {
        if (this.lastScore.White == scores.White.score && this.lastScore.Black == scores.Black.score)
            return;

        /**
         * Piece Icons
         */
        const blackCapturedPieces = document.getElementById("black-captured-pieces")!;
        blackCapturedPieces.innerHTML = "";

        const whiteCapturedPieces = document.getElementById("white-captured-pieces")!;
        whiteCapturedPieces.innerHTML = "";

        /**
         * This function adds the piece icon to the captured pieces section
         * by sorting the pieces according to their unicode code.
         * For example, if the pieces are [Pawn, Rook, Queen] then the
         * order of the pieces will be Queen, Rook, Pawn.
         */
        const addPieceIconSorted = (pieces: PieceType[], color: Color) => {
            if (pieces.length === 0)
                return;

            const capturedPieces = color == Color.White ? whiteCapturedPieces : blackCapturedPieces;
            pieces.sort((a, b) => this.getPieceUnicode(a).localeCompare(this.getPieceUnicode(b)));
            pieces.forEach((piece) => {
                const pieceUnicodeIcon = this.getPieceUnicode(piece);
                if (capturedPieces.querySelectorAll(".piece-icon").length === 0) {
                    capturedPieces.innerHTML = `<div class="piece-icon">${pieceUnicodeIcon}</div>`
                } else {
                    capturedPieces.innerHTML += `<div class="piece-icon">${pieceUnicodeIcon}</div>`;
                }
            });
        }

        addPieceIconSorted(scores[Color.White].pieces, Color.Black);
        addPieceIconSorted(scores[Color.Black].pieces, Color.White);

        /**
         * Scores
         */
        const whiteScore = scores[Color.White].score;
        const blackScore = scores[Color.Black].score;

        const blackScoreElement = blackCapturedPieces.querySelector(".score");
        const whiteScoreElement = whiteCapturedPieces.querySelector(".score");

        /**
         * This function adds the score to the score table.
         */
        const addScore = (score: number, color: Color) => {
            const capturedPieces = color == Color.White ? whiteCapturedPieces : blackCapturedPieces;
            const scoreElement = color == Color.White ? whiteScoreElement : blackScoreElement;
            if (!scoreElement)
                capturedPieces.innerHTML += score <= 0 ? "" : " " + `<div class="score">+${score}</div>`;
            else 
                scoreElement.textContent = `+${score}`;
        }

        addScore(whiteScore, Color.Black);
        addScore(blackScore, Color.White);

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
        document.querySelector(`#${NOTATION_MENU_ID} .utility-toggle-menu`)!.classList.toggle("visible");
    }

    /**
     * Show the new game utility menu section. This menu contains
     * new game and info buttons.
     */
    public displayNewGameUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.NewGame, this.getNewGameUtilityMenuContent());
        document.getElementById(UtilityMenuType.NewGame)!.classList.add("active");
        this.activeUtilityMenu = UtilityMenuType.NewGame;
    }

    /**
     * Show the online game utility menu section. This menu contains
     * undo, draw and resign buttons.
     */
    public displayOnlineGameUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.OnlineGame, this.getOnlineGameUtilityMenuContent());
        document.getElementById(UtilityMenuType.OnlineGame)!.classList.add("active");
        this.activeUtilityMenu = UtilityMenuType.OnlineGame;
    }

    /**
     * Show the single player game utility menu section. This menu contains
     * undo and resign buttons.
     */
    public displaySingleplayerGameUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.SingleplayerGame, this.getSingleplayerGameUtilityMenuContent());
        document.getElementById(UtilityMenuType.SingleplayerGame)!.classList.add("active");
        this.activeUtilityMenu = UtilityMenuType.SingleplayerGame;
    }
    
    /**
     * Show the new game utility menu section. This menu contains
     * new game and play again buttons. This menu is shown when the
     * online game is finished.
     */
    public displayPlayAgainUtilityMenu(): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.PlayAgain, this.getPlayAgainUtilityMenuContent());
        document.getElementById(UtilityMenuType.PlayAgain)!.classList.add("active");
        this.activeUtilityMenu = UtilityMenuType.PlayAgain;
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
        this.activeIntervalId = setInterval(() => {
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
        }, 100) as unknown as number;
        console.log("startPlayerTimer: ", this.activeIntervalId);
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
     * Set the given operation as the confirmed operation.
     */
    private confirmOperation(operation: NotationMenuOperation): void {
        this.confirmedOperation = operation;
    }

    /**
     * Check if the given operation is confirmed.
     */
    public isOperationConfirmed(operation: NotationMenuOperation): boolean {
        return this.confirmedOperation === operation;
    }

    /**
     * Clear the confirmed operation.
     */
    public clearConfirmedOperation(): void {
        this.confirmedOperation = null;
    }

    /**
     * Ask for confirmation before resigning or sending draw offer.
     */
    private showConfirmation(
        confirmationOperation: NotationMenuOperation.Resign 
        | NotationMenuOperation.SendDrawOffer 
        | NotationMenuOperation.SendPlayAgainOffer
    ): void {
        if(this.isOperationConfirmed(confirmationOperation))
            return;
        
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.Confirmation, this.getConfirmationUtilityMenuContent());
    
        const confirmationMenu = document.getElementById(UtilityMenuType.Confirmation)!;
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
        setTimeout(() => {
            confirmButton.setAttribute(
                this.activeUtilityMenu === UtilityMenuType.OnlineGame 
                    ? "data-socket-operation"
                    : "data-menu-operation",
                confirmationOperation
            );
            this.confirmOperation(confirmationOperation);
        }, 0);
    }

    /**
     * Show the offer menu with the given message and operation.
     */
    private _showOffer(
        offerMessage: string, 
        offerOperation: SocketOperation.AcceptDrawOffer | SocketOperation.AcceptPlayAgainOffer
    ): void {
        document.querySelector(".utility-toggle-menu-section.active")!.classList.remove("active");
        this.loadHTML(UtilityMenuType.Offer, this.getOfferUtilityMenuContent());

        const offerMenu = document.getElementById(UtilityMenuType.Offer)!;
        offerMenu.classList.add("active");

        offerMenu.querySelector(".offer-message")!.textContent = offerMessage;

        const acceptButton = offerMenu.querySelector("#accept-button")!;
        acceptButton.textContent = "Accept";
        acceptButton.setAttribute("data-tooltip-text", "Accept Offer");
        acceptButton.setAttribute(
            this.activeUtilityMenu === UtilityMenuType.OnlineGame 
                ? "data-socket-operation"
                : "data-menu-operation", 
            offerOperation
        );
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
        
        const confirmationMenu = document.getElementById(UtilityMenuType.Confirmation)!;
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
        switch (this.activeUtilityMenu) {
            case UtilityMenuType.NewGame:
                this.displayNewGameUtilityMenu();
                break;
            case UtilityMenuType.SingleplayerGame:
                this.displaySingleplayerGameUtilityMenu();
                break;
            case UtilityMenuType.OnlineGame:
                this.displayOnlineGameUtilityMenu();
                break;
            case UtilityMenuType.PlayAgain:
                this.displayPlayAgainUtilityMenu();
                break;
        }
        
        this.clearConfirmedOperation();
    }

    /**
     * Handle the notation menu operation.
     */
    public handleOperation(operation: NotationMenuOperation): void {
        switch (operation) {
            case NotationMenuOperation.PreviousMove:
                this.takeBack();
                break;
            case NotationMenuOperation.NextMove:
                this.takeForward();
                break;
            case NotationMenuOperation.FirstMove:
                this.goToFirstMove();
                break;
            case NotationMenuOperation.LastMove:
                this.goToLastMove();
                break;
            /*case NotationMenuOperation.SendUndoOffer:
                this.chess.sendUndoOffer();
                break;
            */
            case NotationMenuOperation.ToggleUtilityMenu:
                this.toggleUtilityMenu();
                break;
            case NotationMenuOperation.ShowOnlineGameUtilityMenu:
                this.displayOnlineGameUtilityMenu();
                break;
            case NotationMenuOperation.ShowSingleplayerGameUtilityMenu:
                this.displaySingleplayerGameUtilityMenu();
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
