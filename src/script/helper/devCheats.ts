/* -------------------------------------------------------------------------------------------------------------------------------------------------- */
/* ------------------------------------------------------------ DEV CHEATS -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------------------------------------------------------------------------------- */

/**
 * PURPOSE:
 * - For Pogo-stick team only, made for demo / testing in particular
 * - Let the Pogo-stickers mark rooms as completed instantly without solving puzzles.
 *
 * - Modes:
 * - 1, state only. (no transitions only update LS)
 * - 2, Full flow. (Init complete current + fade to nect room and start logic in that room)
 *
 *
 * - A secret key to enable the functions. -> then we can force changes in localStorage
 * - There will be an input to reset the state
 *
 * -------------------------------------------------------------------------------------------------
 *
 * - HOW TO ENABLE (POGO-STICK TEAM)
 * 1) In the game, type the sequence: pogo
 * 2) In the panel. write the code phrase: temple5
 * 3) Dev panel appears on the bottom right
 * -------------------------------------------------------------------------------------------------
 *
 * The panel will be invisible unless unlocked.
 * It never calls transitSections() unless you click the transition button. (made this because of testing)
 * -------------------------------------------------------------------------------------------------
 *
 * Dev panel buttons:
 * 1) completeCurrent(true)
 * 2) completeCurrent(false)
 * 3) completeAll(true)
 * 4) completeAll(false)
 * 5) resetCurrent()
 * 6) resetAll()
 * 7) completeSelected(room, true/false)
 * 8) completeCurrent + transition + startNextRoom()
 * --------------------------------------------------------------------------------------------------
 */

import { getCurrentPage, transitSections } from "./transitions.ts";
import {
  getRoomResults,
  setRoomResult,
  resetSingleRoomResult,
  resetRoomResults,
} from "./storage.ts";
import type { TArtifactKind, TRoomId, TRoomResult } from "./storage.ts";

import { room1woodFunc } from "../../rooms/1wood/room1wood.ts";
import { room2fireFunc } from "../../rooms/2fire/room2fire.ts";
import { room3earthFunc } from "../../rooms/3earth/room3earth.ts";
import { room4metalFunc } from "../../rooms/4metal/room4metal.ts";
import { room5waterFunc } from "../../rooms/5water/room5water.ts";
import { room6finalFunc } from "../../rooms/final/room6validate.ts";

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------------------------------- CONFIGS ----------------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

// Secret key sequence typed anywhere
const SECRET_SEQUENCE = "pogo";

// Code phrase required to unlock dev settings
const CODE_PHRASE = "temple5";

// Transition duration
const TRANSITION_MS = 1200;

// From storage (rooms)
const ALL_ROOMS: TRoomId[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
  "final",
];

/**
 * Map storage roomId -> function that starts that room.
 * Used for the "full flow" button (transition + start next room logic).
 */
const ROOM_STARTERS: Record<TRoomId, () => void> = {
  wood: room1woodFunc,
  fire: room2fireFunc,
  earth: room3earthFunc,
  metal: room4metalFunc,
  water: room5waterFunc,
  final: room6finalFunc,
};

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------------------- INIT ------------------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

/**
 * Main.ts:
 *   initDevCheats();
 *
 * This attaches a global key listener.
 * The panel itself is created only after successful unlock.
 */
export function initDevCheats(): void {
  attachSecretListener();
}

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------- OUR SECRET LISTENER (^.^) ---------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

function attachSecretListener(): void {
  // Variable to track what the user is writing.
  let buffer = "";
  // Keep track of how fast user is typing
  let lastKeyAt = 0;

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    // Ignore if user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    const isTypingField =
      tag === "input" ||
      tag === "textarea" ||
      target?.isContentEditable === true;
    if (isTypingField) return;

    // Only accept single-character keys
    const key = e.key.toLowerCase();
    if (key.length !== 1) return;

    // Reset buffer if user pauses too long
    const now = Date.now();
    if (now - lastKeyAt > 900) buffer = ""; // If user is taking more than 900ms between each "keydown" - buffer is cleared
    lastKeyAt = now;

    // Add to buffer
    buffer += key;
    if (buffer.length > 16) buffer = buffer.slice(-16); // make maximum 16 letters so it doesnt grow forever

    // Unlock flow if buffer ends with our secret sequence
    if (buffer.endsWith(SECRET_SEQUENCE)) {
      buffer = "";
      unlockFlow();
    }
  });
}

/**
 * unlockFlow()
 * - prompt asking for password
 * - correct code = open DevPanel()
 * - wrong code = dont do anything
 */
function unlockFlow(): void {
  const code = window.prompt("CHEATING TIME 🙈 \nEnter code phrase:", "");
  if (!code) return;

  if (code.trim().toLowerCase() !== CODE_PHRASE) {
    console.log("[DEV CHEATS] Wrong code phrase 🔒️");
    return;
  }

  openDevPanel();
}

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------- POGO STICK CHEATING PANEL ---------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

