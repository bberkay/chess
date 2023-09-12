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
     * Storage of the logs. Logs separated for every action on the chess and every log
     * represents only one game. When a new game created, logs cleared.
     *
     * Example a game with 3 action:
     * [
     *     [
     *         // Logs of createGame(StartPosition.Standard) action
     *         {source:"constructor(...) in src/Chess/Chess.ts", message: "Chess created with ChessEngine and ChessBoard"},
     *         {source:"constructor(...) in src/Chess/Chess.ts", message: "ChessBoard created and CSS loaded"},
     *         {source:"constructor(...) in src/Chess/Chess.ts", message: "ChessEngine created with BoardManager and MoveEngine"},
     *     ]
     *     [
     *         // Logs of doAction(SquareClickMode.Select, Square.a2) action
     *         {source:"playMove(...) in src/Chess/Board/ChessBoard.ts", message: "Move[a2] selected on board"},
     *         {source:"playMove(...) in src/Chess/Engine/ChessEngine.ts", message: "Move[a2] selected on engine"},
     *     ],
     *     [
     *         // Logs of doAction(SquareClickMode.Move, Square.a4) action
     *         {source:"playMove(...) in src/Chess/Board/ChessBoard.ts", message: "Move[a4] played on board"},
     *         {source:"playMove(...) in src/Chess/Engine/ChessEngine.ts", message: "Move[a4] played on engine"}
     *     ]
     * ]
     */
    private static logs: Array<{source: string, message: string}[]> = [];

    /**
     * Create empty log array for taken action.
     */
    public static start(withCleaning: boolean = false): void
    {
        if(withCleaning)
            Logger.clear();

        Logger.logs.push([]);
    }

    /**
     * Save the message
     */
    public static save(message: string, funcName: string, source: Source): void
    {
        // If end of the message is not a dot, add it.
        Logger.logs[Logger.logs.length - 1].push({source:funcName + "(...) in " + source, message: message + (message[message.length - 1] === "." ? "" : ".")});
    }

    /**
     * Returns the messages.
     */
    public static get(): Array<{source: string, message: string}[]>
    {
        return Logger.logs;
    }

    /**
     * Clear the messages.
     */
    public static clear(): void
    {
        Logger.logs = [];
    }
}