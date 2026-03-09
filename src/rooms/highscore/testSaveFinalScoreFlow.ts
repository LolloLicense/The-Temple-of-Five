import { getUserName } from "../../script/helper/storage";
import { pushHighscore } from "./highscoreStorage";
import { saveFinalScoreToStorage } from "./saveFinalScoreToStorage";
import { calculateFinalScoreFromStorage } from "./calculateFinalScore";

/**
 * Test helper for the full score flow.
 *
 * WHAT IT DOES
 * 1. Calculates final score
 * 2. Saves final score to LocalStorage
 * 3. Pushes the same score to highscores
 * 4. Logs the full result for debugging
 *
 * - to verify that score, LocalStorage, and leaderboard all work
 */
export function testSaveFinalScoreFlow(): void {
    const userName = getUserName();
    if (!userName) return;

    const fullScoreResult = calculateFinalScoreFromStorage();
    const finalScore = saveFinalScoreToStorage();

    pushHighscore({
        name: userName,
        score: finalScore,
    });

    console.log("Final score result:", fullScoreResult);
    console.log("Saved final score:", finalScore);
}