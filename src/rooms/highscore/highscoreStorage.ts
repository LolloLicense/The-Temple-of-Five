/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------- HIGHSCORE STORAGE --------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

const HIGHSCORE_KEY = "tempelHighscores";
const MAX_HIGHSCORES = 10;

export type THighscoreEntry = {
  name: string;
  score: number;
  createdAtIso: string;
};

/**
 * Normalize player names so we can compare fairly.
 * - trims whitespace
 * - compares case-insensitive
 * - Example Alex, ALEX, alex - would be considered the same player.
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns a normalized list:
 * - One entry per player (best score only)
 * - Sorted by score desc
 * - Limited to top 10
 */
function normalizeHighscores(entries: THighscoreEntry[]): THighscoreEntry[] {
  const bestByPlayer = new Map<string, THighscoreEntry>();

  for (const entry of entries) {
    const key = normalizeName(entry.name);
    const currentBest = bestByPlayer.get(key);

    // Keep the entry with the highest score
    if (!currentBest || entry.score > currentBest.score) {
      bestByPlayer.set(key, entry);
    }
  }

  const unique = Array.from(bestByPlayer.values());

  unique.sort((a, b) => b.score - a.score);

  return unique.slice(0, MAX_HIGHSCORES);
}

/**
 * Read highscores from LocalStorage.
 * Always returns: unique players, best score, top 10.
 */
export function getHighscores(): THighscoreEntry[] {
  const raw = localStorage.getItem(HIGHSCORE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const entries = Array.isArray(parsed) ? (parsed as THighscoreEntry[]) : [];
    return normalizeHighscores(entries);
  } catch {
    return [];
  }
}

/**
 * Save raw highscores list to LocalStorage.
 * NOTE: We can save already-normalized data to keep storage clean.
 */
function setHighscores(entries: THighscoreEntry[]): void {
  localStorage.setItem(HIGHSCORE_KEY, JSON.stringify(entries));
}

/**
 * Add/update a player's score.
 * If the player already exists, only keep their best score.
 * Result saved normalized for safety (unique + top 10).
 */
export function pushHighscore(
  entry: Omit<THighscoreEntry, "createdAtIso">,
): void {
  const existing = getHighscores(); // already normalized
  const key = normalizeName(entry.name);

  const nextRaw: THighscoreEntry[] = [...existing];

  const idx = nextRaw.findIndex((e) => normalizeName(e.name) === key);

  const nextEntry: THighscoreEntry = {
    ...entry,
    createdAtIso: new Date().toISOString(),
  };

  if (idx === -1) {
    // New player
    nextRaw.push(nextEntry);
  } else {
    // Existing player: keep best score
    const prev = nextRaw[idx];
    if (entry.score > prev.score) {
      nextRaw[idx] = nextEntry;
    }
    // If new score is worse/equal, do nothing.
  }

  setHighscores(normalizeHighscores(nextRaw));

  // Notify that leaderboard changed
  window.dispatchEvent(new Event("highscores:changed"));
}

/**
 * Clears the entire leaderboard.
 * Dispatch event so UI can update instantly.
 */
export function resetHighscores(): void {
  localStorage.removeItem(HIGHSCORE_KEY);


  window.dispatchEvent(new Event("highscores:changed"));
}
