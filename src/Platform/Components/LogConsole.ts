import { MenuOperationType } from "../Types";

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole{
    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        // Load css file of the chess board.
        this._loadCSS();

        // Create the table.
        this.createConsole();
    }

    /**
     * This function loads the css file of the log console.
     */
    private _loadCSS(): void
    {
        // Check if the css file is already loaded.
        if(document.getElementById("log-console-css"))
            return;

        // Create the link element and set the attributes.
        let link: HTMLLinkElement = document.createElement("link");
        link.id = "log-console-css";
        link.rel = "stylesheet";
        link.href = "./src/Platform/Components/Assets/css/log-console.css";

        // Add the link element to the head of the document.
        document.head.appendChild(link);
    }

    /**
     * This function creates the log console.
     */
    private createConsole(): void
    {
        // Create the form element.
        document.getElementById("log-console")!.innerHTML =
            `
            <div id="log-console-body">
                <ul id = "log-list">
                    
                </ul>
            </div>
            <div id="log-console-footer">
                <div id="log-console-footer-btn">
                    <button data-operation-type="${MenuOperationType.LogConsoleClear}">Clear</button>
                </div>
                <div id="log-console-footer-content">
                    <span id = "log-file"></span>
                </div>
            </div>
            `;
    }

    /**
     * This function adds a log to the log console.
     */
    public show(logs: Array<{source: string, message: string}[]>): void
    {
        // Find the log list element and the last logs in the logs array.
        let logListElement: HTMLElement = document.getElementById("log-list")!;
        const lastLogs: Array<{source: string, message: string}> = logs[logs.length - 1];

        // Add the log to the log list.
        for(const log of lastLogs) {
            const source: string = log.source.includes("Engine") ? "Engine | " : (log.source.includes("Board") ? "Board &nbsp;| " : `Chess &nbsp;| `);
            logListElement!.innerHTML +=
                `
                <li onmouseover="document.getElementById('log-file').innerHTML = '${log.source}'">
                    &#x2022 <strong style="text-transform: uppercase">${source}</strong><span>${log.message}</span>
                </li>
                `;
        }
        logListElement!.innerHTML += "<hr>";
    }

    /**
     * This function clears the log console.
     */
    public clear(): void
    {
        // Clear the log list.
        document.getElementById("log-list")!.innerHTML = "";

        // Clear the log file.
        document.getElementById("log-file")!.innerHTML = "";
    }
}