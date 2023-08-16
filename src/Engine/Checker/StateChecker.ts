import {Color, MoveRoute, Piece, PieceType, Route, Square} from "../../Types";
import {RouteCalculator} from "../Core/Calculator/RouteCalculator.ts";
import {BoardManager} from "../../Managers/BoardManager.ts";
import {StateManager} from "../../Managers/StateManager.ts";

/**
 * This class is responsible for checking if the specific states like
 * check, checkmate, stalemate, is threatening, etc.
 *
 * @see src/Engine/Checker/StateChecker.ts For more information.
 */
export class StateChecker {
    // TODO: Kompleks hesaplamalar için bir depolama sistemi geliştirilebilir.

    /**
     * This class contains king, queen, rook, bishop, knight and pawn route calculates methods for the given square.
     * @see for more information src/Engine/Core/Calculator/RouteCalculator.ts
     */
    private static routeCalculator: RouteCalculator = new RouteCalculator();

    /**
     * Check if the given square is threatened by the opponent.
     *
     * Algorithm:
     * 1. Get the color of the enemy player with the piece on the given square or with the StateManager.
     * 2. Get queen, rook, bishop routes and check if any of them contains any enemy piece.
     * 3. Get pawn routes and check if any of them contains any enemy piece.
     * 4. Get knight routes and check if any of them contains any enemy piece.
     * 5. If any of the routes not contains any enemy piece, then return false.
     *
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isSquareThreatened(square: Square): boolean
    {
        /**
         * Get the color of enemy player with the piece on the given square.
         * If square has no piece, then use StateManager.
         *
         * @see For more information about the StateManager, please check the src/Managers/StateManager.ts
         */
        const piece: Piece | null = BoardManager.getPiece(square);
        const enemyColor: Color = piece ? (piece.getColor() == Color.White ? Color.Black : Color.White) : StateManager.getEnemyColor();

        /**
         * Get all routes of the opponent pieces.
         * Queen already contains all pieces' routes except knight.
         * So, we can get all dangerous squares with queen and knight
         * routes.
         *
         * @see src/Engine/Core/Calculator/RouteCalculator.ts For more information.
         */
        const allRoutes: Route = {
            ...this.routeCalculator.getQueenRoute(square),
            ...this.routeCalculator.getKnightRoute(square)
        };

        /**
         * Traverse all routes and check if the route contains any dangerous enemy piece.
         * For example, if diagonal route contains any bishop or queen, then return true.
         * If horizontal route contains rook or queen, then return true, ..., etc.
         *
         * @see src/Engine/Core/Calculator/RouteCalculator.ts For more information.
         */
        const diagonalRoutes: Array<MoveRoute> = [MoveRoute.TopLeft, MoveRoute.TopRight, MoveRoute.BottomLeft, MoveRoute.BottomRight];

        // Loop through all routes for all piece types except pawn threat.
        for(const route in allRoutes){
            /**
             * If the route is diagonal, then enemy types are bishop and queen.
             * Otherwise, if the route is horizontal or vertical, then enemy types
             * are rook and queen. If the route is L, then enemy type is knight.
             */
            const enemyTypes: Array<PieceType> = diagonalRoutes.includes(route as MoveRoute) ? [PieceType.Bishop, PieceType.Queen]
                : (route == MoveRoute.L ? [PieceType.Knight] : [PieceType.Rook, PieceType.Queen]);

            // Check if any squares at the route contain any enemy piece.
            for(let square of allRoutes[route as MoveRoute]!){
                if(BoardManager.hasPiece(square, enemyColor, enemyTypes))
                    return true;
            }
        }

        /**
         * Now, we have to check if any pawn is threatening the given square.
         * Why didn't we check the pawn in the previous loop? Because pawns'
         * routes can change, according to the color of the pawn. For example,
         * if the pawn is white, then dangerous routes are bottom left and bottom right.
         * Otherwise, if the pawn is black, then dangerous routes are top left
         * and top right. Also, pawn just attacks one square forward(diagonally).
         * and pawn has a special move called en passant. So, it's easier to
         * check the pawn in a different loop/scope.
         *
         * @see For more information about pawn please check the src/Engine/Core/MoveEngine.ts
         */
        const pawnRoutes: Array<MoveRoute> = enemyColor == Color.White ? [MoveRoute.BottomLeft, MoveRoute.BottomRight]
            : [MoveRoute.TopLeft, MoveRoute.TopRight];

        // Loop through all pawn routes for enemy pawn threat.
        for(const route of pawnRoutes){
            /**
             * Get the first square of the route. Because pawn just
             * attacks one square forward(diagonally).
             *
             * Example scenario:
             * Get first square of the bottom left route and square
             * has a white pawn, then return true.
             */
            const square: Square = allRoutes[route]![0]!;

            // Check if any squares at the route contain any enemy piece.
            if(BoardManager.hasPiece(square, enemyColor, PieceType.Pawn))
                return true;
        }

        // If any of the routes not contains any enemy piece, then return false.
        return false;
    }

    /**
     * Check if the player is in check.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInCheck(): boolean
    {
        /**
         * Find the square of the player's king and
         * check if it is threatened.
         */
        return this.isSquareThreatened(
            BoardManager.getSquare(BoardManager.getKing(StateManager.getPlayerColor())!)!
        );
    }

    /**
     * Check if the player is in checkmate.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInCheckmate(): boolean
    {
        // TODO: Zugzwang (https://en.wikipedia.org/wiki/Zugzwang) eklenmeli.
        return false;
    }

    /**
     * Check if the player is in stalemate.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInStalemate(): boolean
    {
        // TODO: Zugzwang (https://en.wikipedia.org/wiki/Zugzwang) eklenmeli.
        return false;
    }
}