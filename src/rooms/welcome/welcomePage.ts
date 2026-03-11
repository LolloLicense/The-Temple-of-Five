import { room1woodFunc } from "../../rooms/1wood/room1wood.ts";
import { room2fireFunc } from "../../rooms/2fire/room2fire.ts";
import { room3earthFunc } from "../../rooms/3earth/room3earth.ts";
import { room4metalFunc } from "../../rooms/4metal/room4metal.ts";
import { room5waterFunc } from "../../rooms/5water/room5water.ts";
import { room6finalFunc } from "../../rooms/final/room6validate.ts";

import { startTimer, getUserTotalTime } from "../../script/helper/utils.ts";
import { goToSection } from "../../script/helper/transitions.ts";
import { highscoreRoomFunc } from "../../rooms/highscore/highscore.ts";
import {
  getRoomResults,
  resetRunKeepHighscores,
} from "../../script/helper/storage.ts";

export function welcomePageFunc(): void {
  /* Event handlers */
  // Start game button
  const startGameBtn: HTMLElement | null =
    document.querySelector("#startGameBtn");
  if (startGameBtn) {
    startGameBtn.addEventListener("click", handleStartGame);
  }

  // Resume button
  const continueBtn: HTMLElement | null =
    document.querySelector("#continueBtn");
  if (continueBtn) {
    continueBtn.addEventListener("click", continueGame);
  }

  //HIGHSCORE button
  const highScoreBtn: HTMLElement | null =
    document.querySelector("#openHighScoreBtn");

  if (highScoreBtn) {
    highScoreBtn.addEventListener("click", () => {
      // 1. Build the highscore room first
      highscoreRoomFunc();

      // 2. Then show the section from the welcome/test menu
      const highscoreSection =
        document.querySelector<HTMLElement>("#highscoreRoom");
      if (!highscoreSection) return;

      goToSection(highscoreSection, 1200);
    });
  }
} // welcomePageFunc END

// When a new game is started, the timer should start and the first room should be built and shown
function handleStartGame(): void {
  resetRunKeepHighscores();
  startTimer(0);
  room1woodFunc();
}
// When continue game is clicked, the game should be continued from the last save point (functionality to be implemented)

function continueGame(): void {
  const ROOMS = ["wood", "fire", "earth", "metal", "water", "final"] as const;
  const state = getRoomResults();
  let continueRoom: string = "";

  for (const roomId of ROOMS) {
    if (state[roomId].status === "pending") {
      continueRoom = roomId;
      console.log(`Room ID: ${roomId}, Status: ${state[roomId].status}`);
      break; // Exit the loop once the pending room is found
    } // IF END
  } // LOOP END

  switch (continueRoom) {
    case "wood":
      goToSection(document.querySelector<HTMLElement>("#room1Wood")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room1woodFunc();
      break;
    case "fire":
      goToSection(document.querySelector<HTMLElement>("#room2Fire")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room2fireFunc();
      break;
    case "earth":
      goToSection(document.querySelector<HTMLElement>("#room3Earth")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room3earthFunc();
      break;
    case "metal":
      goToSection(document.querySelector<HTMLElement>("#room4Metal")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room4metalFunc();
      break;
    case "water":
      goToSection(document.querySelector<HTMLElement>("#room5Water")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room5waterFunc();
      break;
    case "final":
      goToSection(document.querySelector<HTMLElement>("#finalRoom")!, 1200);
      getUserTotalTime();
      startTimer(0);
      room6finalFunc();
      break;
  } // switch END
} // continueGame END
