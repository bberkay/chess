import { Chess } from "../../Chess/Chess.ts";
import { MenuOperation } from "../Types";
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
            this.print(this.chess.getLogs());
        });
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
                    <button data-menu-operation="${MenuOperation.ClearConsole}">Ⅹ</button>
                </div>
                <div id="log-console-footer-content">
                    <span id = "log-file"></span>
                </div>
            </div>
        `);
        this.loadCSS("log-console.css");
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

        const logListElement: HTMLElement = document.getElementById("log-list")!;
        for(const log of logs){
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
                    const tooltipVariable: string = 
                    `<div class = "tooltip-container"><div class = "tooltip-text"><pre>${parseAndStringify(words[i])}</pre></div></div>`;
                    log.message = log.message.replace(
                        originalWord,
                        `<div class = 'tooltip-toggle'>${originalWord.replace(`[${words[i]}]`, "")} ${tooltipVariable}</div>`
                    );
                }
            }

            const logElement = document.createElement("li");
            logElement.innerHTML = `&#x2022 <strong data-log-source="${log.source}">[${log.source.replace(".ts", "").split("/").pop()}] </strong><span>${log.message}</span>`;
            logListElement.appendChild(logElement);
        }

        logListElement!.innerHTML += "<hr>";
        document.getElementById("log-console-body")!.scrollTop = logListElement!.scrollHeight;
    }

    /**
     * This function adds event listeners to the log messages.
     * Why this function separated from the _createLogMessages function?
     * Since the tooltip toggles are created dynamically, we need to add event listeners
     * to the tooltip toggles after the tooltip toggles are created.
     */
    private _createLogMessagesEventListeners(): void
    {
        /**
         * This function calculates the opening location of the tooltip.
         * If the tooltip is out of the log list, this function returns
         * the location where the tooltip should be opened like ["top", "right"]
         * or ["bottom", "left"] etc.
         */
        function calculateOpeningLocation(tooltip_toggle: HTMLElement): string[]
        {
            let openingLocation = [];
            const logBodyRect: DOMRect = document.getElementById("log-console-body")!.getBoundingClientRect();
            const tooltipRect: DOMRect = (tooltip_toggle.querySelector(".tooltip-text") as HTMLElement).getBoundingClientRect();

            // Vertical location of the tooltip
            if (tooltipRect.bottom > logBodyRect.bottom) openingLocation.push("top");
            else openingLocation.push("bottom");

            // Horizontal location of the tooltip
            if (tooltipRect.left < logBodyRect.left) openingLocation.push("right");
            else if (tooltipRect.right > logBodyRect.right) openingLocation.push("left");
            else openingLocation.push("center");

            return openingLocation;
        }

        // Add event listeners to the tooltip toggles.
        const squares: NodeListOf<HTMLElement> = document.querySelectorAll(".square");
        document.querySelectorAll(".tooltip-toggle").forEach((tooltip_toggle) => {
            // square ids and tooltip location added when the mouse is over the tooltip.
            tooltip_toggle.addEventListener("mouseover", () => {
                squares.forEach((square: HTMLElement) => {
                    square.innerHTML += `<div class = "square-id">${square.getAttribute("data-square-id")}</div>`
                });

                const openingLocation: string[] = calculateOpeningLocation((tooltip_toggle as HTMLElement));
                if(openingLocation.length == 0) return;
                tooltip_toggle.querySelector(".tooltip-container")!.classList.add(
                    `tooltip-container--${openingLocation[0]}`,
                    `tooltip-container--${openingLocation[1]}`
                );
            });

            tooltip_toggle.addEventListener("mouseout", () => {
                document.querySelectorAll(".square-id").forEach((element) => { element.remove() });
                tooltip_toggle.querySelector(".tooltip-container")!.classList.remove(
                    "tooltip-container--top", "tooltip-container--bottom", "tooltip-container--left", "tooltip-container--right", "tooltip-container--center"
                );
            });
        });

        // Add event listeners to the log sources.
        const logSourceAddressBar: HTMLElement = document.getElementById("log-file")!;
        document.querySelectorAll("[data-log-source]").forEach((logSource) => {
            logSource.parentElement!.addEventListener("mouseover", () => {
                logSourceAddressBar.innerHTML = logSource.getAttribute("data-log-source")!
            });
        });
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
    public print(logs: ReadonlyArray<{source: string, message: string}>): void
    {
        if(this.getLogCount() > 75)
            this.clear();

        const lastLogs: Array<{source: string, message: string}> = logs.slice(this.logCounter);
        if(lastLogs.length == 0) return;

        // Print the logs to the log console.
        this._createLogMessages(lastLogs);
        this._createLogMessagesEventListeners();

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
