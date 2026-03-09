import { playBgm, stopAll } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
// Updates the progress bar in the UI based on saved room status
import { updateProgressBar } from "../../script/helper/progressbar.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import {
  getRoomResults,
  resetSingleRoomResult,
  setRoomResult,
} from "../../script/helper/storage.ts";
import {
  getCurrentPage,
  goToSection,
} from "../../script/helper/transitions.ts";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { room2fireFunc } from "../2fire/room2fire.ts";

//-----------------------------------------------------------
//---------------------- CONFIG / RULES ----------------------
//-----------------------------------------------------------

// Levels = 3 stages. Each level contains 6 Fibonacci numbers
const LEVELS: number[][] = [
  [0, 1, 1, 2, 3, 5],
  [8, 13, 21, 34, 55, 89],
  [144, 233, 377, 610, 987, 1597],
];

// Number of input slots
const SLOTS_PER_STAGE = 6;

// Balance / UI tuning
const MISTAKE_PENALTY = 4;
const WOBBLEBALANCE = 1.5;
const TRANSITIONTIME = 1200;

//-----------------------------------------------------------
//------------------- CLEANUP-RELATED STATE -----------------
//-----------------------------------------------------------

// If we re-enter, clear previous watcher (prevents double fail triggers)
let timeUpIntervalId: number | null = null;

// Timeout used when room is completed
let completeTimeoutId: number | null = null;

// Timeout used when room is failed
let failTimeoutId: number | null = null;

//-----------------------------------------------------------
//----------------------- CLEANUP HELPERS -------------------
//-----------------------------------------------------------

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}
function stopCompleteTimeout(): void {
  if (completeTimeoutId !== null) {
    window.clearTimeout(completeTimeoutId);
    completeTimeoutId = null;
  }
}
function stopFailTimeout(): void {
  if (failTimeoutId !== null) {
    window.clearTimeout(failTimeoutId);
    failTimeoutId = null;
  }
}
// Cleanup function for Wood room
function cleanupWoodRoom(): void {
  stopTimeUpWatcher();
  stopCompleteTimeout();
  stopFailTimeout();
}

