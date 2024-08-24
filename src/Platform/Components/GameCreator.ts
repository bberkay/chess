import { MenuOperation } from "../Types";
import { Chess } from "../../Chess/Chess";
import { StartPosition } from "../../Chess/Types";
import { Component } from "./Component";

/**
 * This class provide a form to create a new game.
 */
export class GameCreator extends Component{
    protected readonly chess: Chess;
    private currentMode: "custom-mode" | "template-mode";

    /**
     * Constructor of the GameCreatorForm class.
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
      const gameCreator: HTMLElement = document.querySelector("#game-creator")!;
      gameCreator.innerHTML = `
        <div class = "game-creator template-mode visible">
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Custom</button></div>
            <select>${this.getTemplateOptions()}</select>
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateGame}">Load</button></div>
        </div>
        <div class = "game-creator custom-mode">
          <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Templates</button></div>
          <input type="text" placeholder="FEN Notation" value = "${this.chess.engine.getGameAsFenNotation()}">
          <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateGame}">Load</button></div>
        </div>
      `
      this.loadCSS("game-creator.css");
      this.changeMode(); // Start it from template mode.
    }

    /**
     * This function changes the mode of the form.
     */
    public changeMode(): void
    {
      const gameCreator: HTMLElement = document.querySelector('#game-creator')!;
      gameCreator.querySelector(`.${this.currentMode}`)!.classList.remove("visible");
      this.currentMode = this.currentMode === "template-mode" ? "custom-mode" : "template-mode";
      gameCreator.querySelector(`.${this.currentMode}`)!.classList.add("visible");
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
     * This function creates a new game with the game creator.
     */
    public createGame(): void
    {
        this.chess.createGame(this.getFormValue());

        // Create invisible div that includes the logs of the game for the first time when game is created.
        const response: HTMLDivElement = document.createElement("div");
        response.id = "game-creator-response";
        response.innerHTML = JSON.stringify(this.chess.getLogs());
        response.style.visibility = "hidden";
        document.body.appendChild(response);

        if(this.currentMode == "template-mode")
          this.changeMode();

        this.show(this.chess.engine.getGameAsFenNotation());
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
