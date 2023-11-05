/**
 * @module ChessPlatform
 * @description This class is the main class of the chess platform. It provides the connections between the chess, menu and other systems.
 * @version 1.0.0
 * @author Berkay Kaya <berkaykayaforbusiness@outlook.com> (https://bberkay.github.io)
 * @url https://github.com/bberkay/chess-platform
 * @license MIT
 */

import { Chess } from './Chess/Chess.ts';
import { Platform } from "./Platform/Platform.ts";
import { PlatformConfig } from "./Platform/Types";

/**
 * This class is the main class of the chess platform.
 * It provides the connections between the chess, menu and other systems.
 */
export class ChessPlatform{

    public readonly chess: Chess;
    private readonly platform: Platform;

    /**
     * Constructor of the ChessPlatform class.
     */
    constructor(enableCaching: boolean = true, platformConfig: PlatformConfig | null = null) {
        this.chess = new Chess(enableCaching);
        this.platform = new Platform(this.chess, platformConfig === null ? {
            enableNotationMenu: true,
            enableLogConsole: true,
            enableGameCreator: true
        } : platformConfig);
    }
}
