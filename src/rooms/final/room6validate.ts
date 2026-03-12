import { playBgm, playSfx, stopAll } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import { getArtifactIcon } from "../../script/helper/artifacts.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { getRoomResults } from "../../script/helper/storage.ts";
import { goToSection } from "../../script/helper/transitions.ts";
import { startTimer, stopTimer } from "../../script/helper/utils.ts";
import { gameOverRoomFunc } from "../gameConclusion/gameOverRoom.ts";
import { gameWinFunc } from "../gameConclusion/gameWin.ts";

// Type that only contains the five elemental rooms
type TElementRoomId = "wood" | "fire" | "earth" | "metal" | "water";

// Default transition time to the next section
const TRANSITION_MS = 1200;

// Prevents the keyboard listener from being bound multiple times
let finalKeyboardHandler: ((event: KeyboardEvent) => void) | null = null;

// Prevents validate/logic from running multiple times in quick succession
let isResolvingFinalRoom = false;

// Cleanup function
export function cleanupFinalRoom(): void {
  // Remove the keyboard listener if it exists
  if (finalKeyboardHandler) {
    document.removeEventListener("keydown", finalKeyboardHandler);
    finalKeyboardHandler = null;
  }

  // Reset resolving state when leaving the room
  isResolvingFinalRoom = false;
}

