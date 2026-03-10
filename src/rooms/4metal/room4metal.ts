import { playBgm, playSfx } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { updateProgressBar } from "../../script/helper/progressbar.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import {
  getCurrentPage,
  goToSection,
} from "../../script/helper/transitions.ts";
import {
  clearReplayMode,
  getReplayRoom,
  getRoomResults,
  isReplayMode,
  setRoomResult,
} from "../../script/helper/storage.ts";
import { gameOverRoomFunc } from "../gameConclusion/gameOverRoom.ts";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { room5waterFunc } from "../5water/room5water.ts";

//-------------------------------------------------------------------------------------------------------------------------------------
//------------------------------------------------------- Module variables -------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
let listenersBound = false; // Ensures that the keydown listener is only bound once
let timeUpIntervalId: number | null = null; // Interval id for the watcher that checks whether the room timer has expired
let metalSectionRef: HTMLElement | null = null; // Reference to the room section, used to block input when the player leaves the room

// Game state must live in module scope so the keydown listener always uses the latest values
let currentLevel = 0; // Current level: 0 = first level
let playerSlots: (number | null)[] = Array(6).fill(null); // Player selected colors, 6 slots, null = not selected yet
let activeSlot = 0; // Index for the currently active slot
let isPlayingSequence = true; // true = the game is showing the sequence, player input should be blocked
let mistakes = 0; // Counts how many mistakes the player has made

// Timers / timeouts that must be reset every time the player re-enters the room
let countdownIntervalId: number | null = null; // Used by startCountdown()
let sequenceIntervalId: number | null = null; // Used by playSequence()
let sequenceEndTimeoutId: number | null = null; // Used for "clearColor + unlock" after the sequence ends
let validateSuccessTimeoutId: number | null = null; // Delay after correct validation before next level starts
let validateFailTimeoutId: number | null = null; // Delay after wrong validation before replaying the same level
let completeTimeoutId: number | null = null; // Delay before leaving Metal after room complete
let failTimeoutId: number | null = null; // Delay before leaving Metal after room fail
//-------------------------------------------------------------------------------------------------------------------------------------
//-------------------------------------------------------- Timer cleanup ---------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
// Stops the countdown timer if it is active
function clearCountdown(): void {
  if (countdownIntervalId !== null) {
    // Check if there is an active timer
    window.clearInterval(countdownIntervalId); // Stop the countdown timer
    countdownIntervalId = null; // Reset the reference so we know it is stopped
  }
}

// Stops all timers related to sequence playback
function clearSequence(): void {
  if (sequenceIntervalId !== null) {
    // If the sequence interval is active
    window.clearInterval(sequenceIntervalId); // Stop the interval that plays the sequence
    sequenceIntervalId = null; // Reset the reference
  }

  if (sequenceEndTimeoutId !== null) {
    // If the timeout after the sequence is active
    window.clearTimeout(sequenceEndTimeoutId); // Stop the timeout
    sequenceEndTimeoutId = null; // Reset the reference
  }
}

// Stops the watcher that checks if room time is up
function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    // If the interval is active
    window.clearInterval(timeUpIntervalId); // Stop the interval
    timeUpIntervalId = null; // Reset the reference
  }
}

// Stops delayed validation callbacks
function clearValidateTimeouts(): void {
  if (validateSuccessTimeoutId !== null) {
    window.clearTimeout(validateSuccessTimeoutId);
    validateSuccessTimeoutId = null;
  }

  if (validateFailTimeoutId !== null) {
    window.clearTimeout(validateFailTimeoutId);
    validateFailTimeoutId = null;
  }
}

