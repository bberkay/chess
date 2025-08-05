/**
 * LoggerEvent enum for the logger events.
 */
export enum LoggerEvent{
    /**
     * A new log record is added to the LogStore.
     * @Event
     */
    DocumentCheck = "DocumentCheck",

    /**
     * A new log record is added to the LogStore.
     * @Event
     */
    LogAdded = "LogAdded",
}

export type Logs = ReadonlyArray<Log>;

export interface Log {
    source: string;
    message: string;
}
