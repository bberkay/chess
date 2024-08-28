import { MenuOperation } from "../Types";
import { Component } from "./Component";

/**
 * This class provide a menu to show the logs.
 */
export class NavigatorModal extends Component{
    /**
     * Constructor of the NavigatorModal class.
     */
    constructor() {
        super();
        this.loadCSS("navigator-modal.css");
        document.addEventListener("DOMContentLoaded", () => {
            this.showGameCreator();
        });
    }

    /**
     * This function renders the navigator modal.
     */
    protected renderComponent(): void
    {
        this.loadHTML("navigator-modal", `
            <div class="navigator-modal navigator-modal--glass">
                <div class="navigator-modal-bg">
                    <img src="./public/assets/images/result-screen-bg-icon.png" alt="Chessboard">
                </div>
                <div class="navigator-modal-title"></div>
                <div class="navigator-modal-content"></div>
            </div>
        `);
    }

    /**
     * Show the modal with the given title and content.
     */
    public show(title: string, content: string): void
    {
        const navigatorModal = document.createElement('div');
        navigatorModal.id = "navigator-modal";
        document.querySelector('#chessboard')!.appendChild(navigatorModal);
        
        this.renderComponent();
        
        document.querySelector('.navigator-modal-title')!.innerHTML = title;
        document.querySelector('.navigator-modal-content')!.innerHTML = content;
    }

    /**
     * Hide the modal.
     */
    public hide(): void
    {
        const navigatorModal = document.querySelector('#navigator-modal');
        if(navigatorModal) navigatorModal.remove();
    }

    /**
     * Show the welcome message.
     */
    public showWelcome(): void
    {
        this.show(
            "Welcome to Chess Platform", 
            "This is a platform to play chess games. You can create a new game, load a game, save a game, and more."
        );
        document.querySelector(".navigator-modal")!.classList.add("navigator-modal--glass");
    }

    /**
     * Show the about message.
     */
    public showAbout(): void
    {
        this.show(
            "About Chess Platform",
            "This is a platform to play chess games. You can create a new game, load a game, save a game, and more."
        );
        document.querySelector(".navigator-modal")!.classList.add("navigator-modal--glass");
    }

    /**
     * Show the game creator.
     */
    public showGameCreator(): void
    {
        this.show(
            "Create New Game",
            `<div class = "btn-group btn-group--vertical">
                <button data-menu-operation="${MenuOperation.CreateLobby}">Create Lobby</button>
                <button data-menu-operation="${MenuOperation.CreateBoard}">Create Board</button>
            </div>`
        );
    }

    /**
     * Show the created lobby information.
     */
    public showLobbyInfo(): void
    {
        this.show(
            "Ready to Play",
            `<div class = "btn-group" style="padding-bottom:5px;">
                <input type="text" id="lobby-link" placeholder="Lobby Name" value="lobby-link" readonly>
                <button onclick="copyToClipboard('#lobby-link')">Copy</button>
            </div>
            <span style="font-size:13px">Share this lobby link with your friend to play together.</span>
            <div style="text-align:center;margin-top:10px;">
                <button class="button--text" style="font-size:13px!important;" data-menu-operation="${MenuOperation.OpenGameCreator}">
                    Cancel
                </button>
            </div>
            `
        );
    }
}