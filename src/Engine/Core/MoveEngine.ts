import {Color, MoveRoute, Square, PieceType, Piece, Route} from "../../Types.ts";
import {BoardManager} from "../../Managers/BoardManager.ts";
import {Converter} from "../../Utils/Converter.ts";
import {Locator} from "../Utils/Locator.ts";
import {RouteCalculator} from "./Calculator/RouteCalculator.ts";
import {MoveChecker} from "../Checker/MoveChecker.ts";

/**
 * This class calculates the possible moves of the pieces.
 */
export class MoveEngine{

    /**
     * Properties of the MoveEngine class.
     */
    private piece: Piece | null;
    private pieceSquare: Square | null;

    /**
     * @description This class contains king, queen, rook, bishop, knight and pawn route calculates methods for the given square.
     * @see for more information src/Engine/Core/Calculator/RouteCalculator.ts
     */
    private routeCalculator: RouteCalculator;

    /**
     * Constructor of the MoveEngine class.
     */
    constructor() {
        this.routeCalculator = new RouteCalculator();
        this.piece = null;
        this.pieceSquare = null;
    }

    /**
     * Get the possible moves of the piece on the given square.
     */
    public getMoves(square: Square): Array<Square> | null
    {
        // Get the piece on the given square.
        this.piece = BoardManager.getPiece(square);
        this.pieceSquare = square;

        // If there is no piece on the given square, return null;
        if(!this.piece) return null;

        /**
         * If there is a piece on the given square, get
         * the possible moves of the piece by its type.
         */
        switch(this.piece.getType()){
            case PieceType.Pawn:
                return this.getPawnMoves();
            case PieceType.Knight:
                return this.getKnightMoves();
            case PieceType.Bishop:
                return this.getBishopMoves();
            case PieceType.Rook:
                return this.getRookMoves();
            case PieceType.Queen:
                return this.getQueenMoves();
            case PieceType.King:
                return this.getKingMoves();
            default:
                return null;
        }
    }

