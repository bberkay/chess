import { Chess } from "../../Chess/Chess.ts";
import { MenuOperationType, MenuOperationValue } from "../Types";
import { Component } from "./Component";

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole extends Component{
    protected readonly chess: Chess;
    private logCounter: number = 0;

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        super();
        this.chess = chess;
        this.renderComponent();
        document.addEventListener("DOMContentLoaded", () => {
            this.initListener();
            this.print(this.chess.getLogs());
        });
    }

    /**
     * Listen actions/clicks of user on log console
     */
    protected initListener(): void
    {
        document.querySelectorAll("#log-console [data-operation-type]").forEach(menuItem => {
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
            case MenuOperationType.LogConsoleClear:
                this.clear();
                break;
        }
    }

    /**
     * This function renders the log console.
     */
    protected renderComponent(): void
    {
        this.loadHTML("log-console", `
            <div id="log-console-body">
                <ul id = "log-list"></ul>
            </div>
            <div id="log-console-footer">
                <div id="log-console-footer-btn">
                    <button data-operation-type="${MenuOperationType.LogConsoleClear}">Clear</button>
                </div>
                <div id="log-console-footer-content">
                    <span id = "log-file"></span>
                </div>
            </div>
        `);
        this.loadCSS("log-console.css");

        // Initialize the listeners when the dom is loaded.
        document.addEventListener("DOMContentLoaded", () => {
            this.initListener();
        });
    }

    /**
     * This function initializes the listeners.
     */
    private initListenerForTooltips(): void
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
    private _createLogMessages(logs: Array<{source: string, message: string}>): void
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

        /**
         * This function calculates the opening location of the tooltip.
         * If the tooltip is out of the log list, this function returns
         * the location where the tooltip should be opened like ["top", "right"]
         * or ["bottom", "left"] etc.
         */
        function calculateOpeningLocation(tooltip: HTMLElement): string[]
        {
            let openingLocation = [];
            const logListRect: DOMRect = document.getElementById("log-list")!.getBoundingClientRect();
            const tooltipRect: DOMRect = tooltip.getBoundingClientRect();

            // Is the tooltip out of the log list?
            if(tooltipRect.bottom <= logListRect.bottom && tooltipRect.top >= logListRect.top) return [];

            // Vertical location of the tooltip
            if (tooltipRect.top > Math.abs(logListRect.top + logListRect.height ) / 2) openingLocation.push("bottom");
            else openingLocation.push("top");

            // Horizontal location of the tooltip
            if (tooltipRect.left > Math.abs(logListRect.left + logListRect.width) / 2) openingLocation.push("right");
            else openingLocation.push("left");

            return openingLocation;
        }

        // Find the log list element and the last logs in the logs array.
        let logListElement: HTMLElement = document.getElementById("log-list")!;
        for(const log of logs){
            // Get the words in the log message.
            const words: string[] = log.message.split(" ");
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
                    log.message = log.message.replace(words[i + 1], "");
                }

                // Convert the values between "[]" to tooltips.
                if(words[i].includes("[") && words[i].includes("]")){
                    words[i] = words[i].replace(words[i].slice(0, words[i].indexOf("[") + 1), "");
                    words[i] = words[i].slice(0, words[i].lastIndexOf("]"));
                    const tooltipVariable: string = `<div class = "tooltip-container"><div class = "tooltip-text"><pre>${parseAndStringify(words[i])}</pre></div></div>`;
                    log.message = log.message.replace(originalWord, `<div class = 'tooltip-toggle'>${originalWord.replace(`[${words[i]}]`, "")} ${tooltipVariable}</div>`);
                }
            }
         
            // Add log to the log list.
            const logElement = document.createElement("li");
            logElement.innerHTML = `&#x2022 <strong>[${log.source.replace(".ts", "").split("/").pop()}] </strong><span>${log.message}</span>`;
            logElement.addEventListener("mouseover", () => { document.getElementById("log-file")!.innerHTML = log.source });
            logListElement.appendChild(logElement);

            // Change the location of the tooltip if it is out of the log list.
            logElement.querySelectorAll(".tooltip-toggle")?.forEach((element) => {
                let locations: string[] = calculateOpeningLocation((element as HTMLElement));
                if(locations.length == 0) return;
                locations.forEach((location) => { element.querySelector(".tooltip-container")!.classList.add(`tooltip-container--${location}`) });
            });
        }


        // Scroll to the bottom of the log list.
        logListElement!.innerHTML += "<hr>";
        document.getElementById("log-console-body")!.scrollTop = logListElement!.scrollHeight;
                
        // Add event listeners for tooltips.
        this.initListenerForTooltips();
    }

    /**
     * This function returns the log count.
     */
    private getLogCount(): number
    {
        return this.logCounter;
    }

    /**
     * This function adds a log to the log console.
     */
    public print(logs: Array<{source: string, message: string}>): void
    {
        /**
         * If the log count is greater than 130, clear the log console.
         * This is for preventing the log console from slowing down the browser.
         */
        if(this.getLogCount() > 75)
            this.clear();

        const lastLogs: Array<{source: string, message: string}> = logs.slice(this.logCounter);
        if(lastLogs.length == 0) return;

        // Print the logs to the log console.
        this._createLogMessages(lastLogs);

        // Update the log count.
        this.logCounter += lastLogs.length;
    }

    /**
     * This function clears the log console.
     */
    public clear(): void
    {
        // Clear the logs of the chess.
        this.chess.clearLogs();

        // Clear the log count.
        this.logCounter = 0;

        // Clear the log list.
        document.getElementById("log-list")!.innerHTML = "";

        // Clear the log file.
        document.getElementById("log-file")!.innerHTML = "";
    }
}