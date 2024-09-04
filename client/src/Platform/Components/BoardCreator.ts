import { MenuOperation, UtilityMenuSection } from "../Types";
import { Chess } from "@Chess/Chess";
import { StartPosition } from "@Chess/Types";
import { Component } from "./Component";

enum CreatorMode {
    Custom = "custom-mode",
    Template = "template-mode"
}

/**
 * This class provide a form to create a new board.
 */
export class BoardCreator extends Component{
    private readonly chess: Chess;
    private currentMode: CreatorMode;
    private lastCreatedFenNotation: string = "";

    /**
     * Constructor of the BoardCreator class.
     */
    constructor(chess: Chess){
        super();
        this.chess = chess;
        this.currentMode = CreatorMode.Template;
        this.loadCSS("board-creator.css");
        this.renderComponent();
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
    {
        this.loadHTML("board-creator", `
          <div class = "board-creator ${CreatorMode.Template} visible">
              <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Custom</button></div>
              <select>${this.getTemplateOptions()}</select>
              <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateBoard}">Load</button></div>
          </div>
          <div class = "board-creator ${CreatorMode.Custom}">
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Templates</button></div>
            <input type="text" placeholder="FEN Notation" value = "${this.chess.engine.getGameAsFenNotation()}">
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateBoard}">Load</button></div>
          </div>
        `);
        this.changeMode(); // Start it from template mode.
        document.getElementById("notation-menu")!.id = "piece-creator";
        this.loadHTML("piece-creator", `
            <table id = "piece-table">
                <thead>
                    <tr>
                        <th>White</th>
                        <th>Black</th>
                    </tr>
                </thead>
                <tbody id = "piece-options">
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="King" data-color="White"></div>
                                <span>White King</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="King" data-color="Black"></div>
                                <span>Black King</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="White"></div>
                                <span>White Queen</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Queen" data-color="Black"></div>
                                <span>Black Queen</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="White"></div>
                                <span>White Rook</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Rook" data-color="Black"></div>
                                <span>Black Rook</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="White"></div>
                                <span>White Bishop</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Bishop" data-color="Black"></div>
                                <span>Black Bishop</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="White"></div>
                                <span>White Knight</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Knight" data-color="Black"></div>
                                <span>Black Knight</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="White"></div>
                                <span>White Pawn</span>
                            </div>
                        </td>
                        <td>
                            <div class="piece-option">
                                <div class="piece" data-piece="Pawn" data-color="Black"></div>
                                <span>Black Pawn</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="utility-menu">
                <button class="menu-item" data-menu-operation="${MenuOperation.FlipBoard}" data-tooltip-text="Flip Board">F</button>
                <button class="menu-item" data-menu-operation="undo" data-tooltip-text="Add Piece">+</button>
                <button class="menu-item" data-menu-operation="redo" data-tooltip-text="Delete Piece">-</button>
                <button class="menu-item" data-menu-operation="undo" data-tooltip-text="Clear Board">X</button>
                <button class="menu-item" data-menu-operation="${MenuOperation.ResetBoard}" data-tooltip-text="Reset Board">R</button>
                <button class="menu-item" data-menu-operation="${MenuOperation.ToggleUtilityMenu}">☰</button>
            </div>
            <div class="utility-menu utility-toggle-menu visible">
                <div class="utility-toggle-menu-section active" id="${UtilityMenuSection.NewGame}-utility-menu">
                    <button class="menu-item" data-menu-operation="${MenuOperation.ShowGameCreatorModal}" data-tooltip-text="Start the Board">Start</button>
                    <button class="menu-item" data-menu-operation="${MenuOperation.ShowGameCreatorModal}" data-tooltip-text="Create New Game">+ New Game</button>
                    <button class="menu-item" data-menu-operation="${MenuOperation.ShowWelcomeModal}" data-tooltip-text="About Project">Info</button>
                </div>
            </div>
        `);
    }

    /**
     * This function changes the mode of the form.
     */
    public changeMode(): void
    {
        const boardCreator: HTMLElement = document.querySelector('#board-creator')!;
        boardCreator.querySelector(`.${this.currentMode}`)!.classList.remove("visible");
        this.currentMode = this.currentMode === CreatorMode.Template ? CreatorMode.Custom : CreatorMode.Template;
        boardCreator.querySelector(`.${this.currentMode}`)!.classList.add("visible");
    }

    /**
     * Get the template mode of the form.
     */
    private getTemplateOptions(): string
    {
        let options: string = "";
        for (const position in StartPosition) {
          // @ts-ignore
          options += `<option value="${StartPosition[position as string]}">${position}</option>`;
        }
        return options;
    }

    /**
     * This function creates a new board with the board creator.
     */
    private _createBoard(fenNotation: string): void
    {
        this.lastCreatedFenNotation = fenNotation;
        this.chess.createGame(fenNotation);

        // Create invisible div for triggering the log console to stream 
        // when the game is created.
        const response: HTMLDivElement = document.createElement("div");
        response.id = "board-creator-response";
        response.style.visibility = "hidden";
        document.body.appendChild(response);

        if(this.currentMode == CreatorMode.Template)
          this.changeMode();

        this.show(this.chess.engine.getGameAsFenNotation());
    }

    /**
     * This function creates a new board with the board creator.
     */
    public createBoard(fenNotation: string | null = null): void
    {
        this._createBoard(fenNotation || this.getFormValue());
    }

    /**
     * This function if the current mode is custom mode or not.
     */
    public resetBoard(): void
    {
        this._createBoard(this.lastCreatedFenNotation);
    }

    /**
     * This function if the current mode is custom mode or not.
     */
    public isCustomMode(): boolean
    {
        return this.currentMode == CreatorMode.Custom;
    }

    /**
     * Get the form value of the custom or template mode.
     */
    private getFormValue(): string
    {
        let formValue: string;
        if(this.currentMode == CreatorMode.Custom)
            formValue = (document.querySelector(`.${CreatorMode.Custom} input`) as HTMLInputElement).value;
        else if(this.currentMode == CreatorMode.Template)
            formValue = (document.querySelector(`.${CreatorMode.Template} select`) as HTMLSelectElement).value;
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public show(fenNotation: string): void
    {
        (document.querySelector(`.${CreatorMode.Custom} input`) as HTMLInputElement).value = fenNotation;
    }

    /**
     * This function clears the form.
     */
    public clear(): void
    {
        (document.querySelector(`.${CreatorMode.Custom} input`) as HTMLInputElement).value = "";
        (document.querySelector(`.${CreatorMode.Template} select`) as HTMLSelectElement).selectedIndex = 0;
    }
}