let panelRoot: HTMLDivElement | null = null;

/**
 * openDevPanel()
 *
 * Creates a small fixed developer panel in the corner of the screen.
 *
 * This panel allows developers to:
 * - Complete rooms instantly
 * - Reset rooms
 * - Trigger full flow transitions
 *
 * The panel is created only once.
 * If it already exists, we simply show it again.
 */
function openDevPanel(): void {
  //-----------------------------------------------------------
  // If panel already exists -> show it again
  //-----------------------------------------------------------

  if (panelRoot) {
    panelRoot.style.display = "block";
    return;
  }

  //-----------------------------------------------------------
  // Create root container
  //-----------------------------------------------------------

  const root = document.createElement("div");
  panelRoot = root;

  root.style.position = "fixed";
  root.style.right = "16px";
  root.style.bottom = "16px";
  root.style.width = "340px";
  root.style.maxWidth = "92vw";
  root.style.zIndex = "99999";
  root.style.background = "rgba(10,10,12,0.92)";
  root.style.border = "1px solid rgba(255,255,255,0.14)";
  root.style.borderRadius = "14px";
  root.style.padding = "12px";
  root.style.fontFamily = "system-ui, Arial";
  root.style.color = "white";
  root.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";

  //-----------------------------------------------------------
  // Header (title + close button)
  //-----------------------------------------------------------

  const header = document.createElement("div");

  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.justifyContent = "space-between";

  const title = document.createElement("div");
  title.textContent = "POGO-STICK CHEAT CORNER 🪄";
  title.style.fontWeight = "700";

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.background = "transparent";
  closeBtn.style.color = "white";
  closeBtn.style.border = "1px solid rgba(255,255,255,0.18)";
  closeBtn.style.borderRadius = "10px";
  closeBtn.style.padding = "6px 10px";

  closeBtn.addEventListener("click", () => {
    if (!panelRoot) return;
    panelRoot.style.display = "none";
  });

  header.append(title, closeBtn);

  //-----------------------------------------------------------
  // Description text
  //-----------------------------------------------------------

  const hint = document.createElement("div");
  hint.textContent =
    "State cheats and FULL FLOW (transition + start next room).";

  hint.style.fontSize = "12px";
  hint.style.opacity = "0.8";
  hint.style.marginTop = "6px";
  hint.style.marginBottom = "10px";

  //-----------------------------------------------------------
  // ROOM SELECTOR (custom dropdown)
  //-----------------------------------------------------------

  /**
   * Native <select> caused a white OS dropdown.
   * Instead we create a small custom dropdown.
   */

  const selectRow = document.createElement("div");
  selectRow.style.display = "flex";
  selectRow.style.gap = "8px";
  selectRow.style.alignItems = "center";
  selectRow.style.marginBottom = "10px";

  const label = document.createElement("span");
  label.textContent = "Room:";
  label.style.fontSize = "12px";
  label.style.opacity = "0.85";

  // currently selected room
  let selectedRoom: TRoomId = getCurrentRoomId() ?? "wood";

  const dropdownWrap = document.createElement("div");
  dropdownWrap.style.position = "relative";
  dropdownWrap.style.flex = "1";

  const dropdownBtn = document.createElement("button");
  dropdownBtn.textContent = selectedRoom;
  dropdownBtn.style.width = "100%";
  dropdownBtn.style.padding = "10px";
  dropdownBtn.style.borderRadius = "12px";
  dropdownBtn.style.border = "1px solid rgba(255,255,255,0.18)";
  dropdownBtn.style.background = "rgba(255,255,255,0.06)";
  dropdownBtn.style.color = "white";
  dropdownBtn.style.cursor = "pointer";
  dropdownBtn.style.textAlign = "left";

  const dropdownMenu = document.createElement("div");
  dropdownMenu.style.position = "absolute";
  dropdownMenu.style.left = "0";
  dropdownMenu.style.right = "0";
  dropdownMenu.style.top = "calc(100% + 6px)";
  dropdownMenu.style.background = "rgba(10,10,12,0.96)";
  dropdownMenu.style.border = "1px solid rgba(255,255,255,0.14)";
  dropdownMenu.style.borderRadius = "12px";
  dropdownMenu.style.padding = "6px";
  dropdownMenu.style.display = "none";
  dropdownMenu.style.zIndex = "100000";

  //-----------------------------------------------------------
  // Create one dropdown item per room
  //-----------------------------------------------------------

  for (const id of ALL_ROOMS) {
    const item = document.createElement("button");

    item.textContent = id;
    item.style.width = "100%";
    item.style.padding = "10px";
    item.style.borderRadius = "10px";
    item.style.border = "1px solid rgba(255,255,255,0.10)";
    item.style.background = "rgba(255,255,255,0.04)";
    item.style.color = "white";
    item.style.cursor = "pointer";
    item.style.textAlign = "left";

    item.addEventListener("click", () => {
      selectedRoom = id;
      dropdownBtn.textContent = id;

      dropdownMenu.style.display = "none";
    });

    dropdownMenu.appendChild(item);
  }

  //-----------------------------------------------------------
  // Toggle dropdown open/close
  //-----------------------------------------------------------

  dropdownBtn.addEventListener("click", () => {
    dropdownMenu.style.display =
      dropdownMenu.style.display === "none" ? "block" : "none";
  });

  //-----------------------------------------------------------
  // Close dropdown if clicking outside
  //-----------------------------------------------------------

  window.addEventListener("click", (e) => {
    const target = e.target as Node;

    if (!dropdownWrap.contains(target)) {
      dropdownMenu.style.display = "none";
    }
  });

  dropdownWrap.append(dropdownBtn, dropdownMenu);
  selectRow.append(label, dropdownWrap);

  //-----------------------------------------------------------
  // Button helper
  //-----------------------------------------------------------

  function makeBtn(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement("button");

    btn.textContent = text;
    btn.style.cursor = "pointer";
    btn.style.padding = "10px";
    btn.style.borderRadius = "12px";
    btn.style.border = "1px solid rgba(255,255,255,0.18)";
    btn.style.background = "rgba(255,255,255,0.06)";
    btn.style.color = "white";
    btn.style.fontSize = "12px";
    btn.style.textAlign = "left";

    btn.addEventListener("click", onClick);

    return btn;
  }

  //-----------------------------------------------------------
  // Grid with main actions
  //-----------------------------------------------------------

  const grid = document.createElement("div");

  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "1fr 1fr";
  grid.style.gap = "8px";

  grid.append(
    makeBtn("1) Complete CURRENT (artifact TRUE)", () =>
      completeCurrentRoom("true"),
    ),

    makeBtn("2) Complete CURRENT (artifact FALSE)", () =>
      completeCurrentRoom("false"),
    ),

    makeBtn("3) Complete ALL (artifact TRUE)", () => completeAllRooms("true")),

    makeBtn("4) Complete ALL (artifact FALSE)", () =>
      completeAllRooms("false"),
    ),

    makeBtn("5) Reset CURRENT", () => resetCurrentRoom()),

    makeBtn("6) Reset ALL", () => resetAllRooms()),
  );

  //-----------------------------------------------------------
  // Extra actions
  //-----------------------------------------------------------

  const extra = document.createElement("div");

  extra.style.display = "grid";
  extra.style.gap = "8px";
  extra.style.marginTop = "10px";

  extra.append(
    makeBtn("7) Complete SELECTED (TRUE)", () =>
      completeSpecificRoom(selectedRoom, "true"),
    ),

    makeBtn("7) Complete SELECTED (FALSE)", () =>
      completeSpecificRoom(selectedRoom, "false"),
    ),

    makeBtn("▶ Complete CURRENT + Go NEXT (FULL FLOW)", () =>
      completeCurrentAndGoNextFullFlow("true"),
    ),
  );

  //-----------------------------------------------------------
  // Assemble panel
  //-----------------------------------------------------------

  root.append(header, hint, selectRow, grid, extra);

  document.body.appendChild(root);

  console.log("[DEV CHEATS] Panel opened");
}

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------------------------- STATE / ACTIONS --------------------------------------------------------------- */
/* ------------------------------------------- WITHOUT ROOM LOGIC -------------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

function completeCurrentRoom(artifact: Exclude<TArtifactKind, null>): void {
  const roomId = getCurrentRoomId();
  if (!roomId) {
    console.log("[DEV CHEATS] No active room detected.");
    return;
  }
  completeSpecificRoom(roomId, artifact);
}

/**
 * Completes a specific room by updating storage state only.
 * Preserves mistakes/score/time so we can test highscores
 */
