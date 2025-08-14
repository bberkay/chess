/**
 * @module Logger
 * @description
 * This module provides a centralized and extensible logging system for the ChessPlatform application.
 * It supports multiple logger instances (e.g., "Board", "Engine", "Chess") while storing all logs in a
 * shared `LogStore`, allowing unified log display across the app.
 */
export * from "./types.ts";
export { Logger } from "./Logger.ts";
export { LoggerError, LoggerErrorTemplates } from "./LoggerError.ts";
