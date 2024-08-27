/**
 * This static class provides a logging system.
 */
export class Logger{
    /**
     * Logs
     */
    private static logs: Array<{source: string, message: string}> = [];

    /**
     * Paths of the sources
     */
    private static readonly SOURCE_PATHS: string[] = [
        "src/Chess/Chess.ts",
        "src/Chess/Board/ChessBoard.ts",
        "src/Chess/Engine/ChessEngine.ts",
        "src/Platform/Platform.ts",
        "src/Platform/Components/GameCreator.ts",
        "src/Platform/Components/LogConsole.ts",
        "src/Platform/Components/NotationMenu.ts"
    ]

    /**
     * Save the message
     */
    public static save(message: string): void
    {
        let funcNameAndFileName = new Error().stack?.split("\n");
        console.log(funcNameAndFileName);
        let funcName: string = "Unknown";
        let fileName: string = "Unknown";
        let source: string = "Unknown";
        if(funcNameAndFileName)
        {   
            // Chrome, Edge and other chromium based browsers
            if(funcNameAndFileName[0] == "Error") 
                funcNameAndFileName = funcNameAndFileName[2].trim().split("at ")[1].split(" ")
            else // Firefox
                funcNameAndFileName = funcNameAndFileName[2].trim().split("@");
            
            funcName = funcNameAndFileName[0];
            fileName = funcNameAndFileName[1].substring(funcNameAndFileName[1].lastIndexOf("/"), funcNameAndFileName[1].indexOf(".ts"));
            source = Logger.SOURCE_PATHS.find(path => path.includes(fileName)) || "Unknown";
        }
        
        Logger.logs.push({
            source:`${funcName}(...) in ${source}`, 
            message: message
        });        
    }

    /**
     * Returns the messages.
     */
    public static get(): ReadonlyArray<{source: string, message: string}>
    {
        return Object.freeze([...Logger.logs]);
    }

    /**
     * Clear the messages.
     */
    public static clear(): void
    {
        Logger.logs = [];
    }
}