/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------- HIGHSCORE SECRET RESET ------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

import { resetHighscores } from "./highscoreStorage";

/**
 * HIGH SCORE RESET - FOR DEV
 *
 * What it does:
 * 1. Listens to keyboard input globally
 * 2. Ignores typing inside inputs / textareas / editable fields
 * 3. Detects the secret word
 * 4. Reveals the hidden reset button
 */

/* ------------------------------------------------------------------------------ */

/**
 * Internal state (Almost the same as pogo stickers cheating panel :D ):
 * - reset buffer stores the latest typed characters
 * - lastKeyAt is used to clear the buffer if typing pauses too long
 * - secretBound prevents duplicate listeners
 */
let secretBound = false;
let buffer = "";
let lastKeyAt = 0;

/**
 * Secret phrase that unlocks the reset button.
 * Team-only feature
 */
const SECRET_CODE = "noobs";

export function initHighscoreSecret(): void {
    // No double listeners if called several times
    if (secretBound) return;
    secretBound = true;

    window.addEventListener("keydown", (e: KeyboardEvent) => {

        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();

        // Ignore typing inside form fields, return.
        const isTypingField =
            tag === "input" ||
            tag === "textarea" ||
            target?.isContentEditable === true;

        if (isTypingField) return;

        // Only allow single-character keys
        const key = e.key.toLowerCase();
        if (key.length !== 1) return;

        // Reset buffer if user pauses too long between keys (same as in dev panel)
        const now = Date.now();
        if (now - lastKeyAt > 900) {
            buffer = "";
        }
        lastKeyAt = now;

        // Add new key to the buffer
        buffer += key;

        // Keep the buffer from growing forever
        if (buffer.length > 20) {
            buffer = buffer.slice(-20);
        }

        // Reveal reset button when secret code is detected
        if (buffer.endsWith(SECRET_CODE)) {
            buffer = "";
            revealHighscoreResetButton();
        }
    });
}

/**
 * Reveals the hidden reset button inside the highscore room.
 * Button is already present in HTML but hidden by default.
 */
function revealHighscoreResetButton(): void {
    const resetBtn =
        document.querySelector<HTMLButtonElement>("#resetHighscoreBtn");

    if (!resetBtn) return;

    resetBtn.hidden = false;
}

/**
 * Binds the reset button once.
 * - clears the leaderboard
 * - hides itself again after use
 */
export function initHighscoreResetButton(): void {
    const resetBtn =
        document.querySelector<HTMLButtonElement>("#resetHighscoreBtn");

    if (!resetBtn) return;

    // No double listeners
    if (resetBtn.dataset.bound === "true") return;
    resetBtn.dataset.bound = "true";

    resetBtn.addEventListener("click", () => {
        const confirmed = window.confirm(
            "Reset the entire Highscore leaderboard?",
        );

        if (!confirmed) return;

        resetHighscores();

        // Hide button again after reset
        resetBtn.hidden = true;
    });
}

