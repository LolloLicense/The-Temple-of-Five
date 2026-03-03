import { playBgm } from "../../audio";
import * as dataJSON from "../../data.json";
import { renderRoomDesc } from "../../script/helper/roomDesc";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { transitSections, getCurrentPage, showSection } from "../../script/helper/transitions";
import { showGameHeader, hideGameHeader } from "../../script/helper/gameHeader";
import { showMsg } from "../../script/helper/showMsg";
import { setRoomResult } from "../../script/helper/storage";
import { room3earthFunc } from "../3earth/room3earth.ts";


/**
 * FIRE ROOM (2)
 * 
 * Intro-text from JSON (shown 8 sec after entering the room)
 * After into, show level instruction (stay until you're finished with the level, then show the next one) + fokus on the puzzle section
 * 
 * Sequense puzzle and wordplay with 4 levels - Keyboard + mouse klick
 * The player choose elements trough a sequence of 3-5 keys, each key represents an element (Air, Timber, Flame, Ember, Stone, Water)
 * Fill the slots in the right order
 * When the last slot is filled - check if the sequence is correct.
 * Correct: Sucess glow (animation) + move on to the next level
 * Wrong: Shake + reset + mistakes counter
 * 
 * LEVELS:
 * 
 * Level 1: 4 empty slots (START THE FIRE)
 * Level 2: 3 slots, 1 pre-filled with Flame (OVERHEAT)
 * Level 3: 4 slots, 1 pre-filled with Stone (FADING FIRE)
 * Level 4: 5 slots, 1 pre-filled with Flame (FINDING BALANCE)
 * 
 */

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------- CONSTANTS -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

const INTRO_MS = 8000; // Time in milliseconds before the intro text is shown (8 seconds)
const FOCUS_CLASS = "is-focus"; // The class name used to indicate that the puzzle section is in focus
const SUCCESS_DELAY_MS = 500;
const WRONG_DELAY_MS = 350;
const TRANSITION_MS = 1200;
const COMPLETE_MSG_MS = 2400;


/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------- TYPES AND LEVELS ---------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * String literal type for the fire room keys, which can be used to ensure type safety when referencing these keys in the code.
 * A = Air, T = Timber, F = Flame, E = Ember, S = Stone, W = Water
 */

type TFireKey = "A" | "T" | "F" | "E" | "S" | "W";

interface IFireLevel {
  sequence: TFireKey[]; // The correct sequence of keys for the level
  prefilled?: TFireKey;  // If the level contain a pre-filled slot
}

// Typeguard, only accepts the correct keyboard keys
function isFireKey(k: string): k is TFireKey {
  return k === "A" || k === "T" || k === "F" || k === "E" || k === "S" || k === "W";
}

// Config, level combo for keys

const LEVELS: IFireLevel[] = [
  {
    sequence: ["T", "F", "S", "A"] // Level 1: Timber, Flame, Stone, Air
  },
  {
    sequence: ["F", "W", "S"], // Level 2: FLAME, Water, Stone
    prefilled: "F"
  },
  {
    sequence: ["S", "T", "A", "F"], // Level 3: Stone, Timber, Air, Flame
    prefilled: "S"
  },
  {
    sequence: ["F", "T", "A", "S", "E"],  // Level 4: Flame, Timber, Air, Stone, Ember
    prefilled: "F"
  },
];

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------ LEVEL TEXTS INSTRUCTIONS ------------------------------------------------------------------ */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

