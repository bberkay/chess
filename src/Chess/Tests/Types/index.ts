import { Square } from "../../src/Types";

/**
 * Test item type for the tests.
 */
export interface Test{
    title: string;
    board: string;
    moves?: Array<{from: Square, to: Square}>;
    expectation: any;
}