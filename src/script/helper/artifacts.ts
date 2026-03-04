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

//-----------------------------------------------------------
//-------------------------Backpack SLOTS--------------------
//-----------------------------------------------------------

export function renderArtifactsToSlots(): void {
  const itemDropdown = document.querySelector<HTMLElement>("#itemDropdown");
  if (!itemDropdown || !itemDropdown.classList.contains("is-open")) return;
  // Fills the  HTML-slots inside the dropdown
  const slots = Array.from(
    document.querySelectorAll<HTMLElement>("#itemDropdown .artifact-slot"),
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

    console.log(`${roomId}:`, kind, icon ?? "(empty)");
  });
}

//-----------------------------------------------------------
//---------------------- Arficats counterbadge --------------
//-----------------------------------------------------------

export function updtArtifactBadge(): void {
  // <span> in itemListBtn
  const badge = document.querySelector<HTMLElement>("#artifactBadge");
  if (!badge) return;
  // Read the latest saved run state from localStorage
  const state = getRoomResults();
  /**
   * Count how many artifacts have been collected
   * We count both "true" and "false" as "collected".
   */
  const count = ROOMS.filter(
    (roomId) => state[roomId].artifact !== null,
  ).length;

  // updt badge UI when 0 + 1
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
  updtArtifactBadge();

  //  Update badge automatically when roomResults change
  window.addEventListener("roomResults:changed", () => {
    updtArtifactBadge();

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
      updtArtifactBadge();
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
