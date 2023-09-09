import {GameCreatorOperationType, GameCreatorOperationValue} from "../Types";
import { StartPosition } from "../../Chess/Types";

/**
 * This class provide a form to create a new game.
 */
export class GameCreatorForm{
    /**
     * Constructor of the GameCreatorForm class.
     */
    constructor(){
        // Load css file of the chess board.
        this._loadCSS();

        // Create the form.
        this.createForm();

        // Set the default mode.
        this.changeMode(GameCreatorOperationValue.Custom);
    }

    /**
     * This function loads the css file of the game creator form.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("game-creator-form-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "game-creator-form-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/assets/css/game-creator-form.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the form.
     */
    private createForm(){
        // Create the form element.
        document.getElementById("game-creator-form")!.innerHTML =
            `
            <div class = "game-creator-form-mode" data-game-creator-mode = "${GameCreatorOperationValue.Custom}">
                <div class = "border-inset"><button data-operation-type="${GameCreatorOperationType.ChangeMode}" data-operation-value = "${GameCreatorOperationValue.Template}">Templates</button></div>
                <input type="text" placeholder="FEN Notation" data-form-input-id = "${GameCreatorOperationValue.Custom}">
                <div class = "border-inset"><button data-operation-type="${GameCreatorOperationType.CreateGame}" data-operation-value = "${GameCreatorOperationValue.Custom}">Load</button></div>
            </div>
            <div class = "game-creator-form-mode" data-game-creator-mode = "${GameCreatorOperationValue.Template}">
                <div class = "border-inset"><button data-operation-type="${GameCreatorOperationType.ChangeMode}" data-operation-value = "${GameCreatorOperationValue.Custom}">Custom</button></div>
                <select data-form-input-id = "${GameCreatorOperationValue.Template}"></select>
                <div class = "border-inset"><button data-operation-type="${GameCreatorOperationType.CreateGame}" data-operation-value = "${GameCreatorOperationValue.Template}">Load</button></div>
            </div>
            `;

        // Fill the select element with options.
        const templateModesInput: HTMLSelectElement = document.querySelector(`[data-form-input-id="${GameCreatorOperationValue.Template}"]`) as HTMLSelectElement;

        // Traverse the StartPosition enum and add options to the select element.
        for(const position in StartPosition){
            const option: HTMLOptionElement = document.createElement("option");
            // @ts-ignore
            option.value = StartPosition[position];
            option.innerHTML = position;
            templateModesInput.appendChild(option);
        }
    }

    /**
     * This function changes the mode of the form.
     */
    public changeMode(mode: GameCreatorOperationValue): void
    {
        document.querySelector(`[data-game-creator-mode="${mode.toString()}"]`)!.classList.toggle("visible");
        document.querySelector(`[data-game-creator-mode="${mode === GameCreatorOperationValue.Custom 
            ? GameCreatorOperationValue.Template 
            : GameCreatorOperationValue.Custom}"]`)!.classList.remove("visible");
    }

    /**
     * Get the FEN notation from the form.
     */
    public getValueByMode(mode: GameCreatorOperationValue): string
    {
        return (document.querySelector(`[data-form-input-id="${mode}"]`) as HTMLInputElement).value;
    }
}