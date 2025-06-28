import { JsonNotation, StartPosition, Move, Durations } from "@Chess/Types";

/**
 * Board with moves and expectation
 */
export interface TestGame{
    title: string;
    board: JsonNotation | StartPosition | string;
    durations?: Durations;
    moves?: Array<Move>;
    expectation: any;
}
