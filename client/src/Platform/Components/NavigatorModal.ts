import { LocalStorage, LocalStorageKey } from "@Services/LocalStorage";
import { SocketOperation } from "../../Types";
import { BoardEditorOperation, NavigatorModalOperation } from "../Types";
import { Component } from "./Component";
import { Color, Duration, GameStatus, StartPosition } from "@Chess/Types";
import { BotColor, BotDifficulty } from "@Chess/Bot";
import { 
    DEFULT_PLAYER_NAME,
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    DEFAULT_TOTAL_TIME,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    DEFAULT_INCREMENT_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME,
    NAVIGATOR_MODAL_ID
} from "@Platform/Consts";

/**
 * This class provide a menu to show the logs.
 */
export class NavigatorModal extends Component{
    private lastNavigatorModalTitle: string = "";
    private lastNavigatorModalContent: string = "";
    private lastCreatedBoard: string = StartPosition.Standard;
    private lastEnteredPlayerName: string = DEFULT_PLAYER_NAME;
    private lastSelectedBotDifficulty: BotDifficulty = BotDifficulty.Easy;
    private lastSelectedBotColor: BotColor = BotColor.Black;
    private lastSelectedDuration: Duration = {
        remaining: DEFAULT_TOTAL_TIME,
        increment: DEFAULT_INCREMENT_TIME
    };
    
    /**
     * Constructor of the NavigatorModal class.
     */
    constructor() {
        super();
        this.loadCSS("navigator-modal.css");
    }

    /**
     * This function renders the navigator modal.
     */
    protected renderComponent(): void
    {
        this.loadHTML(NAVIGATOR_MODAL_ID, `
            <div class="navigator-modal navigator-modal--glass">
                <div class="navigator-modal-bg">
                    <img src="./assets/images/result-screen-bg-icon.png" alt="Chessboard">
                </div>
                <div class="navigator-modal-title"></div>
                <div class="navigator-modal-content"></div>
            </div>
        `);
    }

    /**
     * Close the modal when the user clicks outside of the active modal.
     */
    private close(event: MouseEvent): void {
        const activeModal = document.querySelector('.navigator-modal')! as HTMLElement;
        if(!activeModal) 
            return;

        if(!(event.target as HTMLElement).closest(".navigator-modal")){
            if(activeModal.classList.contains("closeable"))
                this.hide();
        }   
    }

    /**
     * Add the backdrop to the modal.
     */
    private showModalBackdrop(): void
    {
        let modalBgLayer = document.querySelector(".navigator-modal-bg-layer")!
        if(!modalBgLayer){
            modalBgLayer = document.createElement("div");
            modalBgLayer.classList.add("navigator-modal-bg-layer");
            document.body.appendChild(modalBgLayer);
            modalBgLayer.classList.add("show");
        }
    }

    /**
     * Remove the backdrop from the modal.
     */
    private hideModalBackdrop(): void
    {
        const modalBgLayer = document.querySelector(".navigator-modal-bg-layer");
        if(modalBgLayer) modalBgLayer.remove();
    }
    
    /**
     * Show the modal with the given title and content.
     */
    private show(title: string, content: string, closeable: boolean = false, backdrop: boolean = true): void
    {
        this.hide();
        window.scrollTo(0, 0);

        this.loadHTML(NAVIGATOR_MODAL_ID, `
            <div class="navigator-modal ${backdrop ? "navigator-modal--glass" : ""} ${closeable ? "closeable" : ""}">
                <div class="navigator-modal-bg"></div>
                <div class="navigator-modal-title">${title}</div>
                <div class="navigator-modal-content">${content}</div>
            </div>
        `);

        const modal = document.querySelector('.navigator-modal')! as HTMLElement;

        if(backdrop){
            this.showModalBackdrop();
        } else {
            // center the modal to the chessboard if it is not backdrop.
            const chessboard = document.getElementById("chessboard") as HTMLElement;
            modal.style.left = `${chessboard.offsetLeft + chessboard.offsetWidth / 2 - modal.offsetWidth / 2}px`;
            modal.style.top = `${chessboard.offsetTop + chessboard.offsetWidth / 2 - modal.offsetHeight / 2}px`;
        }

        setTimeout(() => {
            document.addEventListener("click", this.close.bind(this));
        }, 0);  

        // For go back to the previous state of the modal.
        if(!modal.querySelector(".navigator-modal-content #confirmation")){
            this.lastNavigatorModalTitle = title;
            this.lastNavigatorModalContent = content;
        }
    }