const FIRE_LEVEL_TEXT: string[] = [
  `AWAKEN THE FIRE -

 The temple is cold.
The flame has not yet been born.
Fire is born of substance.
It must be awakened.
It must be contained.
And only then —
given breath.`,

  `THE WILD FLAME -

 You have stirred the fire —
but without discipline.
It rages beyond its bounds.
Do not feed it.
Do not let it breathe again.
Cool it —
and bind it.`,

  `THE FADING LIGHT - 

 Bound too tightly,
fire cannot live.
Give it substance.
Let it breathe.
Awaken it —
but do not drown it again.`,

  `THE DISCIPLINE OF BALANCE -

 Fire that rages will destroy.
Fire that dies is useless.

A balanced flame is fed,
given breath,
restrained —
and allowed to rest.
Do not awaken it twice.
Do not cool it.`,
];

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------ DOM AND STATE ----------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * DOM references and state variables for the fire room, which will be used to manage the game logic and user interactions within the room.
 * resetRoom() can be called to reset all state and DOM elements to their initial state when the player re-enters the room or restarts a level.
 */

let fireSection: HTMLElement | null = null;
let fireSlots: HTMLElement | null = null;

let keyButtons: HTMLButtonElement[] = [];

let levelValueEl: HTMLElement | null = null;
let mistakesEl: HTMLElement | null = null;
let balanceBar: HTMLElement | null = null;
let balanceFill: HTMLElement | null = null;

/* STATE */
let currentLevelIndex = 0;
let attempt: TFireKey[] = [];
let mistakes = 0;
let locked = false;

let listenersBound = false;
let isTransitioning = false;

/* TIMEOUT WATCHER - (Room timer) */

let timeUpIntervalId: number | null = null;

function stopTimeUpWatcher(): void {
  if (timeUpIntervalId !== null) {
    window.clearInterval(timeUpIntervalId);
    timeUpIntervalId = null;
  }
}

let introTimeoutId: number | null = null;

