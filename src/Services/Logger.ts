
class LogStorage{
    public static logs: Array<{source: string, message: string}> = [];
}

/**
 * This static class provides a logging system.
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
    public save(message: string): void
    {
        LogStorage.logs.push({source: this.logName, message: message[message.length - 1] != "." ? message + "." : message});        
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
    public static messages(): ReadonlyArray<{source: string, message: string}>
    {
        return Object.freeze([...LogStorage.logs]);
    }

    /**
     * Clear the messages.
     */
    public static clear(): void
    {
        LogStorage.logs = [];
    }
}