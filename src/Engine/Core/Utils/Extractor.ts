import { Square, Moves } from "../../../Types";
import { Route } from "../../../Types/Engine";

/**
 * Flattener class is used to flatten a route object into an array of squares.
 */
export class Extractor {
    /**
     * Extracts squares from a route/moves object.
     * @example Extractor.extractSquares({ MoveRoute.Bottom: [3, 4, 5], MoveRoute.Top: [8, 9, 10] })
     *          Returns: [3, 4, 5, 8, 9, 10]
     */
    static extractSquares(targetObject: Route | Moves): Array<Square> {
        if(!targetObject)
            return [];

        return Object.values(targetObject).flat();
    }
}