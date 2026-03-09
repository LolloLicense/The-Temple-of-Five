import * as dataJSON from "../../data.json";
import { hideGameHeader } from "../../script/helper/gameHeader.ts";
import {
  areAllElementsTrue,
  getRoomResults,
} from "../../script/helper/storage.ts";

export function gameOverRoomFunc(): void {
  const gameOverSection = document.querySelector<HTMLElement>("#gameOverRoom");
  if (!gameOverSection) return;

  //-----------------------------------------------------------
  //---------------------- DOM ELEMENTS -----------------------
  //-----------------------------------------------------------

  // Replay buttons
  const replayBtns =
    gameOverSection.querySelectorAll<HTMLButtonElement>(".replayChamberBtn");
  // Validation button
  const retryValidationBtn = gameOverSection.querySelector<HTMLButtonElement>(
    "#retryValidationBtn",
  );
  if (!retryValidationBtn) {
    console.log("missing validation btn");
    return;
  }

  //-----------------------------------------------------------
  //---------------------- STORAGE STATE ----------------------
  //-----------------------------------------------------------

  // get current roomResult from storage
  const state = getRoomResults();
  // check if all elements ok
  const allElementsOk = areAllElementsTrue();

  //-----------------------------------------------------------
  //------------------------ ROOM SETUP -----------------------
  //-----------------------------------------------------------

  hideGameHeader();
  // Reset animation so it can restart every time we enter the room
  gameOverSection.classList.remove("is-animating");
  // Set background image
  gameOverSection.style.backgroundImage = `url("${dataJSON.gameOverRoom.backgroundImg}")`;
  // Restart animation
  requestAnimationFrame(() => {
    gameOverSection.classList.add("is-animating");
  });

  //-----------------------------------------------------------
  //----------------- REPLAY BTN STATE ------------------------
  //-----------------------------------------------------------

  // Loop through all replaybtns and update ui based on artifact result in storage.ts
  replayBtns.forEach((button) => {
    // what room belongs to witch button
    const roomId = button.dataset.roomId;
    // if roomId missing - return
    if (!roomId) {
      console.log("GAME OVER missing data room id in replay btn"); // remove when done
      return;
    }

    // read the artifact status for this room from storage
    const roomResult = state[roomId as keyof typeof state];
    const artifact = roomResult.artifact;
    // reset state scss first
    button.classList.remove("isFailed", "isFixed");
    // Reset button state before applying new one
    button.disabled = false;
    button.setAttribute("aria-disabled", "false");

    // Failed room styling & replayable state
    if (artifact === "false") {
      button.classList.add("isFailed");
      button.disabled = false;
      button.setAttribute("aria-disabled", "false");
      console.log(`[GAME OVER] ${roomId} marked as FAILED`); // remove when done
      return;
    }
    // Fixed/done rooms styling + not clickable
    button.classList.add("isFixed");
    button.disabled = true;
    button.setAttribute("aria-disabled", "true");

    console.log(`[GAME OVER] ${roomId} marked as FIXED`); // remove later
  });

  //-----------------------------------------------------------
  //----------------- ValidationBtn STATE ---------------------
  //-----------------------------------------------------------

  // Unlock validation only when all element rooms are fixed
  if (allElementsOk) {
    retryValidationBtn.disabled = false;
    retryValidationBtn.classList.add("isUnlocked");

    console.log("[GAME OVER] Validation button unlocked");
  } else {
    retryValidationBtn.disabled = true;
    retryValidationBtn.classList.remove("isUnlocked");

    console.log("[GAME OVER] Validation button locked");
  }

  // remove when flow is finished
  console.log("GAME OVER state:", state);
  console.log("GAME OVER replay buttons found:", replayBtns.length);
  console.log("GAME OVER all elements fixed:", allElementsOk);
}
