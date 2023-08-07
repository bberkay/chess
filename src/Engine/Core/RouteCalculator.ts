export class RouteCalculator {
    /**
     * This class calculates the route of the given piece.
     *
     * Example: routeCalculator.getPawnRoute(Square.b2, Color.White);
     * Scenarios:
     * 1. First move of pawn, Square.b3 and Square.b4 are empty, Square.a4 or Square.c4
     * has no enemy piece, then return [Square.b3, Square.b4].
     * 3. Not first move of pawn, Square.b3 is empty, Square.b4 and Square.c3 has enemy piece,
     * then return [Square.b3, Square.c3].
     * ...
     *
     * Note: This function does not control check scenarios(it means, piece will not protect the king).
     * It only calculates the route. So, please use this function with the getPawnMoves(or bishop, rook etc.)
     * function.
     */

    getPawnRoute() { }
    getKnightRoute() { }
    getBishopRoute() { }
    getRookRoute() { }
    getQueenRoute() { }
    getKingRoute() { }
}