function completeSpecificRoom(
  roomId: TRoomId,
  artifact: Exclude<TArtifactKind, null>,
): void {
  const state = getRoomResults();
  const prev = state[roomId];

  const next: TRoomResult = {
    ...prev,
    status: "completed",
    artifact,
    mistakes: prev.mistakes ?? 0,
    score: prev.score ?? 0,
    roomTimeSec: prev.roomTimeSec ?? 0,
  };

  setRoomResult(roomId, next);
  console.log(`[DEV CHEATS] Completed: ${roomId} | artifact=${artifact}`);
}

function completeAllRooms(artifact: Exclude<TArtifactKind, null>): void {
  const state = getRoomResults();

  for (const roomId of ALL_ROOMS) {
    const prev = state[roomId];

    const next: TRoomResult = {
      ...prev,
      status: "completed",
      artifact,
      mistakes: prev.mistakes ?? 0,
      score: prev.score ?? 0,
      roomTimeSec: prev.roomTimeSec ?? 0,
    };

    setRoomResult(roomId, next);
  }

  console.log(`[DEV CHEATS] Completed ALL rooms | artifact=${artifact}`);
}

function resetCurrentRoom(): void {
  const roomId = getCurrentRoomId();
  if (!roomId) {
    console.log("[DEV CHEATS] No active room detected.");
    return;
  }

  resetSingleRoomResult(roomId);
  console.log(`[DEV CHEATS] Reset CURRENT: ${roomId}`);
}

