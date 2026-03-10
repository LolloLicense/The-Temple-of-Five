import { getRoomResults } from "./storage";

//-----------------------------------------------------------
//------------------- ROOM ORDER CONFIG ---------------------
//-----------------------------------------------------------

// Progressbaren gets informed on the absolut order of the rooms

const PROGRESS_ROOMS = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
  "final",
] as const;

//-----------------------------------------------------------
//-------------------- UPDATE PROGRESSBAR -------------------
//-----------------------------------------------------------

/**
 * What happens:
 * 1. Reads state from storage
 * 2. Gets all the progress steps from index.html
 * 3. Loops them in right order
 * 4. Mark completed rooms all "filled"
 */
export function updateProgressBar(): void {
  // get current game state
  const state = getRoomResults();

  // getting progressbar from index.html
  const progressTrack = document.querySelector<HTMLElement>(".progressTrack");
  if (!progressTrack) return;

  // getting all the progress <span> from index.html
  const steps = Array.from(
    progressTrack.querySelectorAll<HTMLElement>(".roomProgress"),
  );

  //---------------------------------------------------------
  // 4. Loop each step to match roomId
  //---------------------------------------------------------
  PROGRESS_ROOMS.forEach((roomId, index) => {
    const step = steps[index];
    if (!step) return;
    // get roomstate
    const roomState = state[roomId];

    if (roomState.artifact !== null) {
      step.classList.add("is-completed");
    } else {
      step.classList.remove("is-completed");
    }
  });
}
// Keep progressbar in sync when room results change
window.addEventListener("roomResults:changed", () => {
  updateProgressBar();
});
