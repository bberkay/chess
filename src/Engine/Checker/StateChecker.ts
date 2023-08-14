import { Square } from "../../Types";

export class StateChecker {
    /**
     * This class is responsible for checking if the specific state is available like
     * check, checkmate and stalemate. Also, it checks if the specific square is threatened.
     *
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */

    /**
     * @description Check if the given square is threatened by the opponent.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isSquareThreatened(square: Square): boolean
    {
        return false;
    }

    /**
     * @description Check if the player is in check.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInCheck(): boolean
    {
        return false;
    }

    /**
     * @description Check if the player is in checkmate.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInCheckmate(): boolean
    {
        return false;
    }

    /**
     * @description Check if the player is in stalemate.
     * @see src/Engine/Checker/StateChecker.ts For more information.
     */
    public static isPlayerInStalemate(): boolean
    {
        return false;
    }
}