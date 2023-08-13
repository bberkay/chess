import { Square } from "../../Types";

export class StateChecker {
    public static isSquareThreatened(square: Square): boolean
    {
        return false;
    }

    public static isPlayerInCheck(): boolean
    {
        return false;
    }

    public static isPlayerInCheckmate(): boolean
    {
        return false;
    }

    public static isPlayerInStalemate(): boolean
    {
        return false;
    }
}