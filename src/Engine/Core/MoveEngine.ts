import {Color, MoveRoute, Path, Square, PieceType, Piece} from "../../Types.ts";
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
        // TODO: getMoves Array<Square> | null yerine {square: MoveType} şeklinde bir obje döndürülebilir.
        // TODO: Eğer object e döndürülürse zaten converter ile çevirmeye gerek kalmaz.

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
                return Converter.convertPathToMoves(this.getPawnMoves()!);
            case PieceType.Knight:
                return this.getKnightMoves();
            case PieceType.Bishop:
                return Converter.convertPathToMoves(this.getBishopMoves()!);
            case PieceType.Rook:
                return Converter.convertPathToMoves(this.getRookMoves()!);
            case PieceType.Queen:
                return Converter.convertPathToMoves(this.getQueenMoves()!);
            case PieceType.King:
                return Converter.convertPathToMoves(this.getKingMoves()!);
            default:
                return null;
        }
    }

    /**
     * Get the possible moves of the pawn on the given square.
     */
    private getPawnMoves(): Path | null
    {
        // Find possible moves of the pawn.
        let moves: Path = this.routeCalculator.getPawnRoute(this.pieceSquare!);
        if(!moves) return null;

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
        for(let route in moves){
            if(route != moveDirection.vertical && route != moveDirection.leftDiagonal && route != moveDirection.rightDiagonal)
                delete moves[route as MoveRoute];
        }

        /**
         * Filter second square of the vertical route by the pawn's color and row.
         *
         * If pawn is white and is not on the seventh row
         * or if pawn is black and is not on the second row,
         * then remove the second square of the vertical route.
         */
        if(Locator.getRow(this.pieceSquare!) != (color == Color.White ? 7 : 2))
            moves[moveDirection.vertical]!.splice(1, 1);

        /**
         * Filter diagonal routes by the pawn's color and has enemy status.
         *
         * If the diagonal squares has no enemy piece, then remove
         * the diagonal routes from the moves.
         */
        if(!BoardManager.hasPiece(moves[moveDirection.leftDiagonal]![0], enemyColor))
            delete moves[moveDirection.leftDiagonal];

        if(!BoardManager.hasPiece(moves[moveDirection.rightDiagonal]![0], enemyColor))
            delete moves[moveDirection.rightDiagonal];

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
            moves[moveDirection.leftDiagonal]!.push(color == Color.White ? this.pieceSquare! - 9 : this.pieceSquare! + 7);

        // Add right en passant move to the pawn's moves.
        if(MoveChecker.isRightEnPassantAvailable(this.pieceSquare!))
            moves[moveDirection.rightDiagonal]!.push(color == Color.White ? this.pieceSquare! - 7 : this.pieceSquare! + 9);


        // Filter the moves for king safety.
        return this.doKingSafety(moves) as Path;
    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    private getKnightMoves(): Array<Square> | null
    {
        let moves: Array<Square> = this.routeCalculator.getKnightRoute(this.pieceSquare!);
        if(!moves) return null;

        /**
         * Knight has no defined route(top, bottom, etc.) like other pieces.
         * So, getKnightRoute() method returns an array of squares, and we
         * don't need to convert it(with convertPathToMoves method) like
         * other pieces.
         *
         * @see for more information about knight moves https://en.wikipedia.org/wiki/Knight_(chess)
         */
        // Filter the moves for king safety.
        return this.doKingSafety(moves) as Array<Square>;
    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    private getBishopMoves(): Path | null
    {
        let moves: Path = this.routeCalculator.getBishopRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety.
        return this.doKingSafety(moves) as Path;
    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    private getRookMoves(): Path | null
    {
        let moves: Path = this.routeCalculator.getRookRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety.
        return this.doKingSafety(moves) as Path;
    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    private getQueenMoves(): Path| null
    {
        let moves: Path = this.routeCalculator.getQueenRoute(this.pieceSquare!);
        if(!moves) return null;

        // Filter the moves for king safety.
        return this.doKingSafety(moves) as Path;
    }

    /**
     * Get the possible moves of the king on the given square.
     */
    private getKingMoves(): Path | null
    {
        let moves: Path = this.routeCalculator.getKingRoute(this.pieceSquare!);
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

        // Return extended moves.
        return moves;
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
    private doKingSafety(moveRoutes: Array<Square> | Path): Array<Square> | Path
    {
        /**
         * Find the king and king's square and enemy's color
         * by the given piece color.
         */
        const king: Piece | null = BoardManager.getKing(this.piece!.getColor());
        if(!king) return moveRoutes;

        // Square of the king and enemy's color.
        const kingSquare: Square = BoardManager.getSquare(king)!;
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
            return moveRoutes;

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
        const allRoutes: Path = this.routeCalculator.getQueenRoute(this.pieceSquare!);
        for(const square of allRoutes[dangerousRoute]!){
            // If route has any dangerous piece, then(next step)
            if(BoardManager.hasPiece(square, enemyColor, dangerousPieces)){
                /**
                 * If moveRoutes is array, then it means that we are in
                 * getKnightMoves() method. In this case, knight can't
                 * attack while protecting the king. So, we can return
                 * empty array.
                 */
                if(moveRoutes instanceof Array)
                    return [];

                /**
                 * Remove the moves/routes that doesn't protect the king.
                 * For example, moveRoutes has top and bottom routes. If
                 * player's king is in top left of the piece, and enemy's
                 * queen is in bottom right of the piece, then remove
                 * top and bottom routes from the moveRoutes.
                 */
                for (const route in moveRoutes) {
                    if(route != dangerousRoute && route != relativeRoute)
                        delete moveRoutes[route as MoveRoute];
                }
                break;
            }
        }

        // Return the filtered moves/routes.
        return moveRoutes;
    }
}












