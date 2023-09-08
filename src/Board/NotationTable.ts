import { Chess } from "../Chess.ts";

/**
 * This class provide a table to show the notation.
 */
export class NotationTable{

    private static chess: Chess;

    /**
     * Constructor of the LogConsole class.
     */
    constructor(chess: Chess) {
        NotationTable.chess = chess;
    }

}