    /**
     * Get the possible moves of the pawn on the given square.
     */
    private getPawnMoves(): Array<Square> | null
    {
        // Find possible moves of the pawn.
        const route: Route = this.routeCalculator.getPawnRoute(this.pieceSquare!);
        if(!route) return null;

        /**************************************************************************
         * Filter the moves of the pawn by the pawn's color, position
         * and has enemy status of the diagonal squares(these filter operations
         * made because pawn has different move capabilities by its color and position
         * also has a special move called en passant).
         *
         * @see for more information about pawn moves https://en.wikipedia.org/wiki/Pawn_(chess)
         **************************************************************************/

        // Find the pawn's color and enemy's color by the given square.
        const color: Color = this.piece!.getColor();
        const enemyColor: Color = color === Color.White ? Color.Black : Color.White;

        /**
         * Find routes of the pawn by its color. For example,
         * if the pawn is white, we need to get the top route of the pawn.
         * if the pawn is black, we need to get the bottom route of the pawn.
         */
        const moveDirection: Record<string, MoveRoute> = color === Color.White
            ? {vertical: MoveRoute.Top, leftDiagonal: MoveRoute.TopLeft, rightDiagonal: MoveRoute.TopRight}
            : {vertical: MoveRoute.Bottom, leftDiagonal: MoveRoute.BottomLeft, rightDiagonal: MoveRoute.BottomRight};

        /**
         * Filter the route by the pawn's color. For example,
         * if the pawn is white, we need to delete the bottom route of the pawn.
         * if the pawn is black, we need to delete the top route of the pawn.
         */
        for(let path in route){
            if(path != moveDirection.vertical && path != moveDirection.leftDiagonal && path != moveDirection.rightDiagonal)
                delete route[path as MoveRoute];
        }

        /**
         * Filter second square of the vertical route by the pawn's color and row.
         *
         * If pawn is white and is not on the seventh row
         * or if pawn is black and is not on the second row,
         * then remove the second square of the vertical route.
         */
        if(Locator.getRow(this.pieceSquare!) != (color == Color.White ? 7 : 2))
            route[moveDirection.vertical]!.splice(1, 1);

        /**
         * Filter diagonal routes by the pawn's color and has enemy status.
         *
         * If the diagonal squares has no enemy piece, then remove
         * the diagonal routes from the moves.
         */
        if(!BoardManager.hasPiece(route[moveDirection.leftDiagonal]![0], enemyColor))
            delete route[moveDirection.leftDiagonal];

        if(!BoardManager.hasPiece(route[moveDirection.rightDiagonal]![0], enemyColor))
            delete route[moveDirection.rightDiagonal];

        /**
         * Add en passant capability to the pawn. For example,
         * if the pawn is white and left en passant is available,
         * then add the left top square(current square id - 9) to the pawn's
         * moves. Also, if right en passant is available, then add the right
         * top square(current square id - 7) to the pawn's moves. For black
         * pawn, add the left bottom square(current square id + 7) and right
         * bottom square(current square id + 9) to the pawn's moves.
         *
         * @see for more information about square id check Square enum in src/Types.ts
         * @see for more information about en passant check src/Engine/Checker/MoveChecker.ts
         */

        // Add left en passant move to the pawn's moves.
        if(MoveChecker.isLeftEnPassantAvailable(this.pieceSquare!))
            route[moveDirection.leftDiagonal]!.push(color == Color.White ? this.pieceSquare! - 9 : this.pieceSquare! + 7);

        // Add right en passant move to the pawn's moves.
        if(MoveChecker.isRightEnPassantAvailable(this.pieceSquare!))
            route[moveDirection.rightDiagonal]!.push(color == Color.White ? this.pieceSquare! - 7 : this.pieceSquare! + 9);

        // Filter the moves for king safety and convert the route to squares array.
        return Converter.convertRouteToSquareArray(this.doKingSafety(route)!);
    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    private getKnightMoves(): Array<Square> | null
    {
        let moves: Route = this.routeCalculator.getKnightRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety and convert the route to squares array.
        return Converter.convertRouteToSquareArray(this.doKingSafety(moves)!);
    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    private getBishopMoves(): Array<Square> | null
    {
        let moves: Route = this.routeCalculator.getBishopRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety and convert the route to squares array.
        return Converter.convertRouteToSquareArray(this.doKingSafety(moves)!);
    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    private getRookMoves(): Array<Square> | null
    {
        let moves: Route = this.routeCalculator.getRookRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety and convert the route to squares array.
        return Converter.convertRouteToSquareArray(this.doKingSafety(moves)!);
    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    private getQueenMoves(): Array<Square> | null
    {
        let moves: Route = this.routeCalculator.getQueenRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety and convert the route to squares array.
        return Converter.convertRouteToSquareArray(this.doKingSafety(moves)!);
    }

    /**
     * Get the possible moves of the king on the given square.
     */
    private getKingMoves(): Array<Square> | null
    {
        let moves: Route = this.routeCalculator.getKingRoute(this.pieceSquare!);
        if(!moves) return null;

        // Find the king's color and enemy's color by the given square.
        const color: Color = BoardManager.getPiece(this.pieceSquare!)!.getColor();

        /**
         * Add castling moves to the king's moves. For example,
         * If the king is white, add Square.a1 to king's left route
         * and Square.h1 to king's right route. If the king is black,
         * add Square.a8 to king's left route and Square.h8 to king's
         * right route.
         *
         * @see for more information src/Engine/Checker/MoveChecker.ts
         */

        // Add long castling move to the king's moves.
        if(MoveChecker.isLongCastlingAvailable(color))
            moves[MoveRoute.Left]!.push(color == Color.White ? Square.a1 : Square.a8);

        // Add short castling move to the king's moves.
        if(MoveChecker.isShortCastlingAvailable(color))
            moves[MoveRoute.Right]!.push(color == Color.White ? Square.h1 : Square.h8);

        // Return extended and converted moves. Also, king doesn't need to filter for king safety.
        return Converter.convertRouteToSquareArray(moves);
    }

    /**
     * Filter the moves of piece by the king's safety. For example,
     * if the king is in check, then remove the moves that
     * doesn't protect the king.
     *
     * Algorithm:
     * 1. Find the king's square and enemy's color by the given piece color.
     * 2. Get all the routes of the piece(diagonal, horizontal and vertical). Because
     * the king can protect by only these routes(piece can't protect king from knight
     * or pawn. Also, it can only protect from one piece at the same time).
     * 2. Find pairs of routes. For example, if route is top, then route's pair is bottom.
     * 3. Find the dangerous route for the king. For example, if the king is in bottom left
     * of the piece, then the dangerous route is top right.
     * 4. If the dangerous route has dangerous piece(example: bishop and queen for bottom left,
     * top right, etc.) then remove the moves/routes that doesn't protect the king.
     *
     * @return if Array<Square> is given, then return Array<Square>. If Path is given, then
     * return Path.
     *
     * @see src/Engine/Core/MoveEngine.ts For more information.
     */
    private doKingSafety(moveRoute: Route): Route | null
    {
        /**
         * Find the king and king's square and enemy's color
         * by the given piece color.
         */
        const king: Piece | null = BoardManager.getKing(this.piece!.getColor());
        if(!king) return moveRoute;

        // Square of the king and enemy's color.
        const kingSquare: Square = BoardManager.getLocation(king)!;
        const enemyColor: Color = this.piece!.getColor() == Color.White ? Color.Black : Color.White;

        /**
         * Find the dangerous route for the king. For example,
         * if the king is in bottom left of the piece, then
         * the dangerous route is top right(because piece can
         * only protect king from one route at the same time).
         */
        let dangerousRoute: MoveRoute | null = null;

        /**
         * For find the dangerous route, get relative route of the piece and king.
         * Relative route is the route between piece and king.
         *
         * @see for more information about relative route src/Engine/Utils/Locator.ts
         */
        const relativeRoute = Locator.getRelative(this.pieceSquare!, kingSquare);
        if(!relativeRoute)
            // If dangerous route is null, then return the moves/routes without filtering.
            return moveRoute;

        /**
         * For find the dangerous route, get opposite route of relative route.
         *
         * @see for more information about opposite route src/Engine/Utils/Locator.ts
         */
        dangerousRoute = Locator.getOpposite(relativeRoute);

        /**
         * Find the dangerous piece types by the dangerous route. For example,
         * if the dangerous route is top left, then dangerous piece types are
         * bishop and queen. If the dangerous route is top, then dangerous piece
         * types are rook and queen.
         */
        const dangerousPieces: Array<PieceType> = [MoveRoute.TopLeft, MoveRoute.TopRight, MoveRoute.BottomLeft, MoveRoute.BottomRight].includes(dangerousRoute)
            ? [PieceType.Bishop, PieceType.Queen]
            : [PieceType.Rook, PieceType.Queen];

        /**
         * Traverse the all routes(getQueenRoute() method returns all routes like
         * diagonal, horizontal and vertical routes) of the piece and find the
         * dangerous pieces by dangerous route in all routes. Then, remove the
         * routes that doesn't protect the king from the dangerous pieces.
         */
        const allRoutes: Route = this.routeCalculator.getQueenRoute(this.pieceSquare!);
        for(const square of allRoutes[dangerousRoute]!){
            // If route has any dangerous piece, then(next step)
            if(BoardManager.hasPiece(square, enemyColor, dangerousPieces)){
                /**
                 * If moveRoute has MoveRoute.L, then it means that we are in
                 * getKnightMoves() method. In this case, knight can't
                 * attack while protecting the king. So, we can return
                 * null.
                 */
                if(moveRoute[MoveRoute.L])
                    return null;

                /**
                 * Remove the moves/routes that doesn't protect the king.
                 * For example, moveRoutes has top and bottom routes. If
                 * player's king is in top left of the piece, and enemy's
                 * queen is in bottom right of the piece, then remove
                 * top and bottom routes from the moveRoutes.
                 */
                for (const route in moveRoute) {
                    if(route != dangerousRoute && route != relativeRoute)
                        delete moveRoute[route as MoveRoute];
                }
                break;
            }
        }

        // Return the filtered moves/routes.
        return moveRoute;
    }
}












