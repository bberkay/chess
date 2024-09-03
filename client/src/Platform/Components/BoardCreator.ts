import { MenuOperation } from "../Types";
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
        this.renderComponent();
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
    {
      const boardCreator: HTMLElement = document.querySelector("#board-creator")!;
      boardCreator.innerHTML = `
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
      `
      this.loadCSS("board-creator.css");
      this.changeMode(); // Start it from template mode.
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
