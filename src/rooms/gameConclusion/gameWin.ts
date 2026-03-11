import * as dataJSON from "../../data.json";
import { hideGameHeader } from "../../script/helper/gameHeader.ts";
import { getUserName } from "../../script/helper/storage";
import { calculateFinalScoreFromStorage } from "../highscore/calculateFinalScore";
import { pushHighscore } from "../highscore/highscoreStorage";
import { highscoreRoomFunc } from "../highscore/highscore.ts";

export function gameWinFunc(): void {
  const gameWinSection = document.querySelector<HTMLElement>("#gameWinRoom");
  if (!gameWinSection) return;

  // hide gameheader
  hideGameHeader();
  // Set background image
  gameWinSection.style.backgroundImage = `url("${dataJSON.gameWinRoom.backgroundImg}")`;

  // Restart animation every time we enter the room
  gameWinSection.classList.remove("is-animating");
  void gameWinSection.offsetWidth;
  gameWinSection.classList.add("is-animating");

  console.log("Hello from the gameWin room");

  /* -------------------------------------------------------------------------------------------------------------------------------------------------- */
  /* ---------------------------------------------------- CALCULATE AND SAVE FINAL SCORE -------------------------------------------------------------- */
  /* -------------------------------------------------------------------------------------------------------------------------------------------------- */

  const userName = getUserName();

  if (!userName) {
    console.log("No username found. Cannot save highscore.");
    return;
  }

  const scoreResult = calculateFinalScoreFromStorage();

  console.log("Final score:", scoreResult.totalScore);

  pushHighscore({
    name: userName,
    score: scoreResult.totalScore,
  });

  console.log("Highscore pushed.");

  // Go to highscore page
  const highscoreBtn =
    document.querySelector<HTMLButtonElement>('[data-action="highscore"]');

  if (highscoreBtn && highscoreBtn.dataset.bound !== "true") {
    highscoreBtn.dataset.bound = "true";

    highscoreBtn.addEventListener("click", () => {
      highscoreRoomFunc();
    });
  }
}