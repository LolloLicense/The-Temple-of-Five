import { playBgm } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import {
  getCurrentPage,
  showSection,
  transitSections,
} from "../../script/helper/transitions.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { setRoomResult } from "../../script/helper/storage.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import { room2fireFunc } from "../2fire/room2fire.ts";

//-----------------------------------------------------------
//----------------------CONFIG / RULES-----------------------
//-----------------------------------------------------------

// Levels = 3 levels/ stages. Each level contains 6 fibenacci numbers
// [] = Outer array Levels [] = Inner array
const LEVELS: number[][] = [
  [0, 1, 1, 2, 3, 5],
  [8, 13, 21, 34, 55, 89],
  [144, 233, 377, 610, 987, 1597],
];

// numer of "inputboxes"
const SLOTS_PER_STAGE = 6;
// In Room Balance
const MISTAKE_PENALTY = 4;
const WOBBLEBALANCE = 1.5;

export function room1woodFunc() {
  //----------------------------------------------------------
  //----------------------SETUP ROOM DOM----------------------
  //----------------------------------------------------------

  const woodSection: HTMLElement | null = document.querySelector("#room1Wood");
  if (!woodSection) {
    return;
  }

  woodSection.style.backgroundImage = `url("${dataJSON.room1wood.backgroundImg}")`;
  // Find the current visible page BEFORE switching
  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");
  if (fromPage && fromPage !== woodSection) {
    // Fade from current page -> wood room
    transitSections(fromPage, woodSection, 1200);
  } else {
    // Fallback (first load): just show the room
    showSection(woodSection);
  }
  showGameHeader();

  /* Play the background music for woodroom */
  const bgmId = dataJSON.room1wood.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the wood room, with a fade-in duration of 650ms
  }

  // fireflie animation
  const particlesWrap =
    woodSection.querySelector<HTMLDivElement>(".woodParticles");
  if (particlesWrap && particlesWrap.childElementCount === 0) {
    // pervents adding amout after re-entering room
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement("div");
      particle.className = "woodParticle";

      // size of fireflies
      const size = 2 + Math.random() * 6; // 2px – 8px
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      // start position
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${60 + Math.random() * 40}%`; // start lower part of screen

      // animation speed + delay
      const floatSeconds = 6 + Math.random() * 10; // 6–16s
      const flickerSeconds = 1.5 + Math.random() * 2.5; // 1.5–4s
      particle.style.animationDuration = `${floatSeconds}s, ${flickerSeconds}s`;
      particle.style.animationDelay = `${Math.random() * 4}s, ${Math.random() * 2}s`;

      particlesWrap.appendChild(particle);
    }
  }

  // Prevent adding event listeners twice if player re-enters the room
  if (woodSection.dataset.woodInit === "true") return;
  woodSection.dataset.woodInit = "true";
  // Start timer for room 1
  startTimer(1);
  // --- TIMEOUT WATCHER (room timer) -------------------------
  // Poll TimeIsUp every 200ms. When it's true, we fail this room once.
  let timeUpIntervalId: number | null = null;

  function stopTimeUpWatcher(): void {
    if (timeUpIntervalId !== null) {
      window.clearInterval(timeUpIntervalId);
      timeUpIntervalId = null;
    }
  }

  timeUpIntervalId = window.setInterval(() => {
    if (!TimeIsUp) return;
    ifRoomFailed();
  }, 200);

  // render desc from JSON into <div id="roomDesc">
  renderRoomDesc(woodSection, dataJSON.room1wood.desc);

  //-----------------------------------------------------------
  //-------------------------DOM-------------------------------
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

  // guard if not HTML match and prevents errors for properties of null
  if (
    !keypad ||
    slots.length !== SLOTS_PER_STAGE ||
    !levelTextEl ||
    !mistakesTextEl ||
    !roomBalanceEl
  ) {
    throw new Error("Wood room DOM mismatch");
  }

  // Make “safe” non-null variables AFTER guard
  const levelText = levelTextEl;
  const mistakesText = mistakesTextEl;
  const balanceFill = roomBalanceEl;

  // Array with all my buttons class=key 0-9 & backspace
  const keyBtns = Array.from(
    keypad.querySelectorAll<HTMLButtonElement>("button.key"),
  );

  //-----------------------------------------------------------
  //-------------------------STATE-----------------------------
  //-----------------------------------------------------------

  // levels (0-2)
  let currentLevelIndex = 0;
  // witch of the 6 inputs are we writing in atm (index 0-5)
  let activeSlotIndex = 0;
  // store string so we can compare digit to digit and compare to expectedStr
  let slotValues: string[] = Array(SLOTS_PER_STAGE).fill("");
  // Mistake counter state
  let mistakes = 0;
  // levels transition - letting player see the last digits before next level
  let isTransitioning = false;

  //-----------------------------------------------------------
  //-------------------------RENDER UI-------------------------
  //-----------------------------------------------------------

  function renderSlots(): void {
    // writing the soltsvalue to input
    slots.forEach((slot, i) => {
      slot.textContent = slotValues[i] || "";
      slot.classList.toggle("is-active", i === activeSlotIndex);

      const expectedStr = String(LEVELS[currentLevelIndex][i]);
      slot.dataset.digits = String(expectedStr.length);
    });
  }
  // HUD IN roomprogressbar
  function renderHUD(): void {
    levelText.textContent = `${currentLevelIndex + 1}/${LEVELS.length}`;
    mistakesText.textContent = String(mistakes);

    // Percent balance calc

    // startmode 5% minimum
    const MIN_START = 5;
    // base calc on levels done
    const progressBase =
      MIN_START + (currentLevelIndex / LEVELS.length) * (100 - MIN_START);
    // penalty for number of mistakes
    const penalty = mistakes * MISTAKE_PENALTY;
    // smooth wobble for the nerves ( Math.sin = value between -1 & 1)
    const balanceWobble =
      Math.sin((currentLevelIndex + 1) * 2 + mistakes * 1.5) * WOBBLEBALANCE;
    // calc for % in balancebar (Math.max = never returns value < 0 (Math.min always returns < 100))
    const balancePercent = Math.max(
      0,
      Math.min(100, progressBase - penalty + balanceWobble),
    );
    balanceFill.style.width = `${balancePercent}%`;
  }

  function updtUI(): void {
    renderSlots();
    renderHUD();
  }

  //-----------------------------------------------------------
  //-------------------------HELPERS---------------------------
  //-----------------------------------------------------------

  // Delay helper - pause transition so player can see all digits before next level
  function delayTransit(ms: number, after: () => void): void {
    // block input so player dont spam buttons while transit
    isTransitioning = true;
    // wait ms , then run after
    setTimeout(() => {
      after(); // run transit
      isTransitioning = false; // un-block input
    }, ms);
  }

  // reset inputs for current level
  function resetLevelInput(): void {
    slotValues = Array(SLOTS_PER_STAGE).fill("");
    activeSlotIndex = 0;
  }

  //-----------------------------------------------------------
  //-------------------------LOGICS----------------------------
  //-----------------------------------------------------------

  // add number in active slot as string
  function pushDigit(digit: string): void {
    // If we are currently delaying a transition, ignore clicks/keys
    if (isTransitioning) return;
    // controls how many digits a slot should have ( 1 , 2 or 3)
    const expectedStr = String(LEVELS[currentLevelIndex][activeSlotIndex]);
    // only expected amout of digits allowed
    if (slotValues[activeSlotIndex].length >= expectedStr.length) return;
    // add number in current slot
    slotValues[activeSlotIndex] += digit;
    //Upd UI to show all state changes
    updtUI();
    // if slot is full - move to next slot
    if (slotValues[activeSlotIndex].length === expectedStr.length) {
      advanceOrValidateLevel();
    }
    //RENDER AGAIN because advanceOrValidateLevel() changes state
    // (activeSlotIndex++ or new level / reset)
    updtUI();
  }

  // when slot full - move on or validate and advance
  function advanceOrValidateLevel(): void {
    if (activeSlotIndex < SLOTS_PER_STAGE - 1) {
      activeSlotIndex++;
      return;
    }
    // last input filled - validate level
    validateLevel();
  }

  // Level validation
  function validateLevel(): void {
    const expectedLevel = LEVELS[currentLevelIndex].map(String);
    //compare slots value to expected value
    const levelOk = slotValues.every((value, i) => value === expectedLevel[i]);

    if (!levelOk) {
      // failing level & count/add mistakes +1
      mistakes++;
      // play level untill finnished
      resetLevelInput();
      // resets level
      updtUI();
      return;
    }
    // if level completed - move on to next and clear inputs
    if (currentLevelIndex < LEVELS.length - 1) {
      // small pause for player UI
      delayTransit(700, () => {
        //After pause - move on to next level
        currentLevelIndex++;
        // clear slots
        resetLevelInput();
        // re-render UI for next level
        updtUI();
      });
      return;
    }

    // all levels completed
    ifRoomCompleted();
  }

  // Backspace button
  function backspace(): void {
    // If we are currently delaying a transition, ignore backspace too
    if (isTransitioning) return;
    // Case 1 : if the input/ slot have content - remove last digit.
    if (slotValues[activeSlotIndex].length > 0) {
      slotValues[activeSlotIndex] = slotValues[activeSlotIndex].slice(0, -1);
      updtUI();
      return;
    }
    // case 2: if empty slot
    if (activeSlotIndex > 0) {
      activeSlotIndex--;
    }

    if (slotValues[activeSlotIndex].length > 0) {
      slotValues[activeSlotIndex] = slotValues[activeSlotIndex].slice(0, -1);
    }
    updtUI();
  }

  //-----------------------------------------------------------
  //-------------------------FAIL / COMPLETE-------------------
  //-----------------------------------------------------------

  function ifRoomCompleted(): void {
    // Block input while we show the final state + delay
    isTransitioning = true;

    //Render the very last digit + final UI state
    updtUI();

    if (mistakes === 0) {
      balanceFill.style.width = "100%";
    }

    // Delay so the player can SEE the final digit
    window.setTimeout(() => {
      // Wait 2 animation frames to guarantee the UI is painted before alert
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          stopTimeUpWatcher();
          stopTimer(1);
          // Save room result (used by progressbar + backpack later)
          setRoomResult("wood", { status: "completed", artifact: "true" });
          // show msg to player
          showMsg("Well done — next chamber awaits", 1300);
          window.setTimeout(() => {
            // 4) Reset wood state
            currentLevelIndex = 0;
            mistakes = 0;
            resetLevelInput();

            // Allow input again wood is about to be hidden anyway
            isTransitioning = false;
            updtUI();

            window.setTimeout(() => {
              room2fireFunc();
            }, 1250);
          }, 1300);
        });
      });
    }, 1300);
  }

  // Called when the room timer hits 0 - fail case
  function ifRoomFailed(): void {
    stopTimeUpWatcher();
    stopTimer(1);
    // Block input so player can't keep interacting
    isTransitioning = true;

    // Update UI one last time
    updtUI();

    // Save room result - used by progressbar + backpack later
    setRoomResult("wood", { status: "failed", artifact: "false" });

    // Show fail message
    showMsg("Time's up — next chamber awaits", 1300);

    // Reset AFTER message is shown
    window.setTimeout(() => {
      currentLevelIndex = 0;
      mistakes = 0;
      resetLevelInput();

      isTransitioning = false;
      updtUI();

      window.setTimeout(() => {
        room2fireFunc();
      }, 1250);
    }, 1300);
  }

  //-----------------------------------------------------------
  //-------------------------KEY EVENTS------------------------
  //-----------------------------------------------------------

  function handleKeypadClick(e: MouseEvent): void {
    // any click inside keypad container
    const target = e.target as HTMLElement | null;
    if (!target) return;
    // closest to find a button with .key
    const btn = target.closest<HTMLButtonElement>("button.key");
    if (!btn) return;
    // move focus to the targeted btn
    btn.focus();
    // find the number assigned by data-key= i HTML
    const digit = btn.dataset.key;
    // find the assumed data-action assigned to btn data-action= i HTML
    const action = btn.dataset.action;
    // if the btn has a digit - include it to the game-logic
    if (digit) pushDigit(digit);
    // if the btn is the backspace button - run game backspace logic
    if (action === "back") backspace();
  }

  function handleKeyDownEvent(e: KeyboardEvent): void {
    // keypad btns i HTML gets action when focused on
    const active = document.activeElement as HTMLButtonElement | null;
    if (!active || !active.classList.contains("key")) return;
    // what button is active atm
    const currentKeyIndex = keyBtns.indexOf(active);
    if (currentKeyIndex === -1) return;

    // enterkey to submit digit on keypad as a click
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      active.click();
      return;
    }
    // Only arrows keys moves focus
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

    e.preventDefault();
    // Calc for next focus position clamp-style
    const nextKeyIndex =
      e.key === "ArrowRight"
        ? // Right arrow key goes one step forward (+1) But never past last index
          Math.min(currentKeyIndex + 1, keyBtns.length - 1)
        : // Left arrow key goes one step back (-1) but not futher than 0 index
          Math.max(currentKeyIndex - 1, 0);
    // if focus in on last and press arrow right - do nothing and vice versa
    if (nextKeyIndex === currentKeyIndex) return;
    // only one key is tabbable
    keyBtns[currentKeyIndex].tabIndex = -1;
    keyBtns[nextKeyIndex].tabIndex = 0;
    keyBtns[nextKeyIndex].focus();
  }

  keypad.addEventListener("click", handleKeypadClick);
  keypad.addEventListener("keydown", handleKeyDownEvent);

  function initKeypadFocus(): void {
    // give one button at a time tabIndex 0. all others -0(not able to be tabbed to)
    // "roving tabIndex"
    keyBtns.forEach((btn, i) => {
      btn.tabIndex = i === 0 ? 0 : -1;
    });
  }

  initKeypadFocus();
  updtUI();
}
