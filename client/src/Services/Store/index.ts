/* @module StoreService
 * @description
 * This module provides a unified interface for client-side local storage management
 * using a centralized, type-safe system. It handles storing, retrieving, validating,
 * and expiring data in `localStorage`.
 */
export { StoreKey } from "./types.ts";
export { Store } from "./Store.ts";
export { StoreError } from "./StoreError.ts";
