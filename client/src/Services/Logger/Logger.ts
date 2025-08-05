import { LoggerError } from "./LoggerError";
import { Log, LoggerEvent, Logs } from "./types";

/**
 * LogStore class for storing the logs.
 * This class is separated from the Logger class because
 * there are multiple logger instances in the application
 * like logger instance in the engine and logger instance
 * in the board for setting the logname as "Engine" and "Board".
 * But the logs should be stored in a single place and should be
 * accessible from LogConsole and other components as a single
 * log store because even the logs are coming from different sources
 * they are all a part of the single application.
 *
 * For example:
 * The game is initialized with the following logs:
 * 1. Board Log Instance: "The board is initialized."
 * 2. Engine Log Instance: "The engine is initialized."
 * 3. Chess Log Instance: "The game is initialized."
 * 4. Board Log Instance: "The piece selected".
 * 5. Chess Log Instance: "The selected piece is sent to the engine."
 * 5. Engine Log Instance: "The moves are calculated."
 * 6. Chess Log Instance: "The moves are received from the engine."
 * 7. Board Log Instance: "The moves are displayed on the board."
 * And the logs should be displayed in the LogConsole as:
 * [Board] "The board is initialized."
 * [Engine] "The engine is initialized."
 * [Chess] "The game is initialized."
 * [Board] "The piece selected."
 * [Chess] "The selected piece is sent to the engine."
 * ... and so on.
 *
 * But if the logs are stored in the Logger class, the logs will be stored
 * something like this:
 * [Board] "The board is initialized."
 * [Board] "The piece selected."
 * [Engine] "The engine is initialized."
 * [Engine] "The moves are calculated."
 * [Chess] "The game is initialized."
 * [Chess] "The selected piece is sent to the engine."
 */
class LogStore{
    private static logs: Array<Log> = [];

    public static add(log: Log): void {
        LogStore.logs.push(log);
    }

    public static clear(): void {
        LogStore.logs.length = 0;
    }

    public static get(): Logs {
        return Object.freeze([...LogStore.logs]);
    }
}

const IS_DOC_AVAILABLE = (() => {
    try {
        if (typeof window !== "undefined" && document) {
            document.dispatchEvent(new Event(LoggerEvent.DocumentCheck));
            return true;
        }
        return false;
    } catch(e) {
        console.error("The window or document might not be available: ", e);
        return false;
    }
})();

/**
 * This static class provides a logger instance
 * for logging system
 */
export class Logger{
    private logName: string;

    /**
     * Constructor
     */
    constructor(logName: string){
        this.logName = logName;
    }

    /**
     * Save the message
     */
    public save(...messages: unknown[]): void
    {
        try {
            LogStore.add({ source: this.logName, message: messages.join(" ") });
        } catch(e: unknown) {
            throw LoggerError.factory.LogSavingFailed((e instanceof Error) ? (e as Error).message : "");
        }

        try {
            if (IS_DOC_AVAILABLE) document.dispatchEvent(new Event(LoggerEvent.LogAdded));
        } catch(e: unknown) {
            throw LoggerError.factory.LogEventDispatchFailed((e instanceof Error) ? (e as Error).message : "");
        }
    }

    /**
     * Returns the name of the logger.
     */
    public name(): string
    {
        return this.logName;
    }

    /**
     * Returns the messages.
     */
    public static messages(): Logs
    {
        return LogStore.get();
    }

    /**
     * Clear the messages.
     */
    public static clear(): void
    {
        LogStore.clear();
    }
}
