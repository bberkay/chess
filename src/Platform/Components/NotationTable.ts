import {Color} from "../../Chess/Types";

/**
 * This class provide a table to show the notation.
 */
export class NotationTable{

    private lastNotation: string;

    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        this.lastNotation = "";

        // Load css file of the chess board.
        this._loadCSS();

        // Create the table.
        this.createTable();
    }

    /**
     * This function loads the css file of the notation table.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("notation-table-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "notation-table-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/assets/css/notation-table.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the table.
     */
    private createTable(){
        document.getElementById("notation-table")!.innerHTML =
            `
                <table>
                    <thead>
                        <tr>
                            <th>Move</th>
                            <th>White</th>
                            <th>Black</th>
                        </tr>
                    </thead>
                    <tbody id = "notations">
                    
                    </tbody>
                </table>
            `;
    }

    /**
     * This function clears the table.
     */
    public clear(): void
    {
        this.createTable();
        this.lastNotation = "";
    }

    /**
     * This function sets the table by given notation.
     */
    public set(notation: Array<string>): void
    {
        this.clear();

        for(let i = 0; i < notation.length; i++){
            this.add(notation.slice(0, i + 1));
        }
    }

    /**
     * This function adds a row/notation to the table.
     */
    public add(notation: Array<string>): void
    {
        // Check if the notation is already added.
        if(this.lastNotation == notation[notation.length - 1] || notation.length < 1)
            return;

        // Find the color of the notation.
        let color: string = notation.length % 2 == 0 ? Color.Black : Color.White;

        /**
         * If notation is white then create new notation row/tr and add as td,
         * otherwise add the notation to the last row as td.
         */
        const notations: HTMLElement = document.getElementById("notations")!;

        if(color == Color.White){
            notations.innerHTML +=
                `
                    <tr>
                        <td>${notation.length / 2 + 0.5}</td>
                        <td>${notation[notation.length - 1]}</td>
                        <td></td>
                    </tr>
                `;
        }else{
            notations.lastElementChild!.lastElementChild!.innerHTML = notation[notation.length - 1];
        }

        // Set the last notation.
        this.lastNotation = notation[notation.length - 1];
    }

}