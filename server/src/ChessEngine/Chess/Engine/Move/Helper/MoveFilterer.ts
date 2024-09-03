import {Color, GameStatus, PieceType, Square} from "../../../Types/index.ts";
import {MoveRoute, Piece, Route} from "../../Types/index.ts";
import {BoardQuerier} from "../../Board/BoardQuerier.ts";
import {Locator} from "../Utils/Locator.ts";
import {RouteCalculator} from "../Calculator/RouteCalculator.ts";

/**
 * This class is responsible for filtering the moves of the
 * piece for the king's safety.
 *
 * @see src/Chess/Engine/Move/MoveEngine.ts
 */
export class MoveFilterer{
    private threatsOfKing: Square[] = [];

    /**
     * Filter the moves of the piece for the king's safety.
     */
    public filterForKingSafety(pieceSquare: Square, pieceColor: Color, moveRoute: Route): Route | null
    {
        return this.removeUnsacrificeMoves(
            pieceColor,
            this.removeUnprotectMoves(pieceSquare, pieceColor, moveRoute)!
        );
    }

    /**
     * Remove the moves of the piece that doesn't protect the king.
     * For example, if the king is in check, then remove the moves
     * that doesn't block or capture the enemy/threat.
     */
    private removeUnsacrificeMoves(pieceColor: Color, moveRoute: Route): Route | null
    {
        if(!moveRoute)
            return null;

        // Get the threats of the king.
        this.threatsOfKing = this._findThreatsOfKing(pieceColor);

        // If king threatened by multiple enemies then king can't protect so mandatory moves calculation is unnecessary.
        if(this.threatsOfKing.length > 1)
            return null;
        else if(this.threatsOfKing.length < 1)
            return moveRoute;

        // Find the route that threat the player's king.
        const squareOfKing: Square = BoardQuerier.getSquareOfPiece(BoardQuerier.getPiecesWithFilter(pieceColor, [PieceType.King])[0] as Piece) as Square;
        const isEnemyKnight: boolean = BoardQuerier.getPieceOnSquare(this.threatsOfKing[0])!.getType() == PieceType.Knight;

        /**
         * If enemy is knight then check if the piece can capture the knight, if it is then return the only capture move.
         * If piece can't capture the knight then return null because knight can't be blocked.
         */
        if(isEnemyKnight){
            for(const route in moveRoute){
                moveRoute[<MoveRoute>route] = !moveRoute[<MoveRoute>route]!.includes(this.threatsOfKing[0]) ? [] : [this.threatsOfKing[0]];
            }

            return moveRoute;
        }

        // If enemy is not knight then find the dangerous route of the threat because it can be blocked.
        const dangerousRouteOfThreat: Square[] = RouteCalculator.getRouteBySquare(this.threatsOfKing[0])[Locator.getRelative(squareOfKing, this.threatsOfKing[0])!]!

        // If there is no square between king and enemy then there will be no block so return null.
        if(!dangerousRouteOfThreat || dangerousRouteOfThreat.length < 1)
            return null;

        // Delete the moves that doesn't block or capture the enemy/threat.
        for(const route in moveRoute){
            for(const square of moveRoute[<MoveRoute>route]!){
                if(!dangerousRouteOfThreat.includes(square) && square != this.threatsOfKing[0])
                    delete moveRoute[<MoveRoute>route]![moveRoute[<MoveRoute>route]!.indexOf(square)];
            }
        }

        return moveRoute;
    }

    /**
     * Remove the moves of piece for the king's safety. For example,
     * if player's king behind of the piece and enemy's queen is in
     * front of the piece, then remove horizontal and diagonal routes
     * from the moves of the piece.
     */
    private removeUnprotectMoves(pieceSquare: Square, pieceColor: Color, moveRoute: Route): Route | null
    {
        /**
         * Find the king and king's square and enemy's color
         * by the given piece color.
         */
        const king: Piece | null = BoardQuerier.getPiecesWithFilter(pieceColor, [PieceType.King])[0];
        if(!king) return moveRoute;

        // Square of the king and enemy's color.
        const kingSquare: Square = BoardQuerier.getSquareOfPiece(king)!;
        const enemyColor: Color = pieceColor == Color.White ? Color.Black : Color.White;

        /**
         * Find the dangerous route for the king. For example,
         * if the king is in bottom left of the piece, then
         * the dangerous route is top right(because piece can
         * only protect king from one route at the same time).
         */
        let dangerousRoute: MoveRoute;

        /**
         * For find the dangerous route, get relative route of the piece and king.
         * Relative route is the route between piece and king.
         *
         * @see for more information about relative route src/Chess/Engine/Move/Utils/Locator.ts
         */
        const relativeRoute: MoveRoute | null = Locator.getRelative(kingSquare, pieceSquare);
        if(!relativeRoute)
            // If dangerous route is null, then return the moves/routes without filtering.
            return moveRoute;

        /**
         * For find the dangerous route, get opposite route of relative route.
         *
         * @see for more information about opposite route src/Chess/Engine/Move/Utils/Locator.ts
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
        const allRoutes: Route = RouteCalculator.getAllRoutes(pieceSquare);

        /**
         * First check is there a piece between king and piece, if there is then piece doesn't have to
         * protect the king.
         */
        if(!BoardQuerier.isSquareHasPiece(Locator.getNext(allRoutes[relativeRoute]!, relativeRoute, pieceSquare), pieceColor, [PieceType.King]))
            return moveRoute;

        // If there is no piece between king and piece, then check the dangerous pieces.
        for(const square of allRoutes[dangerousRoute]!){
            // If route has any dangerous piece, then(next step)
            if(BoardQuerier.isSquareHasPiece(square, enemyColor, dangerousPieces)){
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

    /**
     * Find the threats of the king and return them. Also,
     * function will store the threats of the king in the
     * threatsOfKing property for unnecessary calculation.
     * If move count is not changed after the last calculation,
     * then return the threats of king from the threatsOfKing
     */
    private _findThreatsOfKing(kingColor: Color): Square[]
    {
        // If game is not in check status then there is no threat to the king.
        if(BoardQuerier.getBoardStatus() != GameStatus.BlackInCheck && BoardQuerier.getBoardStatus() != GameStatus.WhiteInCheck)
            return [];

        // Find the enemies that threat the king.
        const squareOfKing: Square = BoardQuerier.getSquareOfPiece(BoardQuerier.getPiecesWithFilter(kingColor, [PieceType.King])[0] as Piece) as Square;
        this.threatsOfKing = BoardQuerier.isSquareThreatened(squareOfKing, kingColor == Color.White ? Color.Black : Color.White, true) as Square[];

        // Return the threats of king.
        return this.threatsOfKing;
    }
}
