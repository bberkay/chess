import { Board } from "./Board.ts";
import { Square, Color, PieceType, CastlingType, JsonNotation } from "../../Types";
import { Piece, Route, MoveRoute } from "../Types";
import { RouteCalculator } from "../Move/Calculator/RouteCalculator.ts";


/**
 * This class provides the traversing and querying of the board.
 * Like, get all pieces, get piece on square, get square of piece, etc.
 */
export class BoardQueryer extends Board{

    /**
     * Get current game
     */
    public static getGame(): JsonNotation
    {
        /**
         * Get all pieces on the board and convert them to JsonNotation.
         * @see For more information about JsonNotation, please check the src/Chess/Types/index.ts
         */
        const pieces: Array<{color: Color, type:PieceType, square:Square}> = [];
        for(let square in this.getBoard()){
            const piece: Piece | null = this.getPieceOnSquare(Number(square) as Square);
            if(piece)
                pieces.push({color: piece.getColor(), type: piece.getType(), square: Number(square) as Square});
        }

        // Return the game as JsonNotation.
        return {
            board: pieces,
            turn: BoardQueryer.getColorOfTurn(),
            castling: BoardQueryer.getCastlingAvailability(),
            enPassant: BoardQueryer.getEnPassantSquare(),
            halfMoveClock: BoardQueryer.getHalfMoveCount(),
            fullMoveNumber: BoardQueryer.getMoveCount(),
            moveHistory: BoardQueryer.getMoveHistory(),
            scores: BoardQueryer.getScores()
        }
    }

    /**
     * Get current board
     */
    public static getBoard(): Record<Square, Piece | null>
    {
        return Board.currentBoard;
    }

    /**
     * Get current turn's color
     */
    public static getColorOfTurn(): Color
    {
        return Board.currentTurn;
    }

    /**
     * Get opponent's color
     */
    public static getColorOfOpponent(): Color
    {
        return Board.currentTurn === Color.White ? Color.Black : Color.White;
    }

    /**
     * Get move count
     */
    public static getMoveCount(): number
    {
        return Board.moveCount;
    }

    /**
     * Get en passant square
     */
    public static getEnPassantSquare(): Square | null
    {
        return Board.enPassantSquare;
    }

    /**
     * Get castling availability
     */
    public static getCastlingAvailability(): Record<CastlingType, boolean>
    {
        return Board.castlingAvailability;
    }

    /**
     * Get half move count
     */
    public static getHalfMoveCount(): number
    {
        return Board.halfMoveCount;
    }

    /**
     * Get move history
     */
    public static getMoveHistory(): string[]
    {
        return Board.moveHistory;
    }

    /**
     * Get scores
     */
    public static getScores(): Record<Color, {score: number, pieces: PieceType[]}>
    {
        return Board.scores;
    }

    /**
     * Is en passant available for given square?
     */
    public static isEnPassantAvailable(square: Square): boolean
    {
        return Board.enPassantSquare === square;
    }

    /**
     * Is castling available for given castling type?
     */
    public static isCastlingAvailable(castlingType: CastlingType): boolean
    {
        return Board.castlingAvailability[castlingType];
    }

