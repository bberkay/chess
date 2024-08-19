import { MenuOperation } from "../Types";
import { Chess } from "../../Chess/Chess";
import { StartPosition } from "../../Chess/Types";
import { Component } from "./Component";

/**
 * This class provide a form to create a new game.
 */
export class GameCreator extends Component{
    protected readonly chess: Chess;

    /**
     * Constructor of the GameCreatorForm class.
     */
    constructor(chess: Chess){
        super();
        this.chess = chess;
        this.renderComponent();
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
    {
      const gameCreator: HTMLElement = document.querySelector("#game-creator")!;
      gameCreator!.classList.add("game-creator");
      gameCreator!.setAttribute("data-form-mode", "custom-mode");
      this.loadCSS("game-creator.css");
      this.changeMode(); // Start it from template mode.
    }

    /**
     * This function changes the mode of the form.
     */
    public changeMode(): void
    {
      const gameCreator: HTMLElement = document.querySelector('#game-creator')!;
      const currentMode: "custom-mode" | "template-mode" = gameCreator.getAttribute("data-form-mode") as "custom-mode" | "template-mode";
      let newMode: "custom-mode" | "template-mode";
      if(currentMode == "custom-mode"){
        gameCreator.outerHTML = this.getTemplateMode();
        newMode = "template-mode";
      }
      else if(currentMode == "template-mode"){
        gameCreator.outerHTML = this.getCustomMode();
        newMode = "custom-mode";
      }
      document.querySelector('.game-creator')!.setAttribute("data-form-mode", newMode!);
    }

    /**
     * Get the template mode of the form.
     */
    private getTemplateMode(): string
    {
      function getTemplateOptions(): string {
        let options: string = "";
        for (const position in StartPosition) {
          // @ts-ignore
          options += `<option value="${StartPosition[position as string]}">${position}</option>`;
        }
        return options;
      }

      return `
        <div id="game-creator" class = "game-creator" data-form-mode="template-mode">
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Templates</button></div>
            <select>${getTemplateOptions()}</select>
            <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateGame}">Load</button></div>
        </div>
        `;
    }

    /**
     * Get the custom mode of the form.
     */
    private getCustomMode(): string
    {
      return `<div id="game-creator" class = "game-creator-mode" data-form-mode="custom-mode">
                <div class = "border-inset"><button data-menu-operation="${MenuOperation.ChangeMode}">Templates</button></div>
                <input type="text" placeholder="FEN Notation" value = "${this.chess.engine.getGameAsFenNotation()}">
                <div class = "border-inset"><button data-menu-operation="${MenuOperation.CreateGame}">Load</button></div>
              </div>`;
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
    }

    /**
     * Get the form value of the custom or template mode.
     */
    private getFormValue(): string
    {
        const gameCreator: HTMLElement = document.querySelector('.game-creator')!;
        const currentMode: "custom-mode" | "template-mode" = gameCreator.getAttribute("id") as "custom-mode" | "template-mode";
        let formValue: string;
        if(currentMode == "custom-mode")
            formValue = (document.querySelector(`#custom-mode input`) as HTMLInputElement).value;
        else if(currentMode == "template-mode")
            formValue = (document.querySelector(`#template-mode select`) as HTMLSelectElement).value;
        return formValue!;
    }

    /**
     * This function shows the FEN notation on the form.
     */
    public show(fenNotation: string): void
    {
        (document.querySelector(`#custom-mode input`) as HTMLInputElement).value = fenNotation;
    }

    /**
     * This function clears the form.
     */
    public clear(): void
    {
        (document.querySelector(`#custom-mode input`) as HTMLInputElement).value = "";
        (document.querySelector(`template-mode input`) as HTMLSelectElement).selectedIndex = 0;
    }
}
