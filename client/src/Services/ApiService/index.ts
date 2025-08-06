/**
 * @module ApiService
 * @description
 * This module provides a type-safe client-side interface for interacting with the ChessPlatform server's HTTP API.
 * It includes route definitions, request/response typing, the core `ApiService` for making HTTP requests,
 * and a custom `ApiServiceError` class with structured error handling.
 */
export { GetRoutes, type GetReqScheme, PostRoutes, type PostReqScheme } from "./scheme.ts";
export { ApiService } from "./ApiService.ts";
export { ApiServiceError } from "./ApiServiceError.ts";