    /**
     * Is en passant banned for given square?
     */
    public static isEnPassantBanned(square: Square): boolean
    {
        return Board.bannedEnPassantSquares.includes(square);
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
     * @example getPiecesWithFilter(Color.White, [PieceType.Rook, PieceType.Bishop]); // Returns all white rooks and bishops.
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
     * @param targetSquare Square to check
     * @param by Color of the opponent
     * @param getThreatening If true, then return enemy piece's square that are threatening the square.
     * @param calculatePawnBlocks If true, then calculate blocker pawns. Otherwise, calculate killer pawns.
     * @return If getThreatening is true, Array<Square>. Otherwise, boolean.
     *
     * Algorithm:
     * 1. Get the color of the enemy player with the piece on the given square or with the StateManager.
     * 2. Get queen, rook, bishop routes and check if any of them contains any enemy piece.
     * 3. Get pawn routes and check if any of them contains any enemy piece.
     * 4. Get knight routes and check if any of them contains any enemy piece.
     * 5. If any of the routes not contains any enemy piece, then return false.
     */
    public static isSquareThreatened(targetSquare: Square, by: Color | null = null, getThreatening: boolean = false, calculatePawnBlocks: boolean = false): boolean | Array<Square>
    {
        const squaresOfThreateningEnemies: Array<Square> = [];

        // Get the color of enemy player with the piece on the given square.
        const piece: Piece | null = this.getPieceOnSquare(targetSquare);
        const enemyColor: Color = by ?? (piece ? (piece.getColor() == Color.White ? Color.Black : Color.White) : this.getColorOfOpponent());

        /**
         * Get all routes of the opponent pieces.
         * Queen already contains all pieces' routes except knight.
         * So, we can get all dangerous squares with queen and knight
         * routes.
         *
         * @see src/Chess/Engine/Core/Move/Calculator/RouteCalculator.ts For more information.
         */
        const allRoutes: Route = {
            ...RouteCalculator.getQueenRoute(targetSquare, enemyColor == Color.White ? Color.Black : Color.White),
            ...RouteCalculator.getKnightRoute(targetSquare, enemyColor == Color.White ? Color.Black : Color.White)
        };

        /**
         * Traverse all routes and check if the route contains any dangerous enemy piece.
         * For example, if diagonal route contains any bishop or queen, then return true.
         * If horizontal route contains rook or queen, then return true, ..., etc.
         *
         * @see src/Chess/Engine/Core/Move/Calculator/RouteCalculator.ts For more information.
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
                if(this.isSquareHasPiece(square, enemyColor, enemyTypes)){
                    if(getThreatening)
                        squaresOfThreateningEnemies.push(square);
                    else
                        return true;
                }
            }
        }

        /**
         * Now, we have to check if any pawn is threatening the given square.
         * Why didn't we check the pawn in the previous loop ? Because pawns
         * kill and block moves are different. If calculatePawnBlocks is true,
         * then we have to check the blocker pawns. Otherwise, we have to check
         * the killer pawns
         *
         * @see For more information about pawn please check the src/Chess/Engine/Core/Move/MoveEngine.ts
         */
        const pawnRoutes: Array<MoveRoute> = calculatePawnBlocks
            ? (enemyColor == Color.White ? [MoveRoute.Bottom] : [MoveRoute.Top])
            : (enemyColor == Color.White ? [MoveRoute.BottomLeft, MoveRoute.BottomRight] : [MoveRoute.TopLeft, MoveRoute.TopRight]);

        // Loop through all pawn routes for enemy pawn threat.
        for (const route of pawnRoutes) {
            if(!calculatePawnBlocks)
            {
                // Get the first square of the route. Because pawn just attacks one square forward(diagonally).
                const square: Square = allRoutes[route]![0]!;

                // Check if any squares at the route contain any enemy piece.
                if (this.isSquareHasPiece(square, enemyColor, PieceType.Pawn)) {
                    if (getThreatening)
                        squaresOfThreateningEnemies.push(square);
                    else
                        return true;
                }
            }
            else
            {
                // If the route is not exists, then continue.
                if(!allRoutes[route])
                    continue;

                // Loop through all squares of the route and check if any of them has enemy pawn.
                for(const square of allRoutes[route]!){
                    if(this.isSquareHasPiece(square, enemyColor, PieceType.Pawn)){
                        if(getThreatening)
                            squaresOfThreateningEnemies.push(square);
                        else
                            return true;
                    }
                }
            }
        }


        // If getThreatening is true, then return squares of threatening enemies.
        // Otherwise, return false because if we are here, then there is no enemy threat.
        return getThreatening ? squaresOfThreateningEnemies : false;
    }
}