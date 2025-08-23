import { fact } from "./math.utils";

/**
 * Generates a random numeric ID string of the specified length.
 * Ensures the generated ID is not in the `notThis` list, retrying if needed.
 */
export function createRandomId(
    length: number,
    notThis: string | string[] | null = null,
): string {
    const MAX_RETRY = fact(length);
    const characters = "0123456789";
    notThis = typeof notThis === "string" ? [notThis] : notThis;

    const create = () => {
        let result: string = "";
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * characters.length)
            );
        }
        return result;
    }

    for (let i = 1; i <= MAX_RETRY; i++) {
        const randId = create();
        if (!notThis || !notThis.includes(randId)) {
            return randId;
        }
    }

    throw new Error(
        `Failed to generate a unique ID of length ${length} after ${MAX_RETRY} attempts.`
    );
}