// Stops delayed room result callbacks
function clearRoomResultTimeouts(): void {
  if (completeTimeoutId !== null) {
    window.clearTimeout(completeTimeoutId);
    completeTimeoutId = null;
  }

  if (failTimeoutId !== null) {
    window.clearTimeout(failTimeoutId);
    failTimeoutId = null;
  }
}
//-------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------- Room cleanup ---------------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
// Cleans everything that may remain active when the player leaves the metal room
function cleanupMetalRuntime(): void {
  // Stop timers that may continue running after the player has left
  clearCountdown();
  clearSequence();
  clearValidateTimeouts();
  clearRoomResultTimeouts();
  stopTimeUpWatcher();

  // Block input until the room is started correctly again
  isPlayingSequence = true;

  // Reset visual elements if the room section still exists in the DOM
  if (metalSectionRef) {
    // If we still have a room reference in the DOM
    const signal = metalSectionRef.querySelector<HTMLElement>("#colorSignal"); // Element that displays the color signal
    const feedback = metalSectionRef.querySelector<HTMLElement>("#feedback"); // Element that displays feedback text

    if (signal) signal.className = "colorSignal"; // Reset signal class to default
    if (feedback) feedback.textContent = ""; // Clear feedback text
  }

  stopTimer(4); // Stop the room timer
  metalSectionRef = null; // Remove the room reference so nothing can keep affecting the room after exit
}
//-------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------- Main room function starts -------------------------------------------------------
//-------------------------------------------------------------------------------------------------------------------------------------
export function room4metalFunc(): void {
  const metalSection: HTMLElement | null =
    document.querySelector("#room4Metal"); // Get the metal room section

  if (!metalSection) {
    // If the room section does not exist, stop here to avoid errors
    return;
  }

  // Let transition helper show / switch to the metal room
  goToSection(metalSection, 1200);
  cleanupMetalRuntime(); // Clean up before starting a fresh room enter

  metalSectionRef = metalSection; // Update the room reference every time we enter the room
  currentLevel = 0; // Keep track of the current level: 0 = level 1, 1 = level 2, 2 = level 3
  playerSlots = Array(6).fill(null); // Array with the player's choices, either a number matching a color in colorsMetal or null if nothing has been chosen yet
  activeSlot = 0; // The currently active slot starts at 0 (the first slot)
  isPlayingSequence = true; // When the player enters the room, input is blocked until the sequence has started and finished
  mistakes = 0; // Count how many mistakes the player has made
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Audio --------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const bgmId = dataJSON.room4metal.bgmId; // Background music for the metal room
  if (bgmId) {
    void playBgm(bgmId, 650); // Play background music with a 650ms fade-in
  }

  const sfxId = dataJSON.room4metal.sfxId; // Sound effect used when changing slot color
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------- Structure and next room flow ----------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const TRANSITION_MS = 1200; // Standard duration for room transitions

  function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
    const nextSection = document.querySelector<HTMLElement>(nextSelector);
    if (!nextSection) return;

    // Clean up Metal-specific runtime before leaving the room
    cleanupMetalRuntime();

    // Metal owns the transition first
    goToSection(nextSection, TRANSITION_MS);

    // Start the next room only after the transition is done
    window.setTimeout(() => {
      nextRoomFunc();
    }, TRANSITION_MS);
  }
  // replaymode if gameover
  function shouldReturnToGameOver(): boolean {
    return isReplayMode() && getReplayRoom() === "metal";
  }

  metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`; // Set the room background image from JSON data

  stopTimeUpWatcher(); // Make sure no old timeUp watcher is still running
  startTimer(4); // Start timer for room 4 Metal

  timeUpIntervalId = window.setInterval(() => {
    // Watch whether the room timer has expired
    if (!TimeIsUp) return; // If time is not up yet, do nothing
    if (getCurrentPage() !== metalSection) return; // Ignore if Metal is no longer the active room
    ifRoomFailed(); // If time is up: run fail logic
  }, 200); // Check every 200ms

  metalSection.dataset.timeUpWatcherId = String(timeUpIntervalId);

  showGameHeader(); // Show the global game header inside the room
  renderRoomDesc(metalSection, dataJSON.room4metal.desc); // Render the room description from JSON into <div id="roomdesc">
  //-------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------- Sequences, colors, state --------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const colorsMetal = ["iron", "copper", "gold", "emerald", "steel"]; // List of color class names from Sass
  const levelsMetal = [
    // List of sequences, each inner array is one level. Example: colorsMetal[0] = "iron", colorsMetal[1] = "copper", etc.
    [0, 1, 2, 1, 3, 4], // Level 1 simple sequence
    [4, 2, 4, 1, 3, 1], // Level 2 slightly harder with repetitions
    [4, 1, 3, 1, 4, 2], // Level 3 slightly harder sequence
  ];
  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------- DOM elements -------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const signal = metalSection.querySelector("#colorSignal")!; // Element that shows the signal color. Using ! because it must exist
  const feedback = metalSection.querySelector("#feedback")!; // Element that shows feedback text like correct / wrong
  const levelText = metalSection.querySelector("#levelText1")!; // Element that shows the current level, for example 1/3
  const mistakesText = metalSection.querySelector("#mistakesText1")!; // Element that shows the number of mistakes
  const slots = Array.from(metalSection.querySelectorAll(".colorSlots > div")); // All direct child divs inside .colorSlots, giving us exactly the 6 slots in order

  // Reset HUD every time we enter the room
  levelText.textContent = "1/3";
  mistakesText.textContent = "0";
  feedback.textContent = "";
  signal.className = "colorSignal";
  //-------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------- Rendering the slots -----------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Needs to:
   * - reset slot classes
   * - apply the correct color if the player has chosen one
   * - add highlight to the active slot
   */
  function renderSlots(): void {
    slots.forEach((slot, index) => {
      slot.className = `colorSlot${index + 1}`; // Reset the slot classes to the base class (colorSlot1, colorSlot2, etc.)
      const colorIndex = playerSlots[index]; // Get the player's selected color for this slot, for example 2 = gold

      if (colorIndex !== null) {
        slot.classList.add(colorsMetal[colorIndex]); // If the player has selected a color, add the correct class from colorsMetal
      }

      if (index === activeSlot) {
        slot.classList.add("is-active"); // Highlight the currently active slot so the player can see where they are
      }
    });
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------ Change slot color ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  // Change the color of the active slot
  function changeSlotColor(direction: number): void {
    if (isPlayingSequence) return; // Block color changes while the sequence is playing
    if (getCurrentPage() !== metalSection) return; // Ignore if Metal is no longer the active room

    let current = playerSlots[activeSlot]; // Current color index in the active slot (can be null if nothing has been selected yet)
    if (current === null) current = 0; // If the slot is empty, start from the first color

    if (direction === 1) {
      current = current + 1; // Go to the next color in the list
    } else {
      current = current - 1; // Go to the previous color in the list
    }

    if (current >= colorsMetal.length) {
      // If we move past the last color, wrap back to the first
      current = 0;
    }

    if (current < 0) {
      // If we move before the first color, wrap to the last
      current = colorsMetal.length - 1;
    }

    playerSlots[activeSlot] = current; // Save the color index in the player's selection array
    renderSlots(); // Update the UI so the color change becomes visible
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //------------------------------------------------------ Keyboard input ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Listens to keyboard input and lets the player:
   * - move between slots (left / right)
   * - change the color in a slot (up / down)
   * - validate the sequence (enter)
   * Input is blocked while the sequence is being played.
   */

  if (!listenersBound) {
    // Bind the keydown listener only once
    document.addEventListener("keydown", (event) => {
      if (!metalSectionRef || !metalSectionRef.classList.contains("isVisible"))
        // If the room is not active
        return; // Ignore input completely

      if (isPlayingSequence) return; // Block input while the sequence is playing

      if (event.key === "ArrowRight") {
        // Player presses the right arrow
        activeSlot = Math.min(activeSlot + 1, playerSlots.length - 1); // Move highlight to the next slot, but never past the last one
        renderSlots(); // Update UI so the active highlight moves
      }

      if (event.key === "ArrowLeft") {
        // Player presses the left arrow
        activeSlot = Math.max(activeSlot - 1, 0); // Move highlight to the previous slot, but never before the first one
        renderSlots(); // Update UI so the active highlight moves
      }

      if (event.key === "ArrowUp") {
        // Player presses the up arrow
        changeSlotColor(1); // Move to the next color in the list
        if (sfxId) void playSfx(sfxId);
      }

      if (event.key === "ArrowDown") {
        // Player presses the down arrow
        changeSlotColor(-1); // Move to the previous color in the list
        if (sfxId) void playSfx(sfxId);
      }

      if (event.key === "Enter") {
        // Player presses Enter
        if (!isPlayingSequence && allSlotsFilled()) {
          // Only validate if the sequence is not being played and all slots are filled
          validate();
        }
      }
    });

    listenersBound = true; // Mark that the listener is now bound
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Countdown --------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Shows a message and counts down from 10 to 0.
   * When it reaches 0, playSequence starts.
   */
  function startCountdown(next: () => void): void {
    clearCountdown(); // Make sure no old countdown is still running

    isPlayingSequence = true; // Block input during countdown
    let count = 10; // Start value for the countdown
    feedback.textContent = `Booting sequence in ${count}...`; // Show the first countdown message before the timer starts

    countdownIntervalId = window.setInterval(() => {
      count--; // Reduce the countdown by 1 every second

      if (count > 0) {
        // As long as the countdown is running, update the text
        feedback.textContent = `Booting sequence in ${count}...`;
        return;
      }

      // When the countdown reaches 0
      clearCountdown(); // Stop the timer
      feedback.textContent = ""; // Clear the text from the screen
      next(); // Run playSequence
    }, 1000);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------- Show / clear color ----------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  // Used to show and clear color in the signal element
  function showColor(color: string): void {
    // Show one color inside the signal element
    signal.className = `colorSignal ${color}`.trim();
  }

  function clearColor(): void {
    // Clear the color from the signal element
    signal.className = "colorSignal";
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------- Play sequence / level -----------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Plays the color sequence for the current level inside the signal element.
   * Blocks input while the sequence is playing.
   * Shows one color at a time with a pause in between.
   */
  function playSequence(): void {
    clearSequence(); // Make sure no old sequence is still running

    isPlayingSequence = true; // Block player input during the sequence
    const sequence = levelsMetal[currentLevel]; // Get the correct color sequence for the current level
    let index = 0; // Start at the first color in the sequence

    sequenceIntervalId = window.setInterval(() => {
      // Timer that shows one color every 1000ms
      showColor(colorsMetal[sequence[index]]); // Show the color matching the current index
      index++; // Move to the next color in the sequence

      if (index >= sequence.length) {
        // If all colors have been shown
        clearSequence(); // Stop the interval

        sequenceEndTimeoutId = window.setTimeout(() => {
          // Wait a little before clearing the signal
          if (getCurrentPage() !== metalSection) return; // Ignore if Metal is no longer the active room

          clearColor();
          isPlayingSequence = false; // Sequence is done, let the player start selecting colors
        }, 600); // Wait 600ms so the last color stays visible for a moment
      }
    }, 1000);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------- Filled slots, level and mistake HUD ----------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  function allSlotsFilled(): boolean {
    // Check that all slots have a color selected (not null)
    return playerSlots.every((slot) => slot !== null); // Returns true if no slot is null, otherwise false
  }

  function updateLevelProgress(level: number): void {
    // Update the text that shows which level the player is on
    levelText.textContent = `${level + 1}/3`; // (0 = level 1), therefore +1 in the output
  }

  function updateMistakeProgress(mistakeCount: number): void {
    // Update the text that shows how many mistakes the player has made
    mistakesText.textContent = String(mistakeCount); // Convert the number to text
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------------- Validation ---------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  /**
   * Validates the player's choices:
   * - blocks input during validation
   * - compares playerSlots with the correct sequence for the current level
   *
   * If correct:
   * - updates level
   * - resets slots
   * - starts a new countdown
   * - plays the next sequence
   *
   * If wrong:
   * - increases the mistake counter
   * - resets slots
   * - replays the same level after a short delay
   */
  function validate(): void {
    isPlayingSequence = true; // Block all input during validation

    const correct = levelsMetal[currentLevel]; // Correct sequence for the current level
    const chosenSequence = playerSlots; // Player's chosen sequence
    const isCorrect = chosenSequence.every(
      (value, index) => value === correct[index],
    ); // Compare every position, only true if all values match

    if (isCorrect) {
      // If the player gave the correct answer
      feedback.textContent = "Correct!";

      if (currentLevel < levelsMetal.length - 1) {
        // Check if there are more levels after this one
        currentLevel++; // Move to the next level
        updateLevelProgress(currentLevel); // Update the level indicator

        if (bgmId) void playBgm(bgmId, 650);

        validateSuccessTimeoutId = window.setTimeout(() => {
          // Ignore if Metal is no longer the active room
          if (getCurrentPage() !== metalSection) return;

          // Reset the player's choices before the next sequence
          playerSlots = Array(6).fill(null); // Reset all 6 slots
          activeSlot = 0; // Move highlight back to the first slot

          startCountdown(playSequence);
          renderSlots();
        }, 1000);
      } else {
        // Last level complete, room is finished
        ifRoomCompleted();
        return;
      }
    } else {
      // If the answer is wrong
      feedback.textContent = "Incorrect! Try again.";

      mistakes++; // Increase the mistake counter
      updateMistakeProgress(mistakes); // Update the mistake indicator

      validateFailTimeoutId = window.setTimeout(() => {
        // Ignore if Metal is no longer the active room
        if (getCurrentPage() !== metalSection) return;

        // Reset the player's choices but stay on the same level
        playerSlots = Array(6).fill(null); // Reset all 6 slots
        activeSlot = 0; // Move highlight back to the first slot

        renderSlots();
        startCountdown(playSequence);
      }, 2000);
    }
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //--------------------------------------------------------- Room complete --------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  // Explain these carefully tomorrow as well, from the guide too
  function ifRoomCompleted(): void {
    cleanupMetalRuntime(); // Clean timers and visual runtime before leaving the room

    setRoomResult("metal", {
      // Save the result for the metal room in the global game results
      status: "completed",
      artifact: "true", // The player earns the correct artifact
      mistakes: mistakes,
      score: 0, // Score is not used here yet but required by the structure
      roomTimeSec: 0, // Time is not used here yet but required by the structure
    });

    stopTimer(4); // Stop the room timer after saving results so the values are not overwritten
    updateProgressBar();
    showMsg("Well done — next chamber awaits", TRANSITION_MS * 2); // Show completion message
    console.log("Metal result:", getRoomResults().metal); // Debug log for development

    completeTimeoutId = window.setTimeout(() => {
      // Ignore if Metal is no longer the active room
      if (getCurrentPage() !== metalSection) return;

      // If this room was replayed from Game Over,
      // return there instead of continuing the normal room flow
      if (shouldReturnToGameOver()) {
        clearReplayMode();
        goToNextRoom("#gameOverRoom", gameOverRoomFunc);
        return;
      }

      // Otherwise continue normal flow
      goToNextRoom("#room5Water", room5waterFunc);
    }, TRANSITION_MS);
  }
  //--------------------------------------------------------------------------------------------------------------------------------------
  //----------------------------------------------------- Room fail ----------------------------------------------------------------------
  //--------------------------------------------------------------------------------------------------------------------------------------
  function ifRoomFailed(): void {
    stopTimeUpWatcher(); // Stop the interval watching whether time is up

    setRoomResult("metal", {
      // Save the failed result for the metal room
      status: "completed",
      artifact: "false", // The player earns the false artifact
      mistakes: mistakes,
      score: 0, // Score not used here yet but required by the structure
      roomTimeSec: 0, // Time not used here yet but required by the structure
    });

    stopTimer(4); // Stop the room timer after saving results
    updateProgressBar();
    showMsg("Time's up — next chamber awaits", TRANSITION_MS * 2); // Show timeout message

    failTimeoutId = window.setTimeout(() => {
      // Ignore if Metal is no longer the active room
      if (getCurrentPage() !== metalSection) return;

      // If this room was replayed from Game Over,
      // return there instead of continuing the normal room flow
      if (shouldReturnToGameOver()) {
        clearReplayMode();
        goToNextRoom("#gameOverRoom", gameOverRoomFunc);
        return;
      }

      // Otherwise continue normal flow
      goToNextRoom("#room5Water", room5waterFunc);
    }, TRANSITION_MS);
  }

  renderSlots(); // Render the slots for the first time when the room loads
  startCountdown(playSequence); // Start the countdown and then play the first sequence
}
