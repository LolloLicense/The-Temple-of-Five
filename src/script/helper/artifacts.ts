import * as dataJSON from "../../data.json";
import { getRoomResults, type TArtifactKind, type TRoomId } from "./storage";

//-----------------------------------------------------------
//----------------------- CONFIG ----------------------------
//-----------------------------------------------------------

/**
 * rooms/room-artifact that fills the slots in backpack dropdown -
 * in same order always?
 * slotindex 0 - 4*/
const ROOMS: Exclude<TRoomId, "final">[] = [
  "wood",
  "fire",
  "earth",
  "metal",
  "water",
];

/**
 * Mapping json-rooms and connects with TRoomID from storage
 *
 */
const ROOM_JSON = {
  wood: dataJSON.room1wood,
  fire: dataJSON.room2fire,
  earth: dataJSON.room3earth,
  metal: dataJSON.room4metal,
  water: dataJSON.room5water,
} as const;

let backpackBound = false;
//-----------------------------------------------------------
//-------------------- ICONS CHECK --------------------------
//-----------------------------------------------------------

/**
 * Declare what icon should be picked up in backpack
 *  We export this so other validate.ts later can reuse it
 * without duplicating JSON mapping logic.
 */

export function getArtifactIcon(
  // all room but NOT final room
  roomId: Exclude<TRoomId, "final">,
  kind: TArtifactKind,
): string | null {
  // get the icon from json for specific room
  const artifactData = ROOM_JSON[roomId].artifact;
  // we return null so no crash
  if (!artifactData) return null;
  // returns correct artifact kind
  if (kind === "true") return artifactData.icons.true;
  if (kind === "false") return artifactData.icons.false;

  // not earned artifact / null
  return null;
}

/**
 * Count how many artifacts the player has collected.
 * Both "true" and "false" count as collected artifacts.
 */
export function getCollectedArtifactsCount(): number {
  const state = getRoomResults();

  return ROOMS.filter((roomId) => state[roomId].artifact !== null).length;
}

/**
 * Returns true if all artifact results are "true".
 * For the VALIDATE room before sending player to the WIN ending.
 */
export function areAllArtifactsTrue(): boolean {
  const state = getRoomResults();

  return ROOMS.every((roomId) => state[roomId].artifact === "true");
}

/**
 * Returns all rooms where the player got a false artifact.
 *  for game over / retry logic.
 */
export function getRoomsWithFalseArtifacts(): Exclude<TRoomId, "final">[] {
  const state = getRoomResults();

  return ROOMS.filter((roomId) => state[roomId].artifact === "false");
}

/**
 * Returns all rooms that are not completed yet.
 * Useful if validate room needs to know what rooms must be replayed.
 */
export function getIncompleteRooms(): Exclude<TRoomId, "final">[] {
  const state = getRoomResults();

  return ROOMS.filter((roomId) => state[roomId].status !== "completed");
}

//-----------------------------------------------------------
//-------------------------Backpack SLOTS--------------------
//-----------------------------------------------------------

export function renderArtifactsToSlots(): void {
  const itemDropdown = document.querySelector<HTMLElement>("#itemDropdown");
  if (!itemDropdown || !itemDropdown.classList.contains("is-open")) return;
  // Fills the  HTML-slots inside the dropdown
  const slots = Array.from(
    itemDropdown.querySelectorAll<HTMLElement>(".artifact-slot"),
  );
  // Read player state from localStorage
  const state = getRoomResults();
  //// Loop through ROOMS in fixed order and map each room to a slot index
  ROOMS.forEach((roomId, index) => {
    const slot = slots[index];
    if (!slot) return;

    // Player artifact outcome for this room :true / false / null
    const kind = state[roomId].artifact;
    // Convert outcome -> actual SVG path from JSON
    const icon = getArtifactIcon(roomId, kind);

    // if icon is earned show if not clear old
    slot.style.backgroundImage = icon ? `url("${icon}")` : "";
    slot.style.backgroundSize = "contain";
    slot.style.backgroundRepeat = "no-repeat";
    slot.style.backgroundPosition = "center";

    // adding class for scss
    slot.classList.toggle("empty", kind === null);
    slot.classList.toggle("is-true", kind === "true");
    slot.classList.toggle("is-false", kind === "false");
    //Store debug info directly on the element
    slot.dataset.room = roomId;
    slot.dataset.artifact = kind ?? "empty";

    // USE FOR DEBUG
    console.log(`${roomId}:`, kind, icon ?? "(empty)");
  });
}

//-----------------------------------------------------------
//---------------------- Arficats counterbadge --------------
//-----------------------------------------------------------

export function updateArtifactBadge(): void {
  // <span> inside the backpack button
  const badge = document.querySelector<HTMLElement>("#artifactBadge");
  if (!badge) return;

  // Get current number of collected artifacts
  const count = getCollectedArtifactsCount();

  // Show badge only when player has collected at least one artifact
  if (count > 0) {
    badge.textContent = String(count);
    badge.classList.add("is-visible");
  } else {
    badge.textContent = "";
    badge.classList.remove("is-visible");
  }
}

//-----------------------------------------------------------
//---------------------- Backpack toggle --------------------
//-----------------------------------------------------------

export function initBackpackToggle(): void {
  console.log("initBackpackToggle bound");
  if (backpackBound) return;
  backpackBound = true;
  const itemListBtn = document.querySelector<HTMLElement>("#itemListBtn");
  const itemDropdown = document.querySelector<HTMLElement>("#itemDropdown");

  if (!itemListBtn || !itemDropdown) return;

  // Initial paint (page load / refresh)
  updateArtifactBadge();

  if (itemDropdown.classList.contains("is-open")) {
    renderArtifactsToSlots();
  }

  //  Update badge automatically when roomResults change
  window.addEventListener("roomResults:changed", () => {
    updateArtifactBadge();

    // Optional: if dropdown is open, also refresh icons live
    if (itemDropdown.classList.contains("is-open")) {
      renderArtifactsToSlots();
    }
  });

  // Toggle dropdown on click
  itemListBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    itemDropdown.classList.toggle("is-open");

    if (itemDropdown.classList.contains("is-open")) {
      renderArtifactsToSlots();
      updateArtifactBadge();
    }
  });

  // Click outside closes dropdown
  document.addEventListener("click", () => {
    itemDropdown.classList.remove("is-open");
  });

  // Click inside dropdown should not close it
  itemDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
