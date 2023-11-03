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
    private _createTooltip(log: string): string
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

        // Find the log list element and the last logs in the logs array.
        let logListElement: HTMLElement = document.getElementById("log-list")!;
        const lastLogs: Array<{source: string, message: string}> = logs.slice(this.logCounter);

        // Add the log to the log list.
        for(const log of lastLogs) {
            const source = log.source.replace(".ts", "").split("/").pop();
            logListElement!.innerHTML +=
                `<li onmouseover="document.getElementById('log-file').innerHTML = '${log.source}'">
                       &#x2022 <strong>[${source}] </strong><span>${this._createTooltip(log.message)}</span>
                </li>`;
        }

        if(lastLogs.length != 0){
            // Add a horizontal line to the log list for separating the logs.
            logListElement!.innerHTML += "<hr>";

            // Scroll to the bottom of the log list.
            document.getElementById("log-console-body")!.scrollTop = logListElement!.scrollHeight;

            // Update the log count.
            this.logCounter += lastLogs.length;
        }

        // Initialize the listeners when the dom is loaded.
        this.initListenerForTooltips();
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