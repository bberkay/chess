import { LogConsoleOperation } from "../../Types";
import { Logger, LoggerEvent } from "@Services/Logger";
import { NavbarComponent } from "./NavbarComponent";
import { LOG_CONSOLE_ID } from "@Platform/Consts";
import { debounce } from "@ChessPlatform/Utils/Timing";

/**
 * Represents the configuration of the log console.
 */
export interface Config {
    showSquareIds: boolean;
}

/**
 * The default configuration of the log console.
 */
export const DEFAULT_CONFIG: Config = {
    showSquareIds: true,
};

/**
 * The debounce time for waiting log messages to be added.
 */
const LOG_DEBOUNCE_TIME_MS = 250;

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole extends NavbarComponent {
    public readonly id: string = LOG_CONSOLE_ID;

    private config: Config = DEFAULT_CONFIG;

    private _lastLogIndex: number = 0;

    /**
     * Constructor of the LogConsole class.
     */
    constructor() {
        super();
        //this.renderComponent();
        this.stream();

        document.addEventListener(
            LoggerEvent.LogAdded, 
            debounce(this.stream.bind(this), LOG_DEBOUNCE_TIME_MS)
        );
    }

    /**
     * Set the configuration of the log console.
     */
    public setConfig(config: Partial<LogConsole["config"]>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * This function renders the log console.
     */
    protected renderComponent(): void {
        this.loadHTML(
            LOG_CONSOLE_ID,
            `
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
        `
        );
        this.loadCSS("log-console.css");
    }

    /**
     * Create log messages in the log console body.
     */
    private _createLogMessages(
        logs: { source: string; message: string }[]
    ): void {
        /**
         * This function parses and stringifies the value, if
         * value is string it returns the value without parsing.
         */
        const parseAndStringify = (value: string): string => {
            try {
                value = JSON.parse(value);
            } catch {
                /* empty */
            }

            return JSON.stringify(value, undefined, 2);
        };

        /**
         * This function generates a tooltip toggle element with 
         * the title and content.
         * For Example:
         * `title` is someone and `content` is [{name: "someone"}}] =>
         * <div class = 'tooltip-toggle'>
         *   <span>someone</span>
         *    <div class = "tooltip-container">
         *       <div class = "tooltip-text">
         *           <pre>{name: "someone"}</pre>
         *       </div>
         *    </div>
         * </div>
         */
        const generateTooltipToggle = (title:string, content: string): string => {
            return `<div class = 'tooltip-toggle'>
                        ${title}
                        <div class = "tooltip-container">
                            <div class = "tooltip-text">
                                <pre>${parseAndStringify(content)}</pre>
                            </div>
                        </div>
                    </div>`;
        };

        /**
         * This function generates source element with the source value.
         * For example:
         * source is "src/Platform/Components/NavbarComponents/LogConsole.ts" =>
         * &#x2022 <strong data-log-source="src/Platform/Components/NavbarComponents/LogConsole.ts">
         *     [LogConsole]
         * </strong>
         */
        const generateSource = (source: string): string => {
            return `&#x2022 <strong data-log-source="${source}">[${source
                .replace(".ts", "")
                .split("/")
                .pop()}] </strong>`;
        };

        const logListElement: HTMLElement =
            document.getElementById("log-list")!;
        
        const lastLogListElement: HTMLElement | null = logListElement.querySelector("li:last-child");
        if (lastLogListElement) {
            lastLogListElement.classList.add("log--last");
        }

        for (const log of logs) {
            const logElement = document.createElement("li");
            logElement.innerHTML = `${generateSource(log.source)}`;
            logElement.innerHTML += log.message.replace(
                /\b(\w+)\s*-ts-(.*?)-te-/g,
                (match, prevWord, content) => `${generateTooltipToggle(prevWord, content)}`
            );
            logListElement.appendChild(logElement);
        }

        document.getElementById("log-console-body")!.scrollTop =
            logListElement!.scrollHeight;
    }

    /**
     * This function makes the last added log message
     * interactive.
     */
    private _createLogMessagesEventListeners(): void {
        const logConsoleBody: HTMLElement =
            document.getElementById("log-console-body")!;
        const logBodyRect: DOMRect = logConsoleBody.getBoundingClientRect();

        /**
         * This function calculates the opening location of the tooltip.
         * If the tooltip is out of the log list, this function returns
         * the location where the tooltip should be opened like ["top", "right"]
         * or ["bottom", "left"] etc.
         */
        const calculateOpeningLocation = (
            tooltip_toggle: HTMLElement
        ): string[] => {
            const openingLocation = [];
            const tooltipRect: DOMRect = (
                tooltip_toggle.querySelector(".tooltip-text") as HTMLElement
            ).getBoundingClientRect();

            openingLocation.push(
                tooltipRect.bottom > logBodyRect.bottom ? "top" : "bottom"
            );
            openingLocation.push(
                tooltipRect.left <= logBodyRect.left
                    ? "right"
                    : tooltipRect.right >= logBodyRect.right
                    ? "left"
                    : "center"
            );

            return openingLocation;
        };

        const logSourceAddressBar: HTMLElement =
            document.getElementById("log-file")!;
        const newAddedLogs: HTMLElement[] = Array.from(
            document.getElementById("log-list")!.querySelectorAll("li")
        ).slice(this._lastLogIndex);
        
        // Tooltips
        const squares: NodeListOf<HTMLElement> | null = document.querySelectorAll(".square");
        newAddedLogs.forEach((log: HTMLElement) => {
            log.querySelectorAll(".tooltip-toggle").forEach(
                (tooltip_toggle) => {
                    tooltip_toggle.addEventListener("mouseover", () => {
                        if (this.config.showSquareIds) {
                            squares!.forEach((square: HTMLElement) => {
                                square.innerHTML += `<div class = "square-id">${square.getAttribute(
                                    "data-square-id"
                                )}</div>`;
                            });
                        }

                        const openingLocation: string[] =
                            calculateOpeningLocation(
                                tooltip_toggle as HTMLElement
                            );
                        if (openingLocation.length == 0) return;
                        tooltip_toggle
                            .querySelector(".tooltip-container")!
                            .classList.add(
                                `tooltip-container--${openingLocation[0]}`,
                                `tooltip-container--${openingLocation[1]}`
                            );
                    });

                    tooltip_toggle.addEventListener("mouseout", () => {
                        if (this.config.showSquareIds)
                            document
                                .getElementById("chessboard")!
                                .querySelectorAll(".square-id")
                                .forEach((element) => {
                                    element.remove();
                                });

                        tooltip_toggle
                            .querySelector(".tooltip-container")!
                            .classList.remove(
                                "tooltip-container--top",
                                "tooltip-container--bottom",
                                "tooltip-container--left",
                                "tooltip-container--right",
                                "tooltip-container--center"
                            );
                    });
                }
            );

            // Log source address bar
            const logSource: HTMLElement = log.querySelector(
                "[data-log-source]"
            ) as HTMLElement;
            if (!logSource) return;

            log.addEventListener("mouseover", () => {
                logSourceAddressBar.innerHTML =
                    logSource.getAttribute("data-log-source")!;
            });
        });
    }

    /**
     * This function adds a log to the log console.
     */
    private stream(): void {
        if (Logger.messages().length <= this._lastLogIndex) {
            this._lastLogIndex = Logger.messages().length;
            return;
        }

        this._createLogMessages(Logger.messages().slice(this._lastLogIndex));
        this._createLogMessagesEventListeners();

        this._lastLogIndex = Logger.messages().length;
        if (Logger.messages().length > 300) this.clear();
    }

    /**
     * This function clears the log console.
     */
    public clear(): void {
        Logger.clear();
        this._lastLogIndex = 0;
        document.getElementById("log-list")!.innerHTML = "";
        document.getElementById("log-file")!.innerHTML = "";
    }

    /**
     * Hide the log console.
     */
    public hide(): void {
        document.getElementById(LOG_CONSOLE_ID)!.style.display = "none";
    }

    /**
     * Show the log console.
     */
    public show(): void {
        document.getElementById(LOG_CONSOLE_ID)!.style.display = "block";
    }

    /**
     * Handle the operations of the log console.
     */
    public handleOperation(operation: LogConsoleOperation): void {
        switch (operation) {
            case LogConsoleOperation.Clear:
                this.clear();
                break;
        }
    }
}
