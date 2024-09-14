import { SocketOperation } from "../../Types";
import { BoardEditorOperation, NavigatorModalOperation } from "../Types";
import { Component } from "./Component";
import { GameStatus, StartPosition } from "@Chess/Types";
import { 
    DEFULT_PLAYER_NAME,
    MAX_PLAYER_NAME_LENGTH,
    MIN_PLAYER_NAME_LENGTH,
    DEFAULT_TOTAL_TIME,
    MAX_TOTAL_TIME,
    MIN_TOTAL_TIME,
    DEFAULT_INCREMENT_TIME,
    MAX_INCREMENT_TIME,
    MIN_INCREMENT_TIME
} from "@Platform/Consts";

/**
 * This class provide a menu to show the logs.
 */
export class NavigatorModal extends Component{
    private lastNavigatorModalTitle: string = "";
    private lastNavigatorModalContent: string = "";
    private lastCreatedBoard: string = StartPosition.Standard;
    private lastSelectedDuration: [number, number] = [DEFAULT_TOTAL_TIME, DEFAULT_INCREMENT_TIME];
    
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
        this.loadHTML("navigator-modal", `
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
     * Show the modal with the given title and content.
     */
    public show(title: string, content: string, closeable: boolean = false): void
    {
        this.loadHTML("navigator-modal", `
            <div class="navigator-modal navigator-modal--glass">
                <div class="navigator-modal-bg">
                    <img src="./assets/images/result-screen-bg-icon.png" alt="Chessboard">
                </div>
                <div class="navigator-modal-title">${title}</div>
                <div class="navigator-modal-content">${content}</div>
            </div>
        `);

        if(closeable) document.querySelector('.navigator-modal')!.classList.add("closeable");

        let modalBgLayer = document.querySelector(".navigator-modal-bg-layer")!
        if(!modalBgLayer){
            modalBgLayer = document.createElement("div");
            modalBgLayer.classList.add("navigator-modal-bg-layer");
            document.body.appendChild(modalBgLayer);
        }

        if(!document.querySelector(".navigator-modal-content #confirmation")){
            this.lastNavigatorModalTitle = title;
            this.lastNavigatorModalContent = content;
        }

        modalBgLayer.addEventListener("click", (event) => {
            if(!(event.target as HTMLElement).closest(".navigator-modal")){
                if(document.querySelector(".closeable"))
                    this.hide();
                else
                    this.bounce();
            }   
        });
    }

    /**
     * Hide the modal.
     */
    public hide(): void
    {
        document.querySelector('#navigator-modal')!.innerHTML = "";
        const modalBgLayer = document.querySelector('.navigator-modal-bg-layer');
        if(modalBgLayer) modalBgLayer.remove();
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
     * This function bounce the current navigator modal
     */
    public bounce(): void
    {
        const modal = document.querySelector('.navigator-modal')!;
        if(!modal) return;
        modal.classList.add("bounce");
        setTimeout(() => {
            modal.classList.remove("bounce");
        }, 500);
    }

    /**
     * Show the welcome message.
     */
    public showWelcome(): void
    {
        this.show(
            "Welcome", 
            `Chess project that offers a playable 
            online chess game and additional features.<br> <br> 
            <a style="font-size:15px" href='https://github.com/bberkay/chess' target='_blank'>Source Code</a>
            `, 
            true
        );   
    }

    /**
     * Show the game over screen.
     */
    public showGameOver(status: GameStatus): void
    {
        this.show(
            status === GameStatus.WhiteVictory ? "White Wins" : (status === GameStatus.BlackVictory ? "Black Wins" : "Stalemate"),
            `<div class="btn-group-vertical">
                <button data-menu-operation="${NavigatorModalOperation.ShowGameCreator}">Play Again</button>
            </div>`
        );
    }

    /**
     * Show the board not ready screen.
     */
    public showBoardNotReady(): void
    {
        this.show(
            "Not Ready",
            `<span style="font-size:13px">There might be missing pieces like kings. Please create playable board.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
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
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
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
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the select game duration screen.
     */
    public showSelectDuration(): void
    {
        this.show(
            "Select Game Duration",
            `<span style="font-size:13px">Select the total and increment time:</span>
            <div class="btn-group-grid" style="padding-top:5px;padding-bottom:15px;">
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
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the select custom duration screen.
     */
    public showSelectDurationCustom(): void
    {
        this.show(
            "Enter Game Duration",
            `<span style="font-size:13px">Enter the total and increment time:</span>
            <div class="btn-group-horizontal" style="padding-top:5px;padding-bottom:15px;">
                <input type="number" id="total-time" placeholder="Min" min="${MIN_TOTAL_TIME}" max="${MAX_TOTAL_TIME}" required>
                <span style="font-size:28px;padding:0 10px;">+</span>
                <input type="number" id="increment-time" placeholder="Sec" value="${MIN_INCREMENT_TIME}" min="${MIN_INCREMENT_TIME}" max="${MAX_INCREMENT_TIME}" required>
            </div>
            <button type="submit" data-menu-operation="${NavigatorModalOperation.ShowCreateLobby}">Next</button>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.ShowSelectDuration}">
                    Back
                </button>
            </div>
            `
        );
    }

    /**
     * Show the create lobby screen.
     */
    public showCreateLobby(): void
    {
        this.lastSelectedDuration = this.getSelectedGameDuration();
        this.show(
            "Create a Lobby",
            `<span style="font-size:13px">Enter your name: </span>
            <div class="input-group" style="padding-top:5px;padding-bottom:5px;">
                <input type="text" id="player-name" placeholder="Your Name" maxlength="${MAX_PLAYER_NAME_LENGTH}" minlength="${MIN_PLAYER_NAME_LENGTH}" required>
                <button type="submit" data-socket-operation="${SocketOperation.CreateLobby}">Create</button>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
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
            `<span style="font-size:13px">Enter your name: </span>
            <div class="input-group" style="padding-top:5px;padding-bottom:5px;">
                <input type="text" id="player-name" placeholder="Your Name" maxlength="${MAX_PLAYER_NAME_LENGTH}" minlength="${MIN_PLAYER_NAME_LENGTH}" required>
                <button type="submit" data-socket-operation="${SocketOperation.JoinLobby}">Play</button>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
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
            <span style="font-size:13px">Share this lobby link with your friend to play together.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.AskConfirmation}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the play against bot screen.
     */
    public showPlayAgainstBot(): void
    {
        this.show(
            "Play against Bot",
            `<span style="font-size:13px">Select the difficulty level of the bot:</span>
            <div class="btn-group-horizontal btn-group-horizontal--triple" style="padding-top:5px;padding-bottom:5px;">
                <button onclick="ChessPlatform.chess.engine.playAgainstBot()">Easy</button>
                <button onclick="ChessPlatform.chess.engine.playAgainstBot()">Normal</button>
                <button onclick="ChessPlatform.chess.engine.playAgainstBot()">Hard</button>
            </div>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.ShowGameCreator}">
                    Cancel
                </button>
            </div>
            `
        );
    }

    /**
     * Show the confirmation screen.
     */
    public showConfirmation(): void
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
    public showError(message: string): void
    {
        this.show(
            "Something Went Wrong",
            `<span style="font-size:13px">${message}</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${NavigatorModalOperation.Hide}">
                    Ok
                </button>
            </div>
            `
        );
        document.querySelector('.navigator-modal')!.classList.add("navigator-modal--error");
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
        let playerName = (document.querySelector("#navigator-modal #player-name") as HTMLInputElement).value;
        if(playerName.length < MIN_PLAYER_NAME_LENGTH || playerName.length > MAX_PLAYER_NAME_LENGTH)
            playerName = DEFULT_PLAYER_NAME;
        return playerName;
    }

    /**
     * Set the input value of the player name.
     * If the player name modal is open.
     * 
     * @param value Must be between MIN_PLAYER_NAME_LENGTH and MAX_PLAYER_NAME_LENGTH
     * characters. If not, it will be set to DEFULT_PLAYER_NAME.
     */
    public setPlayerNameInputValue(value: string): void
    {
        if(value.length < MIN_PLAYER_NAME_LENGTH || value.length > MAX_PLAYER_NAME_LENGTH)
            value = DEFULT_PLAYER_NAME;
        (document.querySelector("#navigator-modal #player-name") as HTMLInputElement).value = value;
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
    public getSelectedGameDuration(): [number, number]
    {
        const isCustomDurationModalOpen = document.querySelector(
            `[data-menu-operation="${NavigatorModalOperation.ShowSelectDurationCustom}"]
        `) ? false : true;

        let totalTime;
        let incrementTime;
        if(isCustomDurationModalOpen){
            const totalTimeInput = document.querySelector("#navigator-modal #total-time") as HTMLInputElement;
            const incrementTimeInput = (document.querySelector("#navigator-modal #increment-time") as HTMLInputElement);
            if(totalTimeInput) totalTime = totalTimeInput.valueAsNumber;
            if(incrementTimeInput) incrementTime = incrementTimeInput.valueAsNumber;
        }else{
            const selectedButton = document.querySelector("#navigator-modal .btn-group-grid button[data-selected='true']") as HTMLElement;
            if(selectedButton){
                totalTime = parseInt(selectedButton.querySelector(".total-time")!.textContent!);
                incrementTime = parseInt(selectedButton.querySelector(".increment-time")!.textContent!);
            }
        }

        totalTime = !totalTime && this.lastSelectedDuration[0] ? this.lastSelectedDuration[0] : totalTime;
        totalTime = (!totalTime || totalTime < MIN_TOTAL_TIME || totalTime > MAX_TOTAL_TIME) 
            ? DEFAULT_TOTAL_TIME : totalTime;

        incrementTime = !incrementTime && this.lastSelectedDuration[1] ? this.lastSelectedDuration[1] : incrementTime;
        incrementTime = (!incrementTime || incrementTime < MIN_INCREMENT_TIME || incrementTime > MAX_INCREMENT_TIME) 
            ? DEFAULT_INCREMENT_TIME : incrementTime;

        this.lastSelectedDuration = [totalTime, incrementTime];
        return [totalTime, incrementTime];
    }

    /**
     * Get the created lobby settings from the modal. 
     */
    public getCreatedLobbySettings(): {playerName: string, board: string, duration: [number, number]}
    {
        return {
            playerName: this.getEnteredPlayerName(),
            board: this.lastCreatedBoard || StartPosition.Standard,
            duration: this.getSelectedGameDuration()
        };
    }
}