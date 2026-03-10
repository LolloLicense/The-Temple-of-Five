import { playBgm, stopAll } from "../../audio/index.ts";
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

  // The final room owns the transition to the next section.
  // Important:
  // - first transition to the next section
  // - then start the next room’s logic
  // This reduces the risk of the next room starting timers/logic
  // before the page transition is complete.
  function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
    const nextSection = document.querySelector<HTMLElement>(nextSelector);
    if (!nextSection) return;

    // Let the final room handle the transition first
    goToSection(nextSection, TRANSITION_MS);

    // Start the next room after the transition is complete
    window.setTimeout(() => {
      nextRoomFunc();
    }, TRANSITION_MS);
  }

  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`; // Set background image

  startTimer(6); // Start timer for room 6
  showGameHeader(); // Show UI header
  renderRoomDesc(finalSection, dataJSON.room6validate.desc); // Show room description

  stopAll(); // Stop old music
  const bgmId = dataJSON.room6validate.bgmId; // Play background music
  if (bgmId) void playBgm(bgmId, 650);

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

  const validateBtnEl =
    finalSection.querySelector<HTMLButtonElement>("#validateBtn"); // Validate button

  const feedbackElNode =
    finalSection.querySelector<HTMLElement>("#finalFeedback"); // Feedback text

  // If any important part is missing, do not continue
  if (!validateBtnEl || !feedbackElNode) return;

  // Safe references after null guard
  const validateBtn = validateBtnEl;
  const feedbackEl = feedbackElNode;

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

    // If the room is already resolving, keep the button disabled
    validateBtn.disabled = !allSlotsAreFilled || isResolvingFinalRoom; // Enable/disable button
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
    if (newIndexInAvailableList >= availableArtifactIndexes.length)
      newIndexInAvailableList = 0;

    // Wrap-around: before first → go to last
    if (newIndexInAvailableList < 0)
      newIndexInAvailableList = availableArtifactIndexes.length - 1;

    // Set the new artifact in the active slot
    slotSelections[activeSlotIndex] =
      availableArtifactIndexes[newIndexInAvailableList];

    renderSlots(); // Re-render slots so the player sees the change
    updateValidate(); // Update validate button (may become enabled)
  }

  //-----------------------------------------------------------
  //---------------------- Keyboard --------------------------
  //-----------------------------------------------------------

  // If an old handler from a previous initialization exists,
  // remove it first so we don’t accumulate multiple document-keydown listeners.
  if (finalKeyboardHandler) {
    document.removeEventListener("keydown", finalKeyboardHandler);
    finalKeyboardHandler = null;
  }

  // Create a new handler that uses this run’s local state
  finalKeyboardHandler = (event: KeyboardEvent) => {
    if (!finalSection.classList.contains("isVisible")) return; // Keyboard should only work when the final room is visible
    if (isResolvingFinalRoom) return; // When the room is resolving, no more input should be accepted

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
    }

    if (event.key === "ArrowDown") {
      // If the player presses down → cycle artifact downward in the list
      cycleArtifact(1);
    }
  };

  // Bind the keyboard listener
  document.addEventListener("keydown", finalKeyboardHandler);

  //-----------------------------------------------------------
  //----------------------- Validate --------------------------
  //-----------------------------------------------------------

  // If an old listener was already bound earlier, clone the button and replace it.
  // This removes old listeners without needing to store references to them.
  let currentValidateBtn = validateBtn;

  if (currentValidateBtn.dataset.bound === "true") {
    const freshValidateBtn = currentValidateBtn.cloneNode(
      true,
    ) as HTMLButtonElement;
    currentValidateBtn.replaceWith(freshValidateBtn);
    currentValidateBtn = freshValidateBtn;
  }

  currentValidateBtn.dataset.bound = "true";

  // Save the correct button reference for updateValidate by working with the current button
  function syncValidateButtonState(): void {
    const allSlotsAreFilled = slotSelections.every(
      (selection) => selection !== null,
    );
    currentValidateBtn.disabled = !allSlotsAreFilled || isResolvingFinalRoom;
  }

  currentValidateBtn.addEventListener("click", () => {
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
      syncValidateButtonState(); // Disable the Validate button
      return; // Exit the function here
    }

    const allArtifactsAreTrue = selectedArtifacts.every(
      // Check if all artifacts are "true"
      (artifact) => artifact.kind === "true",
    );

    // Lock the room so no more clicks or navigation can happen
    isResolvingFinalRoom = true;
    currentValidateBtn.disabled = true;

    if (allArtifactsAreTrue) {
      // If the player won
      feedbackEl.textContent = "You win!";

      // Stop the final room’s timer before moving on
      stopTimer(6);
      stopAll(); // Stop music

      // The final room owns the transition to the win screen
      window.setTimeout(() => {
        goToNextRoom("#gameWinRoom", gameWinFunc);
      }, TRANSITION_MS);
    } else {
      // If the order was correct but one or more artifacts were false
      feedbackEl.textContent = "Incorrect artifacts. Game Over.";

      // Stop the final room’s timer before moving on
      stopTimer(6);
      stopAll(); // Stop music

      // The final room owns the transition to the game-over screen
      window.setTimeout(() => {
        goToNextRoom("#gameOverRoom", gameOverRoomFunc);
      }, TRANSITION_MS);
    }
  });

  //-----------------------------------------------------------
  //------------------------- Init ----------------------------
  //-----------------------------------------------------------

  renderSlots(); // Render for the first time
  updateValidate(); // Disable Validate at start
  syncValidateButtonState(); // Ensure the correct state for the current Validate button
}