function resetAllRooms(): void {
  resetRoomResults();
  console.log("[DEV CHEATS] Reset ALL rooms");
}

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* ---------------------------------------- FULL FLOW WITH TRANSITIONS --------------------------------------------------------- */
/* ------------------------------------- FOR TESTING INIT AND TRANSITIONS ------------------------------------------------------ */
/* ----------------------------------------------------------------------------------------------------------------------------- */

/**
 * showMsg("Time's up — next chamber awaits", 1200 * 2);
 * Missing from the transitions?
 *
 * completeCurrentAndGoNextFullFlow();
 * - Forces us to true or false, null excluded
 * - Get the actual room
 */
function completeCurrentAndGoNextFullFlow(
  artifact: Exclude<TArtifactKind, null>,
): void {
  const currentRoomId = getCurrentRoomId();
  const currentSection = getCurrentPage();

  if (!currentRoomId || !currentSection) {
    console.log("[DEV CHEATS] Cannot FULL FLOW: no current room/section.");
    return;
  }

  // Complete current room state (storage)
  completeSpecificRoom(currentRoomId, artifact);

  // Find next room id
  const nextRoomId = getNextRoomId(currentRoomId);
  if (!nextRoomId) {
    console.log("[DEV CHEATS] No next room (already final).");
    return;
  }

  // Find next section in DOM
  const nextSelector = mapRoomIdToSelector(nextRoomId);
  const nextSection = document.querySelector<HTMLElement>(nextSelector);

  if (!nextSection) {
    console.log(`[DEV CHEATS] Next section not found: ${nextSelector}`);
    return;
  }

  // Transition UI
  transitSections(currentSection, nextSection, TRANSITION_MS);

  // Start next room logic AFTER transition ends
  window.setTimeout(() => {
    const startNext = ROOM_STARTERS[nextRoomId];
    startNext();
    console.log(`[DEV CHEATS] Started next room: ${nextRoomId}`);
  }, TRANSITION_MS);

  console.log(`[DEV CHEATS] FULL FLOW: ${currentRoomId} -> ${nextRoomId}`);
}

/* ----------------------------------------------------------------------------------------------------------------------------- */
/* --------------------------------------------------- HELPERS ----------------------------------------------------------------- */
/* ----------------------------------------------------------------------------------------------------------------------------- */

/**
 * getCurrentRoomId()
 * Get the current page
 * If current exist, get id
 * return DOM-id to section id (for example room2fire -> fire)
 */
function getCurrentRoomId(): TRoomId | null {
  const current = getCurrentPage();
  const sectionId = current?.id;
  if (!sectionId) return null;
  return mapSectionIdToRoomId(sectionId);
}

/**
 * mapSectionIdToRoomId
 * - Converts DOM section id to storage room id:
 * - DOM uses full section names (room1wood ex)
 * - storage.ts uses short keys (wood,fire,etc)
 */
function mapSectionIdToRoomId(sectionId: string): TRoomId | null {
  switch (sectionId) {
    case "room1Wood":
      return "wood";

    case "room2Fire":
      return "fire";

    case "room3Earth":
      return "earth";

    case "room4Metal":
      return "metal";

    case "room5Water":
      return "water";

    case "room6validate":
      return "final";

    default:
      return null;
  }
}

function mapRoomIdToSelector(roomId: TRoomId): string {
  switch (roomId) {
    case "wood":
      return "#room1Wood";
    case "fire":
      return "#room2Fire";
    case "earth":
      return "#room3Earth";
    case "metal":
      return "#room4Metal";
    case "water":
      return "#room5Water";
    case "final":
      return "#room6validate";
    default:
      throw new Error("Unknown roomId");
  }
}

/**
 * Returns the next room based on the fixed order.
 * wood -> fire -> earth -> metal -> water -> final -> null
 */
function getNextRoomId(current: TRoomId): TRoomId | null {
  const idx = ALL_ROOMS.indexOf(current);
  if (idx === -1) return null;
  return ALL_ROOMS[idx + 1] ?? null;
}