export function room6finalFunc(): void {
  //---------------------------------------------------------------
  //------------------ Initialize the room ------------------------
  //---------------------------------------------------------------

  // Get the final room section
  const finalSection = document.querySelector<HTMLElement>("#finalRoom");
  if (!finalSection) return;

  // Reset the resolving flag every time the room starts
  // so the validate button can be used again when returning here.
  isResolvingFinalRoom = false;

  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`; // Set background image

  startTimer(6); // Start timer for room 6
  showGameHeader(); // Show UI header
  renderRoomDesc(finalSection, dataJSON.room6validate.desc); // Show room description

  stopAll(); // Stop old music
  const bgmId = dataJSON.room6validate.bgmId; // Play background music
  if (bgmId) void playBgm(bgmId, 650);

  const sfxClick = dataJSON.room6validate.sfxClick; // Sound effect used when changing slot color
  const sfxBoom = dataJSON.room6validate.sfxBoomId; // Sound effect used when changing slot color

  // Make the section focusable so keyboard navigation works
  finalSection.tabIndex = -1;
  finalSection.focus();

  //-----------------------------------------------------------
  //------------------ Fetch artifacts ------------------------
  //-----------------------------------------------------------

  const state = getRoomResults(); // Get game state from storage

  // Rooms in correct order
  const rooms: TElementRoomId[] = ["wood", "fire", "earth", "metal", "water"];

  // Build artifactPool = list of { roomId, kind, icon }
  const artifactPool = rooms.map((roomId) => {
    const kind = state[roomId].artifact; // "true" | "false" | null
    const icon = getArtifactIcon(roomId, kind); // Get icon
    return { roomId, kind, icon };
  });

  //-----------------------------------------------------------
  //-------------------- Slots & State ------------------------
  //-----------------------------------------------------------

  const slots = Array.from(
    finalSection.querySelectorAll(".finalSlots .slot"),
  ) as HTMLElement[]; // Get all slot elements

  // Which artifact is placed in which slot
  let slotSelections: (number | null)[] = [null, null, null, null, null];
  let activeSlotIndex = 0; // Which slot is active

  const originalValidateBtn =
    finalSection.querySelector<HTMLButtonElement>("#validateBtn");

  const feedbackElNode =
    finalSection.querySelector<HTMLElement>("#finalFeedback");

  if (!originalValidateBtn || !feedbackElNode) return;

  // Always create a fresh Validate button when the room starts.
  // This removes any old click listeners from previous visits
  // without needing to store and remove them manually.
  const validateBtn = originalValidateBtn.cloneNode(true) as HTMLButtonElement;
  originalValidateBtn.replaceWith(validateBtn);

  const feedbackEl = feedbackElNode;

  // Reset room UI every time the room starts
  // so old feedback or old selections do not remain.
  slotSelections = [null, null, null, null, null];
  activeSlotIndex = 0;
  feedbackEl.textContent = "";

  //------------------------------------------------------------
  //-------------------------- Render --------------------------
  //------------------------------------------------------------

  function renderSlots(): void {
    slots.forEach((slotElement, slotIndex) => {
      // Loop through each slot
      slotElement.classList.remove("is-active"); // Remove highlight
      slotElement.innerHTML = ""; // Clear slot

      const selectedArtifactIndex = slotSelections[slotIndex]; // Artifact index in this slot

      if (selectedArtifactIndex !== null) {
        const artifact = artifactPool[selectedArtifactIndex]; // Get artifact object
        slotElement.innerHTML = `<img src="${artifact.icon}" alt="${artifact.roomId}" />`; // Display icon
      }

      if (slotIndex === activeSlotIndex) {
        slotElement.classList.add("is-active"); // Highlight active slot
      }
    });
  }

  //-----------------------------------------------------------
  //---------------------- Validate button --------------------
  //-----------------------------------------------------------

  function updateValidate(): void {
    const allSlotsAreFilled = slotSelections.every(
      (selection) => selection !== null,
    ); // Are all slots filled?

    // If all slots are filled and the room is not currently resolving,
    // enable the Validate button. Otherwise keep it disabled.
    validateBtn.disabled = !allSlotsAreFilled || isResolvingFinalRoom;
  }

  //-----------------------------------------------------------
  //---------------- Cycle artifact in slot -------------------
  //-----------------------------------------------------------

  // Create a Set of all artifacts already used in any slot (no duplicates)
  function cycleArtifact(direction: number): void {
    // If the room is resolving, no more changes allowed
    if (isResolvingFinalRoom) return;

    const usedArtifactIndexes = new Set(
      slotSelections.filter((selection) => selection !== null), // Remove empty slots (null)
    );

    // Create a list of all artifacts available for the active slot
    const availableArtifactIndexes = artifactPool
      .map((_, artifactIndex) => artifactIndex) // Create list [0,1,2,3,4]
      .filter(
        (artifactIndex) =>
          !usedArtifactIndexes.has(artifactIndex) || // Artifact not used in another slot
          slotSelections[activeSlotIndex] === artifactIndex, // Or it's the same artifact already in this slot
      );

    // If no artifacts available, abort
    if (availableArtifactIndexes.length === 0) return;

    // Get the artifact currently in the active slot
    const currentArtifactIndex = slotSelections[activeSlotIndex];

    // Find its position in the available list
    // If slot is empty → start at -1
    // Otherwise → find its index
    let newIndexInAvailableList =
      currentArtifactIndex === null
        ? -1
        : availableArtifactIndexes.indexOf(currentArtifactIndex);

    // Move up or down depending on direction (+1 or -1)
    newIndexInAvailableList += direction;

    // Wrap-around: past the end → go to first
    if (newIndexInAvailableList >= availableArtifactIndexes.length) {
      newIndexInAvailableList = 0;
    }

    // Wrap-around: before first → go to last
    if (newIndexInAvailableList < 0) {
      newIndexInAvailableList = availableArtifactIndexes.length - 1;
    }

    // Set the new artifact in the active slot
    slotSelections[activeSlotIndex] =
      availableArtifactIndexes[newIndexInAvailableList];

    renderSlots(); // Re-render slots so the player sees the change
    updateValidate(); // Update validate button state
  }

  //-----------------------------------------------------------
  //---------------------- Keyboard ---------------------------
  //-----------------------------------------------------------

  // If an old handler from a previous initialization exists,
  // remove it first so we don’t accumulate multiple document-keydown listeners.
  if (finalKeyboardHandler) {
    document.removeEventListener("keydown", finalKeyboardHandler);
    finalKeyboardHandler = null;
  }

  // Create a new handler that uses this run’s local state
  finalKeyboardHandler = (event: KeyboardEvent) => {
    // Keyboard should only work when the final room is visible
    if (!finalSection.classList.contains("isVisible")) return;

    // When the room is resolving, no more input should be accepted
    if (isResolvingFinalRoom) return;

    if (event.key === "ArrowLeft") {
      // If the player presses the left arrow
      activeSlotIndex = Math.max(0, activeSlotIndex - 1); // Move highlight left, but never below 0
      renderSlots(); // Re-render so the highlight updates
    }

    if (event.key === "ArrowRight") {
      // If the player presses the right arrow
      activeSlotIndex = Math.min(4, activeSlotIndex + 1); // Move highlight right, but never above 4
      renderSlots(); // Re-render so the highlight updates
    }

    if (event.key === "ArrowUp") {
      // If the player presses up → cycle artifact upward in the list
      cycleArtifact(-1);
      if (sfxClick) void playSfx(sfxClick); // ljud vid slot förflyttning
    }

    if (event.key === "ArrowDown") {
      // If the player presses down → cycle artifact downward in the list
      cycleArtifact(1);
      if (sfxClick) void playSfx(sfxClick); // ljud vid slot förflyttning
    }
  };

  // Bind the keyboard listener
  document.addEventListener("keydown", finalKeyboardHandler);

  //-----------------------------------------------------------
  //----------------------- Validate --------------------------
  //-----------------------------------------------------------

  // Bind one fresh click listener to the freshly cloned button.
  // Since the button is recreated on each room start,
  // old listeners from previous visits are automatically removed.
  validateBtn.addEventListener("click", () => {
    // If the room is already resolving, ignore clicks
    if (isResolvingFinalRoom) return;

    const correctOrder: TElementRoomId[] = [
      "wood",
      "fire",
      "earth",
      "metal",
      "water",
    ]; // The correct order of artifacts based on the rooms

    const selectedArtifacts = slotSelections.map(
      // Get the artifacts in the order the player placed them in the slots
      (artifactIndex) => artifactPool[artifactIndex!], // artifactIndex! = we guarantee it’s not null
    );

    const orderIsCorrect = selectedArtifacts.every(
      // Check the order
      (artifact, slotIndex) => artifact.roomId === correctOrder[slotIndex], // Compare each artifact with the correct position
    );

    if (!orderIsCorrect) {
      // If the order is wrong
      feedbackEl.textContent = "Wrong order. Try again."; // Show feedback
      slotSelections = [null, null, null, null, null]; // Clear all slots
      activeSlotIndex = 0; // Move highlight back to the first slot

      renderSlots(); // Re-render
      updateValidate(); // Disable the Validate button again
      return; // Exit the function here
    }

    const allArtifactsAreTrue = selectedArtifacts.every(
      // Check if all artifacts are "true"
      (artifact) => artifact.kind === "true",
    );

    // Lock the room so no more clicks or navigation can happen
    isResolvingFinalRoom = true;
    updateValidate();

    if (allArtifactsAreTrue) {
      // If the player won
      feedbackEl.textContent = "You win!";

      // Stop the final room’s timer before moving on
      stopTimer(6);
      stopAll(); // Stop music
      playSfx(sfxBoom);

      // Get the win section
      const gameWinSection =
        document.querySelector<HTMLElement>("#gameWinRoom");
      if (!gameWinSection) return;

      // Build the win screen first so its UI is ready immediately
      gameWinFunc();

      // Then transition to the win screen
      goToSection(gameWinSection, TRANSITION_MS);
    } else {
      // If the order was correct but one or more artifacts were false
      feedbackEl.textContent = "Incorrect artifacts. Game Over.";

      // Stop the final room’s timer before moving on
      stopTimer(6);
      stopAll(); // Stop music
      playSfx(sfxBoom);

      // Get the game-over section
      const gameOverSection =
        document.querySelector<HTMLElement>("#gameOverRoom");
      if (!gameOverSection) return;

      // Build the game-over screen first so replay / done-room UI
      // is ready as soon as the section becomes visible
      gameOverRoomFunc();

      // Then transition to the game-over screen
      goToSection(gameOverSection, TRANSITION_MS);
    }
  });

  //-----------------------------------------------------------
  //------------------------- Init ----------------------------
  //-----------------------------------------------------------

  renderSlots(); // Render for the first time
  updateValidate(); // Disable Validate at start
}
