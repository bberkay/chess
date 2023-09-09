import { ChessConfig } from "../Chess/Types";
import { PlatformConfig } from "../Platform/Types";

/**
 * ChessPlatformConfig interface for the ChessPlatform configuration.
 * @see For more information, check src/ChessPlatform.ts
 * @see For more information about ChessConfig, check src/Chess/Chess.ts
 * @see For more information about PlatformConfig, check src/Platform/Platform.ts
 */
export type ChessPlatformConfig = {
    chessConfig?: ChessConfig,
    platformConfig?: PlatformConfig
}