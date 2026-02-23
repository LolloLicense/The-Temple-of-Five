import * as dataJSON from "../data.json";
import { playBgm } from "../audio";

export function room1woodFunc() {
  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Play the background music for woodroom */
  const bgmId = dataJSON.room1wood.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the wood room, with a fade-in duration of 650ms
  }

  /* Sets the background for the room and shows room section */
  const woodSection: HTMLElement | null = document.querySelector("#room1Wood");
  if (!woodSection) {
    return;
  }
  woodSection.style.backgroundImage = `url("${dataJSON.room1wood.backgroundImg}")`;
  woodSection.classList.remove("hidden");

  if (woodSection.dataset.woodInit === "true") return;
  woodSection.dataset.woodInit = "true";

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

    // ------------------------------
    // DOM-refs
    // ------------------------------
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
      !keypad || slots.length !== SLOTS_PER_STAGE ||
      !levelTextEl ||
      !mistakesTextEl ||
      !roomBalanceEl
    ) {
      throw new Error("Wood room DOM mismatch")
  }

  // Make “safe” non-null variables AFTER guard
  // Now TypeScript knows these are always real elements (never null).
  const levelText = levelTextEl;
  const mistakesText = mistakesTextEl;
  const balanceFill = roomBalanceEl;


  // Array with all my buttons class=key 0-9 & backspace
  const keyBtns = Array.from(
    keypad.querySelectorAll<HTMLButtonElement>("button.key")
  );

  // ------------------------------
  // STATE
  // ------------------------------

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

  // ------------------------------
  // RENDER UI
  // ------------------------------

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
    const progressBase = MIN_START + (currentLevelIndex / LEVELS.length) * (100 - MIN_START); 
    // penalty for number of mistakes 
    const penalty = mistakes * MISTAKE_PENALTY;
    // smooth wobble for the nerves ( Math.sin = value between -1 & 1)
    const balanceWobble = Math.sin((currentLevelIndex + 1) * 2 + mistakes * 1.5) * WOBBLEBALANCE;
    // calc for % in balancebar (Math.max = never returns value < 0 (Math.min always returns < 100))
    const balancePercent = Math.max(0, Math.min(100, progressBase - penalty + balanceWobble)
  );
  balanceFill.style.width = `${balancePercent}%`
  }

  function updtUI(): void {
    renderSlots();
    renderHUD();
  }

  // ------------------------------
  // RESET HELPERS
  // ------------------------------

  // Delay helper - pause transition so player can se digits before next level
  function delayTransit(ms: number, after: () => void): void {
    // block input so player dont spam buttons while transit
    isTransitioning = true;
    // wait ms , then run after
    setTimeout(() =>{
      after(); // run transit
      isTransitioning = false; // un-block input
    }, ms);
  }

  // reset inputs for current level
  function resetLevelInput (): void {
    slotValues = Array(SLOTS_PER_STAGE).fill("")
    activeSlotIndex = 0;
  }

  // reset room


  // ------------------------------
  // LOGICS
  // ------------------------------

  //

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
    // if slot is full - move to next slot 
    if (slotValues[activeSlotIndex].length === expectedStr.length) {
      advanceOrValidateLevel();
    }  
    //Upd UI to show all state changes
    updtUI();
  }

  // when slot full - move on or validate and advance
  function advanceOrValidateLevel(): void {
    if (activeSlotIndex < SLOTS_PER_STAGE -1) {
      activeSlotIndex++
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
    if (currentLevelIndex < LEVELS.length -1) {
      // small pause for player UI
      delayTransit(700, () =>{
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
    // if the input/ slot have content - remove last digit.
    if (slotValues[activeSlotIndex].length > 0) {
      slotValues[activeSlotIndex] = slotValues[activeSlotIndex].slice(0, -1);
      updtUI();
      return;
    }
    // if empty slot - backspace once more
    if (activeSlotIndex > 0) {
      activeSlotIndex--;
      updtUI();
    }
  }

  // WORK IN PROGRESS

  function ifRoomCompleted(): void {
    // reportRoomResult({ roomId: "wood", success: true, artifactId: "wood_true" })
  // goToNextRoom();
  balanceFill.style.width = "100%";
  //ONLY TEST
  alert("WOOD chamber complete!");
  currentLevelIndex = 0;
  mistakes = 0;
  resetLevelInput();
  updtUI(); 
  }

// function ifRoomFailed(): void {
//   // SEND TO NEXT ROOM WITH WRONG ELEMENT
//   clearAll();
//     // reportRoomResult({ roomId: "wood", success: false, artifactId: "wood_fake" })
//   // goToNextRoom();
// }

  // ------------------------------
  // Key clicks
  // ------------------------------

// listen to keydown (not document)
// 1: Arrowkeys controls focus when player tabed down to keypad
// 2: no risk of use for arrowkeys outside keypad
keypad.addEventListener("keydown", (e) => {
  const active = document.activeElement as HTMLButtonElement | null;
  if (!active || ! active.classList.contains("key")) return;

    const currentKeyIndex = keyBtns.indexOf(active);
    if (currentKeyIndex === -1) return;

    let nextKeyIndex = currentKeyIndex;

  // Right arrow key goes one step forward (+1) But never past last index
  if(e.key === "ArrowRight") nextKeyIndex = Math.min(currentKeyIndex +1, keyBtns.length -1);
  // Left arrow key goes one step back (-1) but not futher than 0 index
  if(e.key === "ArrowLeft") nextKeyIndex = Math.max(currentKeyIndex -1, 0);

  // enter to submit digit on keypad
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    active.click();
    return; 
  }
  if (nextKeyIndex !== currentKeyIndex) {
    e.preventDefault();
    keyBtns[currentKeyIndex].tabIndex = -1;
    keyBtns[nextKeyIndex].tabIndex = 0;
    keyBtns[nextKeyIndex].focus();
  }
})

  keypad.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLButtonElement>("button.key");
    if (!btn) return;

    const digit = btn.dataset.key;
    const action = btn.dataset.action;

    if (digit) pushDigit(digit);
    if (action === "back") backspace();
  });

function initKeypadFocus(): void {
  // give one button at a time tabIndex 0. all others -0(not able to be tabbed to)
  // "roving tabIndex"
  keyBtns.forEach((btn, i) => (btn.tabIndex = i === 0 ? 0 : -1));
} 

  initKeypadFocus();
  updtUI();
}
