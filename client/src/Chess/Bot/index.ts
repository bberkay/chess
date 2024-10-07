import { Color, Move } from "@Chess/Types";
import { Converter } from "@Chess/Utils/Converter";

/**
 * Default difficulty multiplier is 5.
 * Default depth multiplier is 3.
 * 
 * For more information about depth:
 * https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#go
 */
const DIFFICULTY_MULTIPLIER = 5;
const DEPTH_MULTIPLIER = 3;

/**
 * Difficulty levels for the bot.
 * Easy: Skill Level (1 * DIFFICULTY_MULTIPLIER)
 * Medium: Skill Level (2 * DIFFICULTY_MULTIPLIER)
 * Hard: Skill Level (3 * DIFFICULTY_MULTIPLIER)
 * 
 * For more information about the skill level:
 * https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html#setoption
 */
export enum BotDifficulty{
    Easy = 1,
    Medium = 2,
    Hard = 3
}

/**
 * Bot colors.
 * If the color is set to random, the bot will 
 * randomly choose between white and black and
 * because of this, the player's color will be 
 * determined by bot's random choice.
 */
export enum BotColor{
    White = Color.White,
    Black = Color.Black,
    Random = "random"
}

/**
 * Bot class that controls the chess engine's behavior.
 * This bot uses the Stockfish engine (via WebAssembly if available) to compute 
 * moves based on a specified difficulty.
 * 
 * Docs and references:
 * https://official-stockfish.github.io/docs/stockfish-wiki/UCI-&-Commands.html
 * https://github.com/lichess-org/stockfish.js
 */
export class Bot{
    public readonly color: Color;
    public readonly difficulty: BotDifficulty;
    private readonly depth: number;

    private stockfish: any;
    public readonly isWasmSupported: boolean = typeof WebAssembly === 'object' 
        && WebAssembly.validate(
            Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
        );
    public readonly stockfishPath: string = `Stockfish/${
        this.isWasmSupported 
        ? "stockfish.wasm.js" 
        : "stockfish.js"
    }`;

    private _bestMove: Move | Move[] | null = null;

    /**
     * Initializes the bot with the given color and difficulty level.   
     * @param difficulty Difficulty level (1 for easy, 2 for medium, 3 for hard).
     */
    constructor(color: BotColor | Color, difficulty: BotDifficulty)
    {
        if(difficulty < BotDifficulty.Easy || difficulty > BotDifficulty.Hard)
            throw new Error("Difficulty must be between 1(easy), 2(medium), or 3(hard)");

        if(color !== BotColor.Random && color !== BotColor.White && color !== BotColor.Black)
            throw new Error("Color must be BotColor.Random, BotColor.White/Color.White, or BotColor.Black/Color.Black");

        if(color === BotColor.Random)
            color = Math.random() < 0.5 ? Color.White : Color.Black;
        
        this.color = color as Color;
        this.difficulty = difficulty * DIFFICULTY_MULTIPLIER;
        this.depth = difficulty * DEPTH_MULTIPLIER;
    }

    /**
     * Starts the Stockfish engine and configures it for a new game.
     */
    public start(): void {
        if(this.stockfish)
            this.terminate();

        this.stockfish = new Worker(new URL(this.stockfishPath, import.meta.url));
        this.stockfish.postMessage("uci");
        this.stockfish.postMessage("ucinewgame");
        this.stockfish.postMessage("setoption name Skill Level value " + this.difficulty);
    }

    /**
     * Sends a position to the Stockfish engine and 
     * retrieves the bot's calculated move.
     */
    public async getMove(fen: string): Promise<Move | Move[]> {
        return new Promise((resolve) => {
            this.stockfish.postMessage("position fen " + fen);
            this.stockfish.postMessage("go movetime 500");

            const listener = (event: MessageEvent) => {
                const line = event.data;
                if (line.startsWith("bestmove")) {
                    this._bestMove = Converter.lanToMove(line.split(" ")[1]);
                    this.stockfish.removeEventListener("message", listener);
                    resolve(this._bestMove!);
                }
            };

            this.stockfish.addEventListener("message", listener);
        });
    }

    /**
     * Terminates the Stockfish engine and releases resources.
     */
    public terminate(): void {
        this.stockfish.postMessage("stop");
        this.stockfish.postMessage("quit");
        this.stockfish = null;
    }
}