import { MenuOperationType, MenuOperationValue } from "../Types";
import { StartPosition } from "../../Chess/Types";
import { Component } from "./Component";

/**
 * This class provide a form to create a new game.
 */
export class GameCreator extends Component{
    /**
     * Constructor of the GameCreatorForm class.
     */
    constructor(){
        super();

        // Load the css and html files.
        this.render();
    }

    /**
     * This function renders the game creator.
     */
    public render(): void
    {
        this.loadHTML("game-creator", `
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
        `);
        this.loadCSS("game-creator.css");

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

        // Set the default mode.
        this.changeMode(MenuOperationValue.GameCreatorCustom);
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

    /**
     * This function clears the form.
     */
    public clear(): void
    {
        // Clear the input element.
        (document.querySelector(`[data-form-input-id="${MenuOperationValue.GameCreatorCustom}"]`) as HTMLInputElement).value = "";

        // Clear the select element.
        (document.querySelector(`[data-form-input-id="${MenuOperationValue.GameCreatorTemplate}"]`) as HTMLSelectElement).selectedIndex = 0;
    }
}
