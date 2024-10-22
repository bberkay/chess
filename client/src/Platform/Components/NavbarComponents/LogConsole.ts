import { LogConsoleOperation } from "../../Types";
import { Logger, LoggerEvent } from "@Services/Logger"; 
import { NavbarComponent } from "./NavbarComponent";
import { LOG_CONSOLE_ID } from "@Platform/Consts";

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole extends NavbarComponent{
    /**
     * The configuration of the log console.
     */
    private config: { 
        showSquareIds: boolean
    } = { 
        showSquareIds: true
    };

    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        super();
        this.renderComponent();
        document.addEventListener("DOMContentLoaded", () => {
            this.stream();
            document.addEventListener(LoggerEvent.LogAdded, this.stream.bind(this));
        });
    }

    /**
     * Set the configuration of the chess board.
     */
    public setConfig(config: Partial<LogConsole["config"]>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * This function renders the log console.
     */
    protected renderComponent(): void
    {
        this.loadHTML(LOG_CONSOLE_ID, `
            <div class="log-console-header-body-separator"></div>
            <div id="log-console-body">
                <ul id = "log-list"></ul>
            </div>
            <div id="log-console-footer">
                <div id="log-console-footer-btn">
                    <button data-menu-operation="${LogConsoleOperation.Clear}" data-tooltip-text="Clear Logs">Ⅹ</button>
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
    private _createLogMessage(log: {source: string, message: string}): void
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

        document.getElementById("log-console-body")!.scrollTop = logListElement!.scrollHeight;
    }

    /**
     * This function makes the last added log message 
     * interactive.
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

        const lastLog: HTMLElement = document.getElementById("log-list")!.lastElementChild as HTMLElement;
        const squares: NodeListOf<HTMLElement> | null = this.config.showSquareIds ? document.querySelectorAll(".square") : null;

        // Tooltipts
        lastLog.querySelectorAll(".tooltip-toggle").forEach((tooltip_toggle) => {
            // square ids and tooltip location added when the mouse is over the tooltip.
            tooltip_toggle.addEventListener("mouseover", () => {
                if(this.config.showSquareIds) {
                    squares!.forEach((square: HTMLElement) => {
                        square.innerHTML += `<div class = "square-id">${square.getAttribute("data-square-id")}</div>`
                    });
                }
                

                const openingLocation: string[] = calculateOpeningLocation((tooltip_toggle as HTMLElement));
                if(openingLocation.length == 0) return;
                tooltip_toggle.querySelector(".tooltip-container")!.classList.add(
                    `tooltip-container--${openingLocation[0]}`,
                    `tooltip-container--${openingLocation[1]}`
                );
            });

            tooltip_toggle.addEventListener("mouseout", () => {
                if(this.config.showSquareIds)
                    document.querySelectorAll(".square-id").forEach((element) => { element.remove() });

                tooltip_toggle.querySelector(".tooltip-container")!.classList.remove(
                    "tooltip-container--top", "tooltip-container--bottom", "tooltip-container--left", "tooltip-container--right", "tooltip-container--center"
                );
            });
        });

        // Log source address bar
        const logSourceAddressBar: HTMLElement = document.getElementById("log-file")!;
        const logSource: HTMLElement = lastLog.querySelector("[data-log-source]") as HTMLElement;
        if(!logSource)
            return;

        lastLog.addEventListener("mouseover", () => {
            logSourceAddressBar.innerHTML = logSource.getAttribute("data-log-source")!
        });
    }

    /**
     * This function adds a log to the log console.
     */
    private stream(): void
    {
        const newAddedLog: {source: string, message: string} = Logger.messages()[Logger.messages().length - 1];
        if(newAddedLog === undefined)
            return;

        this._createLogMessage(newAddedLog);
        this._createLogMessagesEventListeners();
        
        if(Logger.messages().length > 1000)
            this.clear();
    }

    /**
     * This function clears the log console.
     */
    public clear(): void
    {
        Logger.clear();

        // Clear the log list.
        document.getElementById("log-list")!.innerHTML = "";

        // Clear the log file.
        document.getElementById("log-file")!.innerHTML = "";
    }

    /**
     * Hide the log console.
     */
    public hide(): void
    {
        document.getElementById(LOG_CONSOLE_ID)!.style.display = "none";
    }

    /**
     * Show the log console.
     */
    public show(): void
    {
        document.getElementById(LOG_CONSOLE_ID)!.style.display = "block";
    }

    /**
     * Handle the operations of the log console.
     */
    public handleOperation(operation: LogConsoleOperation): void
    {
        switch(operation){
            case LogConsoleOperation.Clear:
                this.clear();
                break;
        }
    }
}