    /**
     * Hide the modal.
     */
    public hide(): void
    {
        const navigatorModal = document.querySelector('.navigator-modal');
        if(!navigatorModal) return;
        navigatorModal.remove();
        this.hideModalBackdrop();
    }

    /**
     * Go back to the previous state of the modal.
     */
    public undo(): void
    {
        document.querySelector('.navigator-modal-title')!.innerHTML = this.lastNavigatorModalTitle;
        document.querySelector('.navigator-modal-content')!.innerHTML = this.lastNavigatorModalContent;
    }

    /**
     * Show the game over screen.
     */
    public showGameOver(status: GameStatus): void
    {
        const gameOverMessage = document.querySelector('.navigator-modal .game-over-message');
        
        this.show(
            status === GameStatus.WhiteVictory 
                ? "White Wins" 
                : (status === GameStatus.BlackVictory ? "Black Wins" : "Stalemate"),
            `
            <span class="game-over-message">${gameOverMessage ? gameOverMessage.textContent : ""}</span>
            `,
            true,
            false
        );

        if(gameOverMessage) 
            gameOverMessage.textContent = "";
    }

    /**
     * Show the game over screen when one of the players
     * resigned. This is going to modify the content of the
     * game over screen to show the resigned player.
     */
    public showGameOverAsResigned(resignColor: Color): void 
    {
        document.querySelector('.navigator-modal .game-over-message')!.textContent = `
            ${resignColor === Color.White ? Color.White : Color.Black} has resigned
        `;
    }

    /**
     * Show the game over screen when both players
     * accepted the draw. This is going to modify the 
     * content of the game over screen to show the draw 
     * accepted message.
     */
    public showGameOverAsDrawAccepted(): void
    {
        document.querySelector('.navigator-modal .game-over-message')!.textContent = `Draw accepted`;
    }

    /**
     * Show the board not ready screen.
     */
    public showBoardNotReady(): void
    {
        this.show(
            "Not Ready",
            `<span>There might be missing pieces like kings. Please create playable board.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Ok
                </button>
            </div>`
        );
    }

