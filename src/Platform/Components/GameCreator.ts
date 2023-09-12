import { MenuOperationType, MenuOperationValue } from "../Types";
import { StartPosition } from "../../Chess/Types";

/**
 * This class provide a form to create a new game.
 */
export class GameCreator {
    /**
     * Constructor of the GameCreatorForm class.
     */
    constructor(){
        // Load css file of the chess board.
        this._loadCSS();

        // Create the form.
        this.createForm();

        // Set the default mode.
        this.changeMode(MenuOperationValue.GameCreatorCustom);
    }

    /**
     * This function loads the css file of the game creator form.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("game-creator-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "game-creator-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/assets/css/game-creator.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the form.
     */
    private createForm(){
        // Create the form element.
        document.getElementById("game-creator")!.innerHTML =
            `
            <div class = "game-creator-mode" data-game-creator-mode = "${MenuOperationValue.GameCreatorCustom}">
                <div class = "border-inset"><button data-operation-type="${MenuOperationType.GameCreatorChangeMode}" data-operation-value = "${MenuOperationValue.GameCreatorTemplate}">Templates</button></div>
                <input type="text" placeholder="FEN Notation" data-form-input-id = "${MenuOperationValue.GameCreatorCustom}">
                <div class = "border-inset"><button data-operation-type="${MenuOperationType.GameCreatorCreate}" data-operation-value = "${MenuOperationValue.GameCreatorCustom}">Load</button></div>
            </div>
            <div class = "game-creator-mode" data-game-creator-mode = "${MenuOperationValue.GameCreatorTemplate}">
                <div class = "border-inset"><button data-operation-type="${MenuOperationType.GameCreatorChangeMode}" data-operation-value = "${MenuOperationValue.GameCreatorCustom}">Custom</button></div>
                <select data-form-input-id = "${MenuOperationValue.GameCreatorTemplate}"></select>
                <div class = "border-inset"><button data-operation-type="${MenuOperationType.GameCreatorCreate}" data-operation-value = "${MenuOperationValue.GameCreatorTemplate}">Load</button></div>
            </div>
            `;

        // Fill the select element with options.
        const templateModesInput: HTMLSelectElement = document.querySelector(`[data-form-input-id="${MenuOperationValue.GameCreatorTemplate}"]`) as HTMLSelectElement;

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
    public changeMode(mode: MenuOperationValue): void
    {
        document.querySelector(`[data-game-creator-mode="${mode.toString()}"]`)!.classList.add("visible");
        document.querySelector(`[data-game-creator-mode="${mode === MenuOperationValue.GameCreatorCustom 
            ? MenuOperationValue.GameCreatorTemplate 
            : MenuOperationValue.GameCreatorCustom}"]`)!.classList.remove("visible");
    }

    /**
     * Get the FEN notation from the form.
     */
    public getValueByMode(mode: MenuOperationValue): string
    {
        return (document.querySelector(`[data-form-input-id="${mode}"]`) as HTMLInputElement).value;
    }
}