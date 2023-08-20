import { Square } from "../../../Types";
import { Route } from "../../../Types/Engine";

/**
 * Flattener class is used to flatten a route object into an array of squares.
 */
export class Flattener {
    /**
     * Flattens a route object into an array of squares.
     * @example RouteFlattener.flattenRoute({ MoveRoute.Bottom: [3, 4, 5], MoveRoute.Top: [8, 9, 10] })
     *          Returns: [3, 4, 5, 8, 9, 10]
     */
    static flattenRoute(routeObject: Route): Array<Square> {
        return Object.values(routeObject).flat();
    }
}
