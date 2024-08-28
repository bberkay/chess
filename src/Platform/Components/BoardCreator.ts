import { MenuOperation } from "../Types";
import { Chess } from "../../Chess/Chess";
import { StartPosition } from "../../Chess/Types";
import { Component } from "./Component";

/**
 * This class provide a form to create a new board.
 */
export class BoardCreator extends Component{
    private readonly chess: Chess;
    private currentMode: "custom-mode" | "template-mode";

    /**
     * Constructor of the BoardCreator class.
     */
    constructor(chess: Chess){
        super();
        this.chess = chess;
        this.currentMode = "template-mode";
        this.renderComponent();
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
    {
      const boardCreator: HTMLElement = document.querySelector("#board-creator")!;
      boardCreator.innerHTML = `
        <div class = "board-creator template-mode visible">
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Custom</button></div>
            <select>${this.getTemplateOptions()}</select>
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateBoard}">Load</button></div>
        </div>
        <div class = "board-creator custom-mode">
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
      this.currentMode = this.currentMode === "template-mode" ? "custom-mode" : "template-mode";
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
    public createBoard(): void
    {
        this.chess.createGame(this.getFormValue());

        // Create invisible div for triggering the log console to stream 
        // when the game is created.
        const response: HTMLDivElement = document.createElement("div");
        response.id = "board-creator-response";
        response.style.visibility = "hidden";
        document.body.appendChild(response);

        if(this.currentMode == "template-mode")
          this.changeMode();

        this.show(this.chess.engine.getGameAsFenNotation());
    }

    /**
     * This function gets the current mode of the form.
     */
    public getCurrentMode(): "custom-mode" | "template-mode"
    {
        return this.currentMode;
    }

    /**
     * Get the form value of the custom or template mode.
     */
    private getFormValue(): string
    {
        let formValue: string;
        if(this.currentMode == "custom-mode")
            formValue = (document.querySelector(`.custom-mode input`) as HTMLInputElement).value;
        else if(this.currentMode == "template-mode")
            formValue = (document.querySelector(`.template-mode select`) as HTMLSelectElement).value;
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public show(fenNotation: string): void
    {
        (document.querySelector(`.custom-mode input`) as HTMLInputElement).value = fenNotation;
    }

    /**
     * This function clears the form.
     */
    public clear(): void
    {
        (document.querySelector(`.custom-mode input`) as HTMLInputElement).value = "";
        (document.querySelector(`.template-mode select`) as HTMLSelectElement).selectedIndex = 0;
    }
}
