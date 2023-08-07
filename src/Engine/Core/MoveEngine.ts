import { Square, Color } from "../../Enums";
import { Converter } from "../../Utils/Converter";

import { RouteCalculator } from "./RouteCalculator.ts";

export class MoveEngine{
    /**
     * This class is responsible for calculating the possible moves of the pieces.
     */

    private routeCalculator: RouteCalculator;

    constructor() {
        this.routeCalculator = new RouteCalculator();
    }

    /**
     * Get the possible moves of the pawn on the given square.
     */
    getPawnMoves(square: Square): Array<Square> | null
    {

    }

    /**
     * Get the possible moves of the knight on the given square.
     */
    getKnightMoves(square: Square): Array<Square> | null
    {

    }

    /**
     * Get the possible moves of the bishop on the given square.
     */
    getBishopMoves(square: Square): Array<Square> | null
    {

    }

    /**
     * Get the possible moves of the rook on the given square.
     */
    getRookMoves(square: Square): Array<Square> | null
    {

    }

    /**
     * Get the possible moves of the queen on the given square.
     */
    getQueenMoves(square: Square): Array<Square> | null
    {

    }

    /**
     * Get the possible moves of the king on the given square.
     */
    getKingMoves(square: Square): Array<Square> | null
    {

    }

}