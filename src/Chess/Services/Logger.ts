/**
 * Paths of the files that can be logged.
 */
export enum Source {
    Chess = "src/Chess/Chess.ts",
    ChessBoard = "src/Chess/Board/ChessBoard.ts",
    ChessEngine = "src/Chess/Engine/ChessEngine.ts"
}

/**
 * This static class provides a logging system.
 */
export class Logger{

    /**
     * Storage of the logs.
     */
    private static logs: Array<{source: string, message: string}> = [];

    /**
     * Save the message
     */
    public static save(message: string, funcName: string, source: Source): void
    {
        // If end of the message is not a dot, add it.
        Logger.logs.push({source:funcName + "(...) in " + source, message: message + (message[message.length - 1] === "." ? "" : ".")});
    }

    /**
     * Returns the messages.
     */
    public static get(): Array<{source: string, message: string}>
    {
        return Logger.logs;
    }

    /**
     * Clear the messages.
     */
    public static clear(): void
    {
        for(const log of Logger.logs){
            if(!log.source.includes("constructor") && !log.source.includes("checkAndLoadGameFromCache"))
                Logger.logs.splice(Logger.logs.indexOf(log), 1);
        }
    }
}