function stopIntroTimeout(): void {
  if (introTimeoutId !== null) {
    window.clearTimeout(introTimeoutId);
    introTimeoutId = null;
  }
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------------- EVENT HANDLERS --------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function handleFireClick(e: MouseEvent): void {
  if (locked || isTransitioning) return;
  if (!fireSection) return;

  // Only react when Fire room is visible (prevents leakage to other rooms)
  if (!fireSection.classList.contains("isVisible")) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Any click inside fireSection -> find closest button.fireKey
  const btn = target.closest<HTMLButtonElement>(".fireKey");
  if (!btn) return;

  const pick = btn.dataset.firePick;
  if (!pick) return;

  const k = pick.toUpperCase();
  if (!isFireKey(k)) return;

  handlePick(k);
}

function handleFireKeyDown(e: KeyboardEvent): void {
  if (locked || isTransitioning) return;
  if (!fireSection) return;

  // Only react when Fire room is visible (prevents leakage to other rooms)
  if (!fireSection.classList.contains("isVisible")) return;

  const k = e.key.toUpperCase();
  if (!isFireKey(k)) return;

  // Prevent page scroll etc. when pressing keys
  e.preventDefault();
  handlePick(k);
}

/**
 * Bind click event to the element buttons, only once to avoid double listeners.
 * Only FireKeys
 * Send to handlePick, game logic
 */

function bindListenersOnce(): void {
  if (!fireSection) return;

  // Click delegation on the room section (captures clicks on icons inside buttons too)
  fireSection.addEventListener("click", handleFireClick);

  // Keyboard is global (but guarded by "isVisible" above)
  window.addEventListener("keydown", handleFireKeyDown);
}


/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------- ENTRY POINT ------------------------------------------------------------------------ */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * Hides welcome page - sets the background for the fire room - shows the fire room section - plays the background music for the fire room
 */

export function room2fireFunc(): void {
  fireSection = document.querySelector<HTMLElement>("#room2Fire");
  if (!fireSection) return;

  showGameHeader(); // Show header when entering fire room

  fireSection.style.backgroundImage = `url("${dataJSON.room2fire.backgroundImg}")`; // Set background image from JSON

  // If transiting from Wood room or other sections
  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  // Change page with fade animation
  if (fromPage && fromPage !== fireSection) {
    transitSections(fromPage, fireSection, TRANSITION_MS);
  } else {
    showSection(fireSection); // fallback first load - show room directly with showSection
  }

  stopTimeUpWatcher();  // No double watchers if re-entering the room
  startTimer(2); // Start the timer for the fire room

  timeUpIntervalId = window.setInterval(() => {
    if (!TimeIsUp) return;
    ifRoomFailed();
  }, 200);

  const bgmId = dataJSON.room2fire.bgmId; // Play the background music for the fire room
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }

  renderRoomDesc(fireSection, dataJSON.room2fire.desc); // Render description from helper function, with text and icons from JSON

  cacheDomOrThrow(); // Cashe DOM only once or throw error if missing

  if (!listenersBound) {
    bindListenersOnce();  // Bind event listeners only once
    listenersBound = true;
  }

  // always a reset when entering
  resetRoom();

  console.log("Hello from the fire room");
  console.log("Calling playBgm with:", bgmId);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* -------------------------------------------------------------- DOM SETUP ------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function cacheDomOrThrow(): void {
  if (!fireSection) throw new Error("Fire room: #room2Fire missing");

  fireSlots = fireSection.querySelector("#fireSlots");
  keyButtons = Array.from(
    fireSection.querySelectorAll<HTMLButtonElement>(".fireKey"),
  );

  levelValueEl = fireSection.querySelector("#fireLevelValue");
  mistakesEl = fireSection.querySelector("#fireMistakes");
  balanceBar = fireSection.querySelector(".balanceBar");
  balanceFill = fireSection.querySelector("#fireBalanceFill");

  if (
    !fireSlots ||
    keyButtons.length === 0 ||
    !levelValueEl ||
    !mistakesEl ||
    !balanceBar ||
    !balanceFill
  ) {
    throw new Error(
      "Fire room DOM mismatch. Need: #fireSlots, .fireKey, #fireLevelValue, #fireMistakes, .balanceBar, #fireBalanceFill",
    );
  }
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------- ROOM RESET ------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */


function resetRoom(): void {  // reset state
  stopIntroTimeout();
  currentLevelIndex = 0;
  applyLevelClass();
  attempt = [];
  mistakes = 0;

  updateDescText(dataJSON.room2fire.desc.text);

  locked = true;  // Locked input
  isTransitioning = true;

  createSlots();  // Prepare UI level 1, but input still locked
  updateHUD();

  fireSlots?.classList.remove(FOCUS_CLASS); // Fokus off until intro is done

  introTimeoutId = window.setTimeout(() => { // After intro - Show level 1 instruction - release locked input and focus input
    updateDescText(FIRE_LEVEL_TEXT[0] ?? "");

    locked = false;
    isTransitioning = false;
    fireSlots?.classList.add(FOCUS_CLASS);
    setActiveSlotClass();

  }, INTRO_MS);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------ DESCRIPTION ------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function updateDescText(text: string): void {
  if (!fireSection) return;

  const textEl =
    fireSection.querySelector<HTMLElement>(".roomDesc .descText");

  if (!textEl) {
    throw new Error("Missing .descText (renderRoomDesc must run first)");
  }

  textEl.textContent = text;
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------------- EMBER ANIMATION ----------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * Apply ember intensity class on section depending on level
 * Removes previous level classes before applying new one
 */

function applyLevelClass(): void {
  if (!fireSection) return;

  // remove old classes
  fireSection.classList.remove(
    "fire--l1",
    "fire--l2",
    "fire--l3",
    "fire--l4",
  );

  // add actual level class
  const levelClass = `fire--l${currentLevelIndex + 1}`;
  fireSection.classList.add(levelClass);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------- UI / HUD --------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * updateHUD() - Responsible for updating HUD, that'll be level text, misstakes, progress-bar
 * createSlots() - Build the slot row in DOM for the actual level 
 * setActiveSlotClass() - For better UX, marks the slot that has tp be filled in
 * fillSlot () - Resposible for putting the right element in a certain slot
 */

function updateHUD(): void {
  if (!levelValueEl || !mistakesEl || !balanceBar || !balanceFill) return;  // Fallback

  const level = LEVELS[currentLevelIndex];  // get the levels array for the current level

  levelValueEl.textContent = `${currentLevelIndex + 1} / ${LEVELS.length}` // Showing level 1 - 4, +1 because currentLevelIndex starts at 0.

  mistakesEl.textContent = String(mistakes);  // Show mistakes as text. (string)

  const totalSlots = level.sequence.length; // totalSlots = How many slots for the current level
  const playerSlots = level.prefilled ? Math.max(0, totalSlots - 1) : totalSlots; // playerSlots = How many slots that has to be filled (example, prefilled = -1 that has to be filled)

  const playerFilled = level.prefilled ? Math.max(0, attempt.length - 1) : attempt.length;  // playerFilled = How many slots that has been filled in

  const progress = playerSlots === 0 ? 0 : playerFilled / playerSlots;  // If playerSlots = 0, put 0 to avoid division with 0
  const percent = Math.round(progress * 100); // percent = progress in %, rounded to integer

  balanceFill.style.width = `${percent}%`;  // Visual width styling on the progress bar
  balanceBar.setAttribute("aria-valuenow", String(percent));  // For screen readers in percentages (bar)
}

function createSlots(): void {
  if (!fireSlots) return; // Fallback

  fireSlots.replaceChildren();  // Clears the old slots (we start from 0 in each level)

  const level = LEVELS[currentLevelIndex];  // level =Get actual level
  const total = level.sequence.length;  // total = how many slots to create (sequence)

  for (let i = 0; i < total; i++) { // Loop, creates (total) div.slots with data index 
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.index = String(i);
    slot.setAttribute("aria-hidden", "true"); // Decorative slots - that's why aria-hidden. However, return to check a11y later **IMPORTANT**
    fireSlots.appendChild(slot);
  }

  attempt = []; // Reset attempt with new slots (new level, new inputs)

  if (level.prefilled) {
    attempt.push(level.prefilled);
    fillSlot(0, level.prefilled); // if prefilled slot - make attempt.length 1 - activeIndex can point at the next slot automaticaly 

    const first = fireSlots.querySelector<HTMLElement>('.slot[data-index="0"]');  // Mark slot 0 as locked (prefilled and not active) - CSS Styling.
    first?.classList.add("is-locked");
  }

  setActiveSlotClass(); // Next slot active instead
}

function setActiveSlotClass(): void {
  if (!fireSlots) return;

  const slots = Array.from(fireSlots.querySelectorAll<HTMLElement>(".slot")); // slots = Fetch all the slots in the array so we can loop
  const activeIndex = attempt.length; // activeIndex = example, attempt.length = 0, -> we have to fill in slot 0. If prefilled jump to next slot.

  slots.forEach((s, i) => s.classList.toggle("is-active", i === activeIndex));  // Only the correct slot get index "is-active" - CSS styling
}

function fillSlot(slotIndex: number, key: TFireKey): void {  // Fill the specified slot with FireKey (element)
  if (!fireSlots) return;

  const slotEl = fireSlots.querySelector<HTMLElement>(`.slot[data-index="${slotIndex}"]`);  // slotEl = find the correct slot bvased on the data index
  if (!slotEl) return;


  const btn = keyButtons.find((b) => b.dataset.firePick?.toUpperCase() === key);  // Find correct FireKey in "keypad", uppercase to match (example "A" "T"..)
  const svg = btn?.querySelector("svg");  // Get the SVG from buttons

  slotEl.replaceChildren();
  if (svg) slotEl.appendChild(svg.cloneNode(true)); // cloneNode(true) = Clone the whole SVG tree - (This is because a DOM element cant be in two places at the same time) Cloning so we can show in button and slot.
  else slotEl.textContent = key;  // Fallback

  retriggerClass(slotEl, "just-filled");  // Re-trigger class so we can create an animation
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------ GAME LOGIC -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function handlePick(key: TFireKey): void {
  if (locked || isTransitioning) return;

  const level = LEVELS[currentLevelIndex];
  const total = level.sequence.length;

  if (attempt.length >= total) return;  // If already filled, ignore input

  attempt.push(key);  // add input

  fillSlot(attempt.length - 1, key) // Fill the correct slot in UI

  setActiveSlotClass();
  updateHUD();

  if (attempt.length === total) {
    void validateSequence();
  }

  console.log("handlePick", key, "time:", Date.now());
}

async function validateSequence(): Promise<void> {
  const expected = LEVELS[currentLevelIndex].sequence;

  const ok =
    attempt.length === expected.length &&
    attempt.every((k, i) => k === expected[i]);

  if (ok) {
    locked = true;

    if (fireSlots) retriggerClass(fireSlots, "is-success");
    await wait(SUCCESS_DELAY_MS);

    locked = false;
    nextLevel();
    return;
  }

  locked = true;
  mistakes += 1;
  updateHUD();

  if (fireSlots) retriggerClass(fireSlots, "is-wrong");
  await wait(WRONG_DELAY_MS);

  resetAttempt();
  locked = false;
}

function resetAttempt(): void {
  createSlots();
  updateHUD();
}

function nextLevel(): void {
  if (currentLevelIndex >= LEVELS.length - 1) {
    ifRoomCompleted();
    return;
  }

  currentLevelIndex += 1;
  applyLevelClass();

  updateDescText(FIRE_LEVEL_TEXT[currentLevelIndex] ?? "");

  createSlots();
  updateHUD();

  if (fireSlots) retriggerClass(fireSlots, FOCUS_CLASS);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------- COMPLETE / FAIL ROOM --------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  if (!fireSection) return;

  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  transitSections(fireSection, nextSection, TRANSITION_MS);

  window.setTimeout(() => {
    nextRoomFunc();
  }, TRANSITION_MS);
}

function ifRoomCompleted(): void {
  stopTimeUpWatcher();
  stopIntroTimeout();
  stopTimer(2);

  isTransitioning = true;
  locked = true;

  updateHUD();
  setActiveSlotClass();

  // Save room result
  setRoomResult("fire", { status: "completed", artifact: "true" });

  // Show msg
  showMsg("Well done — next chamber awaits", COMPLETE_MSG_MS);


  window.setTimeout(() => {
    // CLEANUP:
    currentLevelIndex = 0;
    attempt = [];
    mistakes = 0;

    applyLevelClass();
    createSlots();
    updateHUD();
    setActiveSlotClass();

    // Lås upp (men rummet kommer ändå försvinna i transition)
    isTransitioning = false;
    locked = false;

    // Fire ansvarar för transition till Earth
    goToNextRoom("#room3Earth", room3earthFunc);
  }, COMPLETE_MSG_MS);
}

function ifRoomFailed(): void {
  stopTimeUpWatcher();
  stopIntroTimeout();
  stopTimer(2);

  isTransitioning = true;
  locked = true;

  updateHUD();
  setActiveSlotClass();

  setRoomResult("fire", { status: "failed", artifact: "false" });

  showMsg("Time's up — next chamber awaits", COMPLETE_MSG_MS);

  //  Efter message -> reset -> transition till Earth
  window.setTimeout(() => {
    currentLevelIndex = 0;
    attempt = [];
    mistakes = 0;

    applyLevelClass();
    createSlots();
    updateHUD();
    setActiveSlotClass();

    isTransitioning = false;
    locked = false;

    goToNextRoom("#room3Earth", room3earthFunc);
  }, COMPLETE_MSG_MS);
}



/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------ EXIT ROOM --------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

export function exitFireRoom(): void {
  const welcomeSection = document.querySelector<HTMLElement>("#welcomePage");
  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  if (!welcomeSection || !fromPage) return;

  stopTimeUpWatcher();
  stopTimer(2);
  stopIntroTimeout();

  hideGameHeader();
  transitSections(fromPage, welcomeSection, TRANSITION_MS);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------- HELPERS ---------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retriggerClass(el: HTMLElement, className: string): void {
  el.classList.remove(className);

  void el.offsetWidth;

  el.classList.add(className);
}