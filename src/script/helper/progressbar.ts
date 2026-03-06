import { getRoomResults } from "./storage";

/**
 * Progressbar ska känna av state på spelat rum och css ska göra
 */

//-----------------------------------------------------------
//------------------- ROOM ORDER CONFIG ---------------------
//-----------------------------------------------------------

// Progressbaren måste veta i vilken ordning rummen kommer.
// Detta ska matcha HTML-strukturen på dina .roomProgress

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

    // if room completed -- fill progress <span> ( scss)
    if (roomState.status === "completed") {
      // add class that mark room as completed
      step.classList.add("is-completed");
    } else {
      // else dont.
      step.classList.remove("is-completed");
    }
  });
}
