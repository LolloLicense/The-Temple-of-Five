import {
    getUserName,
    scopedKey,
    LS_KEY,
} from "../../script/helper/storage";

/**
 * Reads the active user's saved total run time from LocalStorage.
 *
 * PURPOSE
 * - Used by score calculation
 * - Returns raw time in seconds
 * - Does not touch the DOM
 *
 * RETURNS
 * - number of seconds
 * - 0 if no user is active or no value exists
 */
export function getStoredTotalTimeSec(): number {
    const userName = getUserName();
    if (!userName) return 0;

    const raw = localStorage.getItem(scopedKey(LS_KEY.totalTime));
    if (!raw) return 0;

    const parsed = Number.parseInt(raw, 10);

    return Number.isNaN(parsed) ? 0 : parsed;
}