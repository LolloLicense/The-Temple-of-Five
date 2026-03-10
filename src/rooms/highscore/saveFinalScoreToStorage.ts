import { LS_KEY, scopedKey } from "../../script/helper/storage";
import { calculateFinalScoreFromStorage } from "./calculateFinalScore";

/**
 * Calculates the active user's final score
 * and saves it to LocalStorage.
 *
 * STORAGE KEY
 * - tempelFinalScore::userName
 *
 * RETURNS
 * - the saved final score as a number
 */
export function saveFinalScoreToStorage(): number {
  const scoreResult = calculateFinalScoreFromStorage();
  const finalScore = scoreResult.totalScore;

  localStorage.setItem(
    scopedKey(LS_KEY.finalScore),
    JSON.stringify(finalScore),
  );

  return finalScore;
}
