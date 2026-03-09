import { getUserName } from "../../script/helper/storage";
import { pushHighscore } from "./highscoreStorage";
import { saveFinalScoreToStorage } from "./saveFinalScoreToStorage";

/**
 * Finalizes the completed run.
 * Use this only when the player has officially won the game.
 */
export function finalizeWonRun(): void {
  const userName = getUserName();
  if (!userName) return;

  const finalScore = saveFinalScoreToStorage();

  pushHighscore({
    name: userName,
    score: finalScore,
  });
}

TODO: När allt är på plats ta bort debugScoreBreakdown() som just nu sitter där för test.