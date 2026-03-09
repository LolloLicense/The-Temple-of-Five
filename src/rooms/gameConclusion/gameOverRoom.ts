import * as dataJSON from "../../data.json";
import { hideGameHeader } from "../../script/helper/gameHeader.ts";
import {
  areAllElementsTrue,
  getRoomResults,
  setReplayMode,
} from "../../script/helper/storage.ts";

//-----------------------------------------------------------
//------------------- REPLAY ROOM HELPER --------------------
//-----------------------------------------------------------

// Starts correct replay room from the correct id selected in game over page
function startReplayRoom(
  roomId: "wood" | "fire" | "earth" | "metal" | "water",
): void {
  // check what room is due for replay
  switch (roomId) {
    // wood room selected
    case "wood":
      console.log("[GAME OVER] Start replay: wood");
      break;
    // fire room selected
    case "fire":
      console.log("[GAME OVER] Start replay:fire");
      break;
    // earth room selected
    case "earth":
      console.log("[GAME OVER] Start replay: earth");
      break;
    // metal room selected
    case "metal":
      console.log("[GAME OVER] Start replay: wood");
      break;
    // water room selected
    case "water":
      console.log("[GAME OVER] Start replay: wood");
      break;
  }
}

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
    console.log("[GAME OVER] Missing validation button");
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

  //-----------------------------------------------------------
  //----------------- REPLAY BTN EVENTS -----------------------
  //-----------------------------------------------------------

  //  What buttons should get a click listener
  replayBtns.forEach((button) => {
    // only click for re-playable failed rooms
    if (!button.classList.contains("isFailed")) return;

    // Prevent more than one listener on re-enter
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", () => {
      // finds the id the clicked button has
      const roomId = button.dataset.roomId;
      // if room has no id - abort mission
      if (!roomId) return;

      // set the mode to right room that needs to be replayed
      setReplayMode(roomId as "wood" | "fire" | "earth" | "metal" | "water");
      // init replay for failed rooms
      startReplayRoom(roomId as "wood" | "fire" | "earth" | "metal" | "water");
    });
  });

  // remove CONSOLE.LOG when flow is finished
  console.log("GAME OVER state:", state);
  console.log("GAME OVER replay buttons found:", replayBtns.length);
  console.log("GAME OVER all elements fixed:", allElementsOk);
}
