import { CacheManager } from "./CacheManager.ts";
import { Board, Square, Piece, Color, PieceType, CacheLayer } from "../Types.ts";
export class BoardManager {
    /**
     * This class provides the board management of the game.
     */

    /**
     * @description Board of the game.
     */
    private static currentBoard: Board = {
        [Square.a1]: null, [Square.a2]: null, [Square.a3]: null, [Square.a4]: null, [Square.a5]: null, [Square.a6]: null, [Square.a7]: null, [Square.a8]: null,
        [Square.b1]: null, [Square.b2]: null, [Square.b3]: null, [Square.b4]: null, [Square.b5]: null, [Square.b6]: null, [Square.b7]: null, [Square.b8]: null,
        [Square.c1]: null, [Square.c2]: null, [Square.c3]: null, [Square.c4]: null, [Square.c5]: null, [Square.c6]: null, [Square.c7]: null, [Square.c8]: null,
        [Square.d1]: null, [Square.d2]: null, [Square.d3]: null, [Square.d4]: null, [Square.d5]: null, [Square.d6]: null, [Square.d7]: null, [Square.d8]: null,
        [Square.e1]: null, [Square.e2]: null, [Square.e3]: null, [Square.e4]: null, [Square.e5]: null, [Square.e6]: null, [Square.e7]: null, [Square.e8]: null,
        [Square.f1]: null, [Square.f2]: null, [Square.f3]: null, [Square.f4]: null, [Square.f5]: null, [Square.f6]: null, [Square.f7]: null, [Square.f8]: null,
        [Square.g1]: null, [Square.g2]: null, [Square.g3]: null, [Square.g4]: null, [Square.g5]: null, [Square.g6]: null, [Square.g7]: null, [Square.g8]: null,
        [Square.h1]: null, [Square.h2]: null, [Square.h3]: null, [Square.h4]: null, [Square.h5]: null, [Square.h6]: null, [Square.h7]: null, [Square.h8]: null,
    };

    /**
     * @description List of piece ids.
     */
    private static pieceIds: Array<number> = [];

    /**
     * @description Get current board
     */
    static getBoard(): Board
    {
        return BoardManager.currentBoard;
    }

    /**
     * @description Get piece with the given square.
     */
    public static getPiece(square: Square): Piece | null
    {
        return BoardManager.currentBoard[square] ?? null;
    }

    /**
     * @description Get all pieces by color and/or type.
     * @example getPieces(Color.White, [PieceType.King, PieceType.Queen]); // Returns all white kings and queens.
     */
    public static getPieces(targetColor: Color | null = null, targetTypes: Array<PieceType> | null = null): Array<Piece>
    {
        const pieces: Array<Piece> = [];

        for(let square in BoardManager.getBoard()){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;

            // If the square has a piece and the piece color and type is the same with the given color and type
            if(BoardManager.hasPiece(squareKey, targetColor, targetTypes))
                pieces.push(this.getPiece(squareKey) as Piece); // Add the piece to the list.
        }

        return pieces;
    }

    /**
     * Has the given square a piece?
     * @example hasPiece(Square.a1, Color.White, [PieceType.King, PieceType.Queen]); // Returns true if the square has a white king or queen.
     */
    public static hasPiece(square: Square, specificColor: Color | null = null, specificTypes: Array<PieceType> | null = null): boolean
    {
        const squareContent: Piece | null = this.getPiece(square);

        // If there is no piece on the square
        if(!squareContent)
            return false;

        // If the piece color is not the same with the given color
        if(specificColor && squareContent.getColor() != specificColor)
            return false;

        // If the piece type is not the same with the given type
        if(specificTypes && !specificTypes.includes(squareContent.getType()))
            return false;

        return true;
    }

    /**
     * Get square of the given piece
     * @example getLocation(pieceObject); // Returns Square.a1 if the piece is on a1.
     */
    public static getLocation(piece: Piece): Square | null
    {
        for(let square in BoardManager.getBoard()){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;

            // If the square has a piece and the piece is the same with the given piece
            if(BoardManager.hasPiece(squareKey) && BoardManager.getPiece(squareKey) === piece)
                return squareKey;
        }

        return null;
    }

    /**
     * @description Get all piece ids
     */
    public static getPieceIds(): Array<number>
    {
        return BoardManager.pieceIds;
    }

    /**
     * @description Add piece to square
     */
    public static addPiece(square: Square, piece: Piece): void
    {
        this.currentBoard[square] = piece;

        // Add to cache
        CacheManager.set(CacheLayer.Game,"currentBoard", BoardManager.currentBoard);
    }

    /**
     * @description Remove piece from square
     */
    public static removePiece(square: Square): void
    {
        this.currentBoard[square] = null;

        // Add to cache
        CacheManager.set(CacheLayer.Game,"currentBoard", BoardManager.currentBoard);
    }

    /**
     * @description Add id to piece id list
     */
    public static addPieceIds(id: number): void
    {
        BoardManager.pieceIds.push(id);

        // Add to cache
        CacheManager.set(CacheLayer.Game, "pieceIds", BoardManager.pieceIds);
    }

    /**
     * @description Set piece id list to the given list
     */
    public static setPieceIds(pieceIds: Array<number> | null): void
    {
        BoardManager.pieceIds = pieceIds ?? [];

        // Add to cache
        CacheManager.set(CacheLayer.Game, "pieceIds", BoardManager.pieceIds);
    }

    /**
     * @description Clear current board and piece ids list
     */
    public static clear(): void
    {
        // Clear current board
        for(let square in BoardManager.getBoard()){
            // Convert square to Square type.
            let squareKey: Square = Number(square) as Square;

            // Remove piece from square
            BoardManager.removePiece(squareKey);
        }

        // Clear piece ids
        BoardManager.setPieceIds(null);
    }

}