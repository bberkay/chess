import { MenuOperationType } from "../Types";

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole{

    private currentLogCount: number = 0;

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
     * This function initializes the listeners.
     */
    private initListeners(): void
    {
        const squares: NodeListOf<HTMLElement> = document.querySelectorAll(".square");

        // Show square ids when the tooltip is hovered.
        document.querySelectorAll(".tooltip").forEach((element) => {
            // Show square ids on squares
            element.addEventListener("mouseover", () => {
                squares.forEach((square: HTMLElement) => {
                    square.innerHTML += `<div class = "square-id">${square.getAttribute("data-square-id")}</div>`;
                });
            });

            // Hide square ids
            element.addEventListener("mouseout", () => {
                document.querySelectorAll(".square-id").forEach((element) => {
                    element.remove();
                });
            });
        });
    }

    /**
     * Convert the values between "[]" in log message to tooltips.
     *
     * For example:
     * Log: Enums[WhiteInCheck, BlackVictory] are found by player's color[White].
     * Return: <span class = "variable-tooltip" data-tooltip-value="[WhiteInCheck, BlackVictory]>Enums</span>
     * are found by player's <span class = "variable-tooltip" data-tooltip-value="[White]">color</span>
     */
    private _convertValuesToTooltips(log: string): string
    {
        /**
         * This function parses and stringifies the value, if
         * value is string it returns the value without parsing.
         */
        function parseAndStringify(value: string): string
        {
            try{
                value = JSON.parse(value);
            }catch{}

            return JSON.stringify(value, undefined, 2);
        }

        // Get the words in the log message.
        const words: string[] = log.split(" ");
        for(let i = 0; i < words.length; i++){
            const originalWord: string = words[i];

            /**
             * When we split the log message with " " character, the values between "[]" will be split.
             * So we need to merge the split values. For example, if the log message is:
             * Enums[WhiteInCheck, BlackVictory] are found by player's color[White].
             * The words array will be:
             * ["Enums[WhiteInCheck,", "BlackVictory]", "are", "found", "by", "player's", "color[White]."]
             * So we need to merge "Enums[WhiteInCheck," and "BlackVictory]" to "Enums[WhiteInCheck, BlackVictory]".
             * And we need to remove the "BlackVictory]" from the array.
             */
            if(words[i].includes("[") && !words[i].includes("]")){
                words[i] += " " + words[i + 1];
                log = log.replace(words[i + 1], "");
            }

            // Convert the values between "[]" to tooltips.
            if(words[i].includes("[") && words[i].includes("]")){
                words[i] = words[i].replace(words[i].slice(0, words[i].indexOf("[") + 1), "");
                words[i] = words[i].slice(0, words[i].lastIndexOf("]"));
                const tooltipVariable: string = `<div class = "tooltip-text"><pre>${parseAndStringify(words[i])}</pre><i></i></div>`;
                log = log.replace(originalWord, `<div class = 'tooltip'>${originalWord.replace(`[${words[i]}]`, "")} ${tooltipVariable}</div>`);
            }
        }

        return log;
    }

    /**
     * This function adds a log to the log console.
     */
    public show(logs: Array<{source: string, message: string}>): void
    {
        // Find the log list element and the last logs in the logs array.
        let logListElement: HTMLElement = document.getElementById("log-list")!;
        const lastLogs: Array<{source: string, message: string}> = logs.slice(this.currentLogCount);

        // Add the log to the log list.
        for(const log of lastLogs) {
            const source: string = log.source.includes("Engine") ? "Engine" : (log.source.includes("Board") ? "Board" : "Chess");
            logListElement!.innerHTML +=
                `
                <li onmouseover="document.getElementById('log-file').innerHTML = '${log.source}'">
                    &#x2022 <strong style="text-transform: uppercase">[${source}] </strong><span>${this._convertValuesToTooltips(log.message)}</span>
                </li>
                `;
        }

        // Add a horizontal line to the log list for separating the logs.
        logListElement!.innerHTML += "<hr>";

        // Scroll to the bottom of the log list.
        document.getElementById("log-console-body")!.scrollTop = logListElement!.scrollHeight;

        // Update the log count.
        this.currentLogCount += lastLogs.length;

        // Initialize the listeners when the dom is loaded.
        this.initListeners();
    }

    /**
     * This function clears the log console.
     */
    public clear(): void
    {
        // Clear the log count.
        this.currentLogCount = 0;

        // Clear the log list.
        document.getElementById("log-list")!.innerHTML = "";

        // Clear the log file.
        document.getElementById("log-file")!.innerHTML = "";
    }
}