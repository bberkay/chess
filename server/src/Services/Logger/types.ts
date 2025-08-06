/**
 * Events emitted by the Logger system for integration with other components.
 */
export enum LoggerEvent {
    /**
     * Event emitted to check if the document is available.
     * Used internally.
     * @event
     */
    DocumentCheck = "DocumentCheck",

    /**
     * Event emitted after a new log entry is added.
     * Can be listened to for live log updates.
     * @event
     */
    LogAdded = "LogAdded",
}

/**
 * Immutable array of Log entries.
 */
export type Logs = ReadonlyArray<Log>;

/**
 * Represents a single log message including its source (logger name).
 */
export interface Log {
    /**
     * Source identifier of the log message (e.g., "Engine", "Board").
     */
    source: string;

    /**
     * The log message text.
     */
    message: string;
}
