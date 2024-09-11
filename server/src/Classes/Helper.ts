/**
 * Create a random user token.
 */
export function createUserToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