export function room1woodFunc(): void {
  // Reset single room result so we start from default artifact state
  resetSingleRoomResult("wood");

  //----------------------------------------------------------
  //---------------------- SETUP ROOM DOM --------------------
  //----------------------------------------------------------

  const woodSection = document.querySelector<HTMLElement>("#room1Wood");
  if (!woodSection) return;

  // If we enter the room again, stop old Wood-specific async logic first
  cleanupWoodRoom();

  woodSection.style.backgroundImage = `url("${dataJSON.room1wood.backgroundImg}")`;

  // Let transition helper handle showing / switching to this room
  goToSection(woodSection, TRANSITIONTIME);

  // Allow entering room every time (transition + header + timer)
  // But only create heavy stuff once (particles + event listeners)
  const isFirstInit = woodSection.dataset.woodInit !== "true";
  if (isFirstInit) woodSection.dataset.woodInit = "true";

  //-----------------------------------------------------------
  //------------------------- TIMER SETUP ---------------------
  //-----------------------------------------------------------

  // Start timer for room 1
  startTimer(1);

  // Watch shared TimeIsUp flag while this room is active
  timeUpIntervalId = window.setInterval(() => {
    // Ignore if timer is not up yet
    if (!TimeIsUp) return;

    // Ignore if Wood is no longer the current visible room
    if (getCurrentPage() !== woodSection) return;

    ifRoomFailed();
  }, 200);

  woodSection.dataset.timeUpWatcherId = String(timeUpIntervalId);

  //-----------------------------------------------------------
  //-------------------------- ROOM UI ------------------------
  //-----------------------------------------------------------

  stopAll(); // Stop music (even if it's first room)
  /* Play the background music for wood room */
  const bgmId = dataJSON.room1wood.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // Fade in background music
  }

  showGameHeader();

  // Firefly animation
  const particlesWrap =
    woodSection.querySelector<HTMLDivElement>(".woodParticles");

  // Prevent adding particles again on re-enter
  if (particlesWrap && particlesWrap.childElementCount === 0) {
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "woodParticle";

      // Size of fireflies
      const size = 2 + Math.random() * 6; // 2px – 8px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // Start position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${60 + Math.random() * 40}%`; // Start in lower part of screen

      // Animation speed + delay
      const floatSeconds = 6 + Math.random() * 10; // 6–16s
      const flickerSeconds = 1.5 + Math.random() * 2.5; // 1.5–4s
      particle.style.animationDuration = `${floatSeconds}s, ${flickerSeconds}s`;
      particle.style.animationDelay = `${Math.random() * 4}s, ${Math.random() * 2}s`;

      particlesWrap.appendChild(particle);
    }
  }

  // Render description from JSON into room description area
  renderRoomDesc(woodSection, dataJSON.room1wood.desc);

  //-----------------------------------------------------------
  //--------------------------- DOM ---------------------------
  //-----------------------------------------------------------

  const slots = Array.from(
    woodSection.querySelectorAll<HTMLDivElement>(".slot"),
  );

  const keypad = woodSection.querySelector<HTMLDivElement>(".keypad");

  const levelTextEl = woodSection.querySelector<HTMLSpanElement>("#levelText");
  const mistakesTextEl =
    woodSection.querySelector<HTMLSpanElement>("#mistakesText");
  const roomBalanceEl =
    woodSection.querySelector<HTMLDivElement>("#balanceFill");

  // Guard against missing DOM
  if (
    !keypad ||
    slots.length !== SLOTS_PER_STAGE ||
    !levelTextEl ||
    !mistakesTextEl ||
    !roomBalanceEl
  ) {
    throw new Error("Wood room DOM mismatch");
  }

  // Safe non-null variables after guard
  const levelText = levelTextEl;
  const mistakesText = mistakesTextEl;
  const balanceFill = roomBalanceEl;

  // Array with all keypad buttons
  const keyBtns = Array.from(
    keypad.querySelectorAll<HTMLButtonElement>("button.key"),
  );

  //-----------------------------------------------------------
  //-------------------------- STATE --------------------------
  //-----------------------------------------------------------

  // Current level index (0-2)
  let currentLevelIndex = 0;

  // Which of the 6 slots are we writing in right now
  let activeSlotIndex = 0;

  // Store strings so we can compare typed digits to expected strings
  let slotValues: string[] = Array(SLOTS_PER_STAGE).fill("");

  // Mistake counter
  let mistakes = 0;

  // Prevent input during short transitions between levels / room result
  let isTransitioning = false;

  //-----------------------------------------------------------
  //------------------------ RENDER UI ------------------------
  //-----------------------------------------------------------

  function renderSlots(): void {
    slots.forEach((slot, i) => {
      slot.textContent = slotValues[i] || "";
      slot.classList.toggle("is-active", i === activeSlotIndex);

      const expectedStr = String(LEVELS[currentLevelIndex][i]);
      slot.dataset.digits = String(expectedStr.length);
    });
  }

  function renderHUD(): void {
    levelText.textContent = `${currentLevelIndex + 1}/${LEVELS.length}`;
    mistakesText.textContent = String(mistakes);

    // Balance bar percentage calc
    const MIN_START = 5;
    const progressBase =
      MIN_START + (currentLevelIndex / LEVELS.length) * (100 - MIN_START);
    const penalty = mistakes * MISTAKE_PENALTY;
    const balanceWobble =
      Math.sin((currentLevelIndex + 1) * 2 + mistakes * 1.5) * WOBBLEBALANCE;

    const balancePercent = Math.max(
      0,
      Math.min(100, progressBase - penalty + balanceWobble),
    );

    balanceFill.style.width = `${balancePercent}%`;
  }

  function updateUI(): void {
    renderSlots();
    renderHUD();
  }

  //-----------------------------------------------------------
  //-------------------------- HELPERS ------------------------
  //-----------------------------------------------------------

  /**
   * Small delay helper for level transitions.
   * Blocks input briefly so player can see completed numbers.
   */
  function delayTransit(ms: number, after: () => void): void {
    isTransitioning = true;

    window.setTimeout(() => {
      // Ignore if Wood is no longer active
      if (getCurrentPage() !== woodSection) return;

      after();
      isTransitioning = false;
    }, ms);
  }

  // Reset inputs for current level
  function resetLevelInput(): void {
    slotValues = Array(SLOTS_PER_STAGE).fill("");
    activeSlotIndex = 0;
  }

  //-----------------------------------------------------------
  //--------------------------- LOGIC -------------------------
  //-----------------------------------------------------------

  // Add number to active slot as string
  function pushDigit(digit: string): void {
    // Ignore input during delayed transitions
    if (isTransitioning) return;

    // Ignore if Wood is no longer active
    if (getCurrentPage() !== woodSection) return;

    const expectedStr = String(LEVELS[currentLevelIndex][activeSlotIndex]);

    // Only allow expected number of digits in slot
    if (slotValues[activeSlotIndex].length >= expectedStr.length) return;

    slotValues[activeSlotIndex] += digit;
    updateUI();

    // If slot is full, move forward or validate level
    if (slotValues[activeSlotIndex].length === expectedStr.length) {
      advanceOrValidateLevel();
    }

    updateUI();
  }

  function advanceOrValidateLevel(): void {
    if (activeSlotIndex < SLOTS_PER_STAGE - 1) {
      activeSlotIndex++;
      return;
    }
    // Last input filled → validate level
    validateLevel();
  }

  function validateLevel(): void {
    const expectedLevel = LEVELS[currentLevelIndex].map(String);
    const levelOk = slotValues.every((value, i) => value === expectedLevel[i]);
    if (!levelOk) {
      mistakes++;
      resetLevelInput();
      updateUI();
      return;
    }

    // If level is completed → move to next level
    if (currentLevelIndex < LEVELS.length - 1) {
      delayTransit(700, () => {
        currentLevelIndex++;
        resetLevelInput();
        updateUI();
      });
      return;
    }
    // All levels completed
    ifRoomCompleted();
  }

  // Backspace button logic
  function backspace(): void {
    if (isTransitioning) return;
    if (getCurrentPage() !== woodSection) return;

    // If active slot has content, remove last digit
    if (slotValues[activeSlotIndex].length > 0) {
      slotValues[activeSlotIndex] = slotValues[activeSlotIndex].slice(0, -1);
      updateUI();
      return;
    }

    // If current slot is empty, move back one slot
    if (activeSlotIndex > 0) {
      activeSlotIndex--;
    }

    if (slotValues[activeSlotIndex].length > 0) {
      slotValues[activeSlotIndex] = slotValues[activeSlotIndex].slice(0, -1);
    }

    updateUI();
  }

  //-----------------------------------------------------------
  //---------------------- GO TO NEXT ROOM --------------------
  //-----------------------------------------------------------

  function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
    const nextSection = document.querySelector<HTMLElement>(nextSelector);
    if (!nextSection) return;

    // Clean up Wood-specific async logic before leaving
    cleanupWoodRoom();

    // First: transition to the next room section
    goToSection(nextSection, TRANSITIONTIME);

    // Then: start the next room logic after transition is done
    window.setTimeout(() => {
      nextRoomFunc();
    }, TRANSITIONTIME);
  }

  //-----------------------------------------------------------
  //---------------------- ROOM COMPLETE ----------------------
  //-----------------------------------------------------------

  function ifRoomCompleted(): void {
    if (isTransitioning) return;
    // Block input while we show final state + delay
    isTransitioning = true;

    // Render final UI state
    updateUI();

    if (mistakes === 0) {
      balanceFill.style.width = "100%";
    }

    stopTimeUpWatcher();

    setRoomResult("wood", {
      status: "completed",
      artifact: "true",
      mistakes: mistakes,
      score: 0, // TODO: define rule later
      roomTimeSec: 0, // TODO: connect to timer later
    });

    stopTimer(1);
    stopAll(); // Stop music
    updateProgressBar();

    showMsg("Well done — next chamber awaits", TRANSITIONTIME * 2);
    console.log("Wood result:", getRoomResults().wood);

    completeTimeoutId = window.setTimeout(() => {
      // Ignore if player already left Wood in some unexpected way
      if (getCurrentPage() !== woodSection) return;

      currentLevelIndex = 0;
      mistakes = 0;
      resetLevelInput();
      isTransitioning = false;
      updateUI();

      goToNextRoom("#room2Fire", room2fireFunc);
    }, TRANSITIONTIME);
  }

  //-----------------------------------------------------------
  //----------------------- ROOM FAIL -------------------------
  //-----------------------------------------------------------

  // Called when the room timer hits 0
  function ifRoomFailed(): void {
    if (isTransitioning) return;

    // Block input so player can't keep interacting
    isTransitioning = true;

    stopTimeUpWatcher();

    // Update UI one last time
    updateUI();

    setRoomResult("wood", {
      status: "failed",
      artifact: "false",
      mistakes: mistakes,
      score: 0,
      roomTimeSec: 0,
    });

    stopTimer(1);
    stopAll(); // Stop music
    updateProgressBar();

    console.log("Wood fail result:", getRoomResults().wood);

    showMsg("Time's up — next chamber awaits", TRANSITIONTIME * 2);

    failTimeoutId = window.setTimeout(() => {
      // Ignore if player already left Wood in some unexpected way
      if (getCurrentPage() !== woodSection) return;

      currentLevelIndex = 0;
      mistakes = 0;
      resetLevelInput();
      isTransitioning = false;
      updateUI();

      goToNextRoom("#room2Fire", room2fireFunc);
    }, TRANSITIONTIME);
  }

  //-----------------------------------------------------------
  //------------------------ KEY EVENTS -----------------------
  //-----------------------------------------------------------

  function handleKeypadClick(e: MouseEvent): void {
    // Ignore clicks if Wood is no longer active
    if (getCurrentPage() !== woodSection) return;

    const target = e.target as HTMLElement | null;
    if (!target) return;

    const btn = target.closest<HTMLButtonElement>("button.key");
    if (!btn) return;

    btn.focus();

    const digit = btn.dataset.key;
    const action = btn.dataset.action;

    if (digit) pushDigit(digit);
    if (action === "back") backspace();
  }

  function handleKeyDownEvent(e: KeyboardEvent): void {
    // Ignore keyboard events if Wood is no longer active
    if (getCurrentPage() !== woodSection) return;

    const active = document.activeElement as HTMLButtonElement | null;
    if (!active || !active.classList.contains("key")) return;

    const currentKeyIndex = keyBtns.indexOf(active);
    if (currentKeyIndex === -1) return;

    // Enter / space triggers click on focused keypad button
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      active.click();
      return;
    }

    // Only arrow keys move keypad focus
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();

    const nextKeyIndex =
      e.key === "ArrowRight"
        ? Math.min(currentKeyIndex + 1, keyBtns.length - 1)
        : Math.max(currentKeyIndex - 1, 0);
    if (nextKeyIndex === currentKeyIndex) return;

    // Roving tabindex
    keyBtns[currentKeyIndex].tabIndex = -1;
    keyBtns[nextKeyIndex].tabIndex = 0;
    keyBtns[nextKeyIndex].focus();
  }
  // Prevent adding event listeners twice if player re-enters the room
  if (isFirstInit) {
    keypad.addEventListener("click", handleKeypadClick);
    keypad.addEventListener("keydown", handleKeyDownEvent);
  }

  function initKeypadFocus(): void {
    // Only one button should be tabbable at a time
    keyBtns.forEach((btn, i) => {
      btn.tabIndex = i === 0 ? 0 : -1;
    });
  }

  //-----------------------------------------------------------
  //--------------------------- INIT --------------------------
  //-----------------------------------------------------------

  initKeypadFocus();
  updateUI();
}
