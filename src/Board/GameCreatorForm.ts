import { StartPosition } from "../Types";

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
    }

    /**
     * This function loads the css file of the chess board.
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
        link.href = "./src/Board/assets/css/game-creator-form.css";

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
                <div class = "game-creator-form-mode" data-game-creator-mode = "Custom">
                    <button data-operation-type="changeMode" data-operation-value = "Template">Templates</button>
                    <input type="text" placeholder="FEN Notation" data-form-input-id = "CustomMode">
                    <button data-operation-type="createGame" data-operation-value = "Custom">Load</button>
                </div>
                <div class = "game-creator-form-mode" data-game-creator-mode = "Template">
                    <button data-operation-type="changeMode" data-operation-value = "Custom">Custom</button>
                    <select data-form-input-id = "TemplateModes">
                        <option value="">Template</option>
                    </select>
                    <button data-operation-type="createGame" data-operation-value = "Template">Load</button>
                </div>
            `;

        // Add template options to the select element.
        const templateModesInput: HTMLSelectElement = document.querySelector(`[data-form-input-id="TemplateModes"]`) as HTMLSelectElement;

        // FIXME: Const olmaz çok karışıyor
        for(const position in StartPosition){
            const option: HTMLOptionElement = document.createElement("option");
            option.value = StartPosition[position];
            option.innerHTML = position;
            templateModesInput.appendChild(option);
        }
    }

    /**
     * This function changes the mode of the form.
     */
    public changeMode(mode: "Custom" | "Template"): void
    {
        document.querySelector(`[data-game-creator-mode="${mode.toString()}"]`)!.classList.toggle("visible");
        document.querySelector(`[data-game-creator-mode="${mode === "Custom" ? "Template" : "Custom"}"]`)!.classList.toggle("visible");
    }
}