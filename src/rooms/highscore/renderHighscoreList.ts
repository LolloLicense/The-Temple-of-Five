/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------- HIGHSCORE STORAGE --------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

import { getHighscores, type THighscoreEntry } from "./highscoreStorage";

/**
 * Render highscores into #highscoreList.
 * This renderer only displays data
 */
export function renderHighscoreList(): void {
    const listEl = document.querySelector<HTMLOListElement>("#highscoreList");
    if (!listEl) return;

    // Clear previous list content 
    listEl.replaceChildren();

    const highscores: THighscoreEntry[] = getHighscores();

    // Empty state
    if (highscores.length === 0) {
        const li = document.createElement("li");

        const left = document.createElement("span");
        left.textContent = "No highscores yet";

        const right = document.createElement("span");
        right.textContent = "—";

        li.append(left, right);
        listEl.append(li);
        return;
    }

    // Render each entry
    for (const entry of highscores) {
        const li = document.createElement("li");

        const nameSpan = document.createElement("span");
        nameSpan.textContent = entry.name;

        const scoreSpan = document.createElement("span");
        scoreSpan.textContent = `${entry.score}`;

        li.append(nameSpan, scoreSpan);
        listEl.append(li);
    }
}