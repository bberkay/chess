import { MenuOperation } from "../Types";
import { Component } from "./Component";
import { GameStatus } from "@Chess/Types";

/**
 * This class provide a menu to show the logs.
 */
export class NavigatorModal extends Component{
    private lastNavigatorModalTitle: string = "";
    private lastNavigatorModalContent: string = "";

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
        this.renderComponent();

        document.querySelector('.navigator-modal-title')!.innerHTML = title;
        document.querySelector('.navigator-modal-content')!.innerHTML = content;
        if(closeable) document.querySelector('.navigator-modal')!.classList.add("closeable");

        if(!document.querySelector(".navigator-modal-bg-layer")){
            const modalBgLayer = document.createElement("div");
            modalBgLayer.classList.add("navigator-modal-bg-layer");
            document.body.appendChild(modalBgLayer);
        }

        if(!document.querySelector(".navigator-modal-content #confirmation")){
            this.lastNavigatorModalTitle = title;
            this.lastNavigatorModalContent = content;
        }

        document.querySelector(".navigator-modal-bg-layer")!.addEventListener("click", (event) => {
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
        document.querySelector('.navigator-modal-bg-layer')!.remove();
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
                <button data-menu-operation="${MenuOperation.ShowGameCreatorModal}">Play Again</button>
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
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${MenuOperation.HideNavigatorModal}">
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
        this.show(
            "Create New Game",
            `<div class = "btn-group-vertical">
                <button data-menu-operation="${MenuOperation.CreateLobby}">Play against Friend</button>
                <button data-menu-operation="${MenuOperation.PlayAgainstBot}">Play against Bot</button>
                <button data-menu-operation="${MenuOperation.CreateBoard}">Create Board</button>
            </div>
             <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${MenuOperation.HideNavigatorModal}">
                    Cancel
                </button>
            </div>
            `
        );
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
                <button onclick="copyToClipboard('#lobby-link')">Copy</button>
            </div>
            <span style="font-size:13px">Share this lobby link with your friend to play together.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${MenuOperation.AskConfirmation}">
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
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${MenuOperation.AskConfirmation}">
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
                <button data-menu-operation="${MenuOperation.UndoNavigatorModal}">Continue Playing</button>
                <button style="background-color:transparent" data-menu-operation="${MenuOperation.CancelGame}">Yes, Cancel the Game</button>
            </div></div>`
        );
    }
}