    /**
     * Show the game creator.
     */
    public showGameCreator(): void
    {
        this.lastCreatedBoard = StartPosition.Standard;
        this.show(
            "Create New Game",
            `
            <div class = "btn-group-vertical">
                <button data-menu-operation="${NavigatorModalOperation.ShowSelectDuration}">Play against Friend</button>
                <button data-menu-operation="${NavigatorModalOperation.ShowPlayAgainstBot}">Play against Bot</button>
                <button data-menu-operation="${BoardEditorOperation.Enable}">Create Board</button>
            </div>
             <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the play the board screen.
     */
    public showStartPlayingBoard(board: string): void
    {
        this.lastCreatedBoard = board;
        this.show(
            "Start Playing the Board",
            `
            <div class = "btn-group-vertical">
                <button data-menu-operation="${NavigatorModalOperation.ShowSelectDuration}">Play against Friend</button>
                <button data-menu-operation="${NavigatorModalOperation.ShowPlayAgainstBot}">Play against Bot</button>
                <button data-menu-operation="${NavigatorModalOperation.PlayByYourself}">Play by Yourself</button>
            </div>
             <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the select game duration screen.
     */
    private showSelectDuration(): void
    {
        this.show(
            "Select Game Duration",
            `<span>Select the total and increment time:</span>
            <div class="btn-group-grid" id="select-duration" style="padding-top:5px;padding-bottom:15px;">
                <button data-selected="false"><span class="total-time">1</span> + <span class="increment-time">0</span></button>
                <button data-selected="false"><span class="total-time">1</span> + <span class="increment-time">1</span></button>
                <button data-selected="false"><span class="total-time">2</span> + <span class="increment-time">1</span></button>
                <button data-selected="false"><span class="total-time">3</span> + <span class="increment-time">0</span></button>
                <button data-selected="false"><span class="total-time">3</span> + <span class="increment-time">2</span></button>
                <button data-selected="false"><span class="total-time">5</span> + <span class="increment-time">0</span></button>
                <button data-selected="false"><span class="total-time">10</span> + <span class="increment-time">0</span></button>
                <button data-selected="false"><span class="total-time">30</span> + <span class="increment-time">0</span></button>
                <button data-menu-operation="${NavigatorModalOperation.ShowSelectDurationCustom}">Custom</button>
            </div>
            <button type="submit" data-menu-operation="${NavigatorModalOperation.ShowCreateLobby}">Next</button>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the select custom duration screen.
     */
    private showSelectDurationCustom(): void
    {
        this.show(
            "Enter Game Duration",
            `<span>Enter the total and increment time:</span>
            <div class="btn-group-horizontal" style="padding-top:5px;padding-bottom:15px;justify-content:center;">
                <input type="number" id="total-time" placeholder="Min" min="${MIN_TOTAL_TIME / 60000}" max="${MAX_TOTAL_TIME / 60000}" required>
                <span style="font-size:var(--navigator-modal-content-duration-separator-font-size);padding:0 10px;">+</span>
                <input type="number" id="increment-time" placeholder="Sec" value="${MIN_INCREMENT_TIME / 1000}" min="${MIN_INCREMENT_TIME / 1000}" max="${MAX_INCREMENT_TIME / 1000}" required>
            </div>
            <button type="submit" data-menu-operation="${NavigatorModalOperation.ShowCreateLobby}">Next</button>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.ShowSelectDuration}">
                    Back
                </button>
            </div>
            `
        );
    }

    /**
     * Show the create lobby screen.
     */
    private showCreateLobby(): void
    {
        this.show(
            "Create a Lobby",
            `<span>Enter your name: </span>
            <div class="input-group" style="padding-top:5px;padding-bottom:5px;">
                <input type="text" id="player-name" placeholder="Your Name" value="${
                    LocalStorage.isExist(LocalStorageKey.LastPlayerName) 
                        ? LocalStorage.load(LocalStorageKey.LastPlayerName) 
                        : ""
                }" maxlength="${MAX_PLAYER_NAME_LENGTH}" minlength="${MIN_PLAYER_NAME_LENGTH}" required>
                <button type="submit" data-socket-operation="${SocketOperation.CreateLobby}">Create</button>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
        `);
    }

    /**
     * Show the join lobby screen.
     */
    public showJoinLobby(): void
    {
        this.show(
            "Join a Lobby",
            `<span>Enter your name: </span>
            <div class="input-group" style="padding-top:5px;padding-bottom:5px;">
                <input type="text" id="player-name" placeholder="Your Name" value="${
                    LocalStorage.isExist(LocalStorageKey.LastPlayerName) 
                        ? LocalStorage.load(LocalStorageKey.LastPlayerName) 
                        : ""
                }" maxlength="${MAX_PLAYER_NAME_LENGTH}" minlength="${MIN_PLAYER_NAME_LENGTH}" required>
                <button type="submit" data-socket-operation="${SocketOperation.JoinLobby}">Play</button>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
        `);
    }

    /**
     * Show the created lobby info.
     */
    public showLobbyInfo(lobbyLink: string): void
    {
        this.show(
            "Ready to Play",
            `<div class = "input-group" style="padding-bottom:5px;">
                <input type="text" id="lobby-link" placeholder="Lobby Name" value="${lobbyLink}" readonly>
                <button data-clipboard-text="lobby-link">Copy</button>
            </div>
            <span>Share this lobby link with your friend to play together.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.AskConfirmation}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the play against bot screen. This screen
     * will allow the user to select the difficulty level
     * of the bot.
     */
    private showPlayAgainstBot(): void
    {
        this.show(
            "Play against Bot",
            `<span>Select the difficulty level of the bot:</span>
            <div class="btn-group-horizontal btn-group-horizontal--triple" style="padding-top:5px;padding-bottom:15px;">
                <button data-selected="false" data-bot-difficulty="${BotDifficulty.Easy}">Easy</button>
                <button data-selected="false" data-bot-difficulty="${BotDifficulty.Medium}">Medium</button>
                <button data-selected="false" data-bot-difficulty="${BotDifficulty.Hard}">Hard</button>
            </div>
            <button type="submit" data-menu-operation="${NavigatorModalOperation.ShowSelectColorAgainsBot}">Next</button>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the select color against bot screen.
     */
    private showSelectColorAgainstBot(): void
    {
        this.show(
            "Play against Bot",
            `<span>Select the color of the bot:</span>
            <div class="btn-group-horizontal btn-group-horizontal--triple" style="padding-top:5px;padding-bottom:15px;">
                <button data-selected="false" data-bot-color="${BotColor.Black}">Black</button>
                <button data-selected="false" data-bot-color="${BotColor.Random}">Random</button>
                <button data-selected="false" data-bot-color="${BotColor.White}">White</button>
            </div>
            <button type="submit" data-menu-operation="${NavigatorModalOperation.PlayAgainstBot}">Play</button>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the confirmation screen.
     */
    private showConfirmation(): void
    {
        this.show(
            "Confirmation",
            `<div id = "confirmation">Are you sure you want to cancel the game?
            <br> <br> 
            <div class="btn-group-vertical">
                <button data-menu-operation="${NavigatorModalOperation.Undo}">Continue Playing</button>
                <button style="background-color:transparent" data-socket-operation="${SocketOperation.CancelLobby}">Yes, Cancel the Game</button>
            </div></div>`
        );
    }

    /**
     * Show error screen.
     */
    public showError(message: string, okButton: boolean = true): void
    {
        this.show(
            "Something Went Wrong",
            `<span>${message}</span>
            <div style="text-align:center;margin-top:10px;">
                ${okButton ? `<button data-menu-operation="${NavigatorModalOperation.Hide}">Ok</button>` : ""}
            </div>
            `
        );
        document.querySelector('.navigator-modal')!.classList.add("navigator-modal--error");
    }

    /**
     * Get the selected difficulty level of the bot.
     * If the play against bot modal is open.
     */
    private saveSelectedBotDifficulty(): void
    {
        const selectedButton = document.querySelector(".navigator-modal button[data-selected='true'][data-bot-difficulty]");
        if(!selectedButton) return;
        this.lastSelectedBotDifficulty = parseInt(selectedButton.getAttribute("data-bot-difficulty")!) as BotDifficulty;
    }

    /**
     * Get the selected color of the bot.
     * If the play against bot modal is open.
     */
    private saveSelectedBotColor(): void
    {
        const selectedButton = document.querySelector(".navigator-modal button[data-selected='true'][data-bot-color]");
        if(!selectedButton) return;
        this.lastSelectedBotColor = selectedButton.getAttribute("data-bot-color")! as BotColor
    }

    /**
     * Get the created bot settings from the modal.
     */
    public getCreatedBotSettings(): {botColor: BotColor, botDifficulty: BotDifficulty}
    {
        this.saveSelectedBotColor();
        
        return {
            botColor: this.lastSelectedBotColor,
            botDifficulty: this.lastSelectedBotDifficulty
        };
    }

    /**
     * Get the entered player name from the 
     * modal. If the player name modal is open.
     * 
     * @returns Must be between MIN_PLAYER_NAME_LENGTH and MAX_PLAYER_NAME_LENGTH
     * characters. If not, it will be DEFULT_PLAYER_NAME.
     */
    public getEnteredPlayerName(): string
    {
        let playerName = (document.getElementById("navigator-modal")!.querySelector("#player-name") as HTMLInputElement).value;
        if(playerName.length < MIN_PLAYER_NAME_LENGTH || playerName.length > MAX_PLAYER_NAME_LENGTH)
            this.lastEnteredPlayerName = DEFULT_PLAYER_NAME;

        return this.lastEnteredPlayerName;
    }

    /**
     * Get the selected game duration from the
     * modal. If the select duration modal is open.
     * 
     * @returns Must be between MIN_TOTAL_TIME and MAX_TOTAL_TIME
     * minutes for total time and MIN_INCREMENT_TIME and MAX_INCREMENT_TIME
     * seconds for increment time. If not, it will be DEFAULT_TOTAL_TIME
     * and DEFAULT_INCREMENT_TIME.
     */
    private saveSelectedGameDuration(): void
    {
        /**
         * Convert minutes to milliseconds.
         */
        const minutesToMilliseconds = (minutes: number) => { 
            return minutes * 60000;
        }

        /**
         * Convert seconds to milliseconds.
         */
        const secondsToMilliseconds = (seconds: number) => {
            return seconds * 1000;
        }

        const isCustomDurationModalOpen = document.querySelector(
            `[data-menu-operation="${NavigatorModalOperation.ShowSelectDurationCustom}"]
        `) ? false : true;

        let totalTime, incrementTime;
        if(isCustomDurationModalOpen){
            const totalTimeInput = document.querySelector(".navigator-modal #total-time") as HTMLInputElement;
            const incrementTimeInput = (document.querySelector(".navigator-modal #increment-time") as HTMLInputElement);
            if(totalTimeInput) totalTime = totalTimeInput.valueAsNumber;
            if(incrementTimeInput) incrementTime = incrementTimeInput.valueAsNumber;
        }else{
            const selectedButton = document.querySelector(".navigator-modal #select-duration button[data-selected='true']") as HTMLElement;
            if(selectedButton){
                totalTime = parseInt(selectedButton.querySelector(".total-time")!.textContent!);
                incrementTime = parseInt(selectedButton.querySelector(".increment-time")!.textContent!);
            }
        }

        // Check the validity of the entered values in mm:ss format.
        totalTime = !totalTime && this.lastSelectedDuration.remaining 
            ? this.lastSelectedDuration.remaining 
            : minutesToMilliseconds(totalTime!);
        totalTime = (!totalTime || totalTime < MIN_TOTAL_TIME || totalTime > MAX_TOTAL_TIME) 
            ? DEFAULT_TOTAL_TIME 
            : totalTime;

        incrementTime = !incrementTime && this.lastSelectedDuration.increment 
            ? this.lastSelectedDuration.increment 
            : secondsToMilliseconds(incrementTime!);
        incrementTime = (!incrementTime || incrementTime < MIN_INCREMENT_TIME || incrementTime > MAX_INCREMENT_TIME) 
            ? DEFAULT_INCREMENT_TIME 
            : incrementTime;

        this.lastSelectedDuration = {remaining: totalTime, increment: incrementTime};
    }

    /**
     * Get the created lobby settings from the modal. 
     */
    public getCreatedLobbySettings(): {playerName: string, board: string, duration: Duration}
    {
        return {
            playerName: this.lastEnteredPlayerName,
            board: this.lastCreatedBoard || StartPosition.Standard,
            duration: this.lastSelectedDuration
        };
    }

    /**
     * Handle the operation of the navigator modal.
     */
    public handleOperation(operation: NavigatorModalOperation): void
    {
        switch(operation){
            case NavigatorModalOperation.Hide:
                this.hide();
                break;
            case NavigatorModalOperation.Undo:
                this.undo();
                break;
            case NavigatorModalOperation.AskConfirmation:
                this.showConfirmation();
                break;
            case NavigatorModalOperation.ShowGameCreator:
                this.showGameCreator();
                break;
            case NavigatorModalOperation.ShowSelectDuration:
                this.showSelectDuration();
                break;
            case NavigatorModalOperation.ShowSelectDurationCustom:
                this.showSelectDurationCustom();
                break
            case NavigatorModalOperation.ShowPlayAgainstBot:
                this.showPlayAgainstBot();
                break;
            case NavigatorModalOperation.ShowCreateLobby:
                this.saveSelectedGameDuration();
                this.showCreateLobby();
                break
            case NavigatorModalOperation.ShowJoinLobby:
                this.showJoinLobby();
                break;
            case NavigatorModalOperation.ShowSelectColorAgainsBot:
                this.saveSelectedBotDifficulty();
                this.showSelectColorAgainstBot();
                break;
        }
    }
}