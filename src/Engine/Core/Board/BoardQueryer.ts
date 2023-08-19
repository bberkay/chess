import { Board } from "./Board";
import { Square, Color, PieceType } from "Types";
import { Piece, Route, MoveRoute, CastlingType, EnPassantDirection } from "Types/Engine";
import { RouteCalculator } from "Engine/Core/Move/Calculator/RouteCalculator.ts";


/**
 * TODO: Add description
 */
export class BoardQueryer extends Board{

    /**
     * Get current board
     */
    public static getBoard(): Record<Square, Piece | null>
    {
        return Board.currentBoard;
    }

    /**
     * Get current player
     */
    public static getTurn(): Color
    {
        return Board.currentColor;
    }

    /**
     * Get enemy color
     */
    public static getOpponent(): Color
    {
        return Board.currentColor === Color.White ? Color.Black : Color.White;
    }

    /**
     * Get move count
     */
    public static getMoveCount(): number
    {
        return Board.moveCount;
    }

    /**
     * Get piece with the given square.
     */
    public static getPieceOnSquare(square: Square): Piece | null
    {
        return Board.currentBoard[square] ?? null;
    }

    /**
     * Get square of the given piece.
     */
    public static getSquareOfPiece(piece: Piece): Square | null
    {
        for(let square in this.getBoard()){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;

            // If the square has a piece and the piece is the same with the given piece then return the square.
            if(this.isSquareHasPiece(squareKey) && this.getPieceOnSquare(squareKey) === piece)
                return squareKey;
        }

        return null;
    }

    /**
     * Get all pieces by color and/or type.
     * @example getPieces(Color.White, [PieceType.King, PieceType.Queen]); // Returns all white kings and queens.
     */
    public static getPiecesWithFilter(targetColor: Color | null = null, targetTypes: Array<PieceType> | null = null): Array<Piece>
    {
        const pieces: Array<Piece> = [];

        for(let square in this.getBoard()){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;

            /**
             * If the square has a piece and the piece color and type is the same with the given color and type
             * then add the piece to the list.
             */
            if(this.isSquareHasPiece(squareKey, targetColor, targetTypes))
                pieces.push(this.getPieceOnSquare(squareKey) as Piece);
        }

        return pieces;
    }

    /**
     * Get king of the given color
     */
    public static getKingByColor(color: Color): Piece | null
    {
        return Board.kings[color];
    }

    /**
     * Find player's color by given square
     */
    public static getColorBySquare(square: Square): Color | null
    {
        return this.isSquareHasPiece(square) ? this.getPieceOnSquare(square)!.getColor() : null;
    }

    /**
     * Has the given square a piece?
     * @example hasPiece(Square.a1, Color.White, [PieceType.King, PieceType.Queen]); // Returns true if the square has a white king or queen.
     */
    public static isSquareHasPiece(square: Square, specificColor: Color | null = null, specificTypes: Array<PieceType> | PieceType | null = null): boolean
    {
        const squareContent: Piece | null = this.getPieceOnSquare(square);

        // If there is no piece on the square
        if(!squareContent)
            return false;

        // If the piece color is not the same with the given color
        if(specificColor && squareContent.getColor() != specificColor)
            return false;

        /**
         * If specificTypes is null then return true, if not null then:
         * - If the given type is an array then check if the piece type is in the array
         * - If the given type is not an array then check if the piece type is the same with the given type
         */
        return !(specificTypes && (
            (Array.isArray(specificTypes) && !specificTypes.includes(squareContent.getType()))
            ||
            (!Array.isArray(specificTypes) && squareContent.getType() != specificTypes)
        ));


    }

    /**
     * Check if the given square is threatened by the opponent.
     *
     * Algorithm:
     * 1. Get the color of the enemy player with the piece on the given square or with the StateManager.
     * 2. Get queen, rook, bishop routes and check if any of them contains any enemy piece.
     * 3. Get pawn routes and check if any of them contains any enemy piece.
     * 4. Get knight routes and check if any of them contains any enemy piece.
     * 5. If any of the routes not contains any enemy piece, then return false.
     */
    public static isSquareThreatened(square: Square): boolean
    {
        /**
         * Get the color of enemy player with the piece on the given square.
         * If square has no piece, then use StateManager.
         *
         * @see For more information about the StateManager, please check the src/Managers/StateManager.ts
         */
        const piece: Piece | null = this.getPieceOnSquare(square);
        const enemyColor: Color = piece ? (piece.getColor() == Color.White ? Color.Black : Color.White) : this.getEnemyColor();

        /**
         * Get all routes of the opponent pieces.
         * Queen already contains all pieces' routes except knight.
         * So, we can get all dangerous squares with queen and knight
         * routes.
         *
         * @see src/Engine/Core/Calculator/RouteCalculator.ts For more information.
         */
        const allRoutes: Route = {
            ...RouteCalculator.getQueenRoute(square),
            ...RouteCalculator.getKnightRoute(square)
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
                if(this.isSquareHasPiece(square, enemyColor, enemyTypes))
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
            if(this.isSquareHasPiece(square, enemyColor, PieceType.Pawn))
                return true;
        }

        // If any of the routes not contains any enemy piece, then return false.
        return false;
    }

    /**
     * Is player checked?
     */
    public static isPlayerChecked(): boolean
    {
        /**
         * Find the square of the player's king and
         * check if it is threatened.
         */
        return this.isSquareThreatened(
            this.getSquareOfPiece(this.getKingByColor(this.getPlayerColor())!)!
        );
    }

    /**
     * Get castling status
     * @example StateManager.getCastlingStatus(CastlingType.WhiteLong)
     */
    public static getCastlingStatus(castlingType: CastlingType): boolean
    {
        return Board.castlingStatus[castlingType];
    }

    /**
     * Get en passant status of pawn
     * @example StateManager.getEnPassantStatus(fourth number piece id) // Returns EnPassantDirection.Left and/or EnPassantDirection.Right and/or EnPassantDirection.Both
     */
    public static getBannedEnPassantPawns(pieceID: number): EnPassantDirection
    {
        return Board.enPassantBanStatus[pieceID];
    }
}