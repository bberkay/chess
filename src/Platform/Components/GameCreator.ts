import { MenuOperationType, MenuOperationValue } from "../Types";
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
        document.addEventListener("DOMContentLoaded", () => {
            this.initListener();
        });
    }

    /**
     * Listen actions/clicks of user on game creator form
     */
    protected initListener(): void
    {
        document.querySelectorAll("#game-creator [data-operation-type]").forEach(menuItem => {
            menuItem.addEventListener("click", () => {
                // Make operation(from menu)
                this.handleOperation(
                    menuItem.getAttribute("data-operation-type") as MenuOperationType,
                    menuItem.getAttribute("data-operation-value") as MenuOperationValue
                );
            });
        });
    }

    /**
     * This function makes an operation on menu.
     */
    protected handleOperation(operationType: MenuOperationType, operationValue: MenuOperationValue): void
    {
        // Do operation by given operation type.
        switch(operationType){
            case MenuOperationType.GameCreatorCreate:
                this.createGame(operationValue);
                break;
            case MenuOperationType.GameCreatorChangeMode:
                this.changeMode(operationValue);
                break;
        }
    }

    /**
     * This function renders the game creator.
     */
    protected renderComponent(): void
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
    private getValueByMode(mode: MenuOperationValue): string
    {
        return (document.querySelector(`[data-form-input-id="${mode}"]`) as HTMLInputElement).value;
    }

    /**
     * This function creates a new game with the game creator.
     */
    public createGame(operationValue: MenuOperationValue): void
    {
        this.chess.createGame(this.getValueByMode(operationValue));
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
