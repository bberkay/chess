import { Chess } from "../Chess";

/**
 * This class provide a menu to show the logs.
 */
export class LogConsole{

    private static chess: Chess;

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        LogConsole.chess = chess;
    }

}