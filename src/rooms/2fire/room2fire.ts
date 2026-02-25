import { playBgm } from "../../audio";
import * as dataJSON from "../../data.json";
import { renderRoomDesc } from "../../script/helper/roomDesc";

/**
 * FIRE ROOM (2)
 * 
 * Sequense puzzle and wordplay with 4 levels
 * The player choose elements trough a sequence of 4 keys, each key represents an element (Air, Timber, Flame, Ember, Stone, Water)
 * Fill the slots in the right order
 * When the last slot is filled - check if the sequence is correct.
 * Correct: Sucess glow (animation) + move on to the next level
 * Wrong: Shake + reset + mistakes counter
 */

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * String literal type for the fire room keys, which can be used to ensure type safety when referencing these keys in the code.
 * A = Air, T = Timber, F = Flame, E = Ember, S = Stone, W = Water
 */

type FireKey = "A" | "T" | "F" | "E" | "S" | "W";

// Typeguard, only accepts the correct keyboard keys
function isFireKey(k: string): k is FireKey {
  return k === "A" || k === "T" || k === "F" || k === "E" || k === "S" || k === "W";
}

// Config, level combo for keys

interface FireLevel {
  sequence: FireKey[]; // The correct sequence of keys for the level
  prefilled?: FireKey;  // If the level contain a pre-filled slot
}

const LEVELS: FireLevel[] = [
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

/**
 * Hides welcome page - sets the background for the fire room - shows the fire room section - plays the background music for the fire room
 */

export function room2fireFunc(): void {
  /* Hide the welcome page (menu)
      This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const fireSection: HTMLElement | null = document.querySelector("#room2Fire");
  if (!fireSection) return;
  fireSection.style.backgroundImage = `url("${dataJSON.room2fire.backgroundImg}")`;
  fireSection.classList.remove("hidden");
  renderRoomDesc(fireSection, dataJSON.room2fire.desc);

  /* Play the background music for the fire room */
  const bgmId = dataJSON.room2fire.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }

  console.log("Hello from the fire room");
  console.log("Calling playBgm with:", bgmId);
}

/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------- NEW SECTION ------------------------------------------------------------------------ */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
