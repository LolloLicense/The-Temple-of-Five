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

//-----------------------------------------------------------
//-------------------- ICONS CHECK --------------------------
//-----------------------------------------------------------

/**
 * Declare what icon should be picked up in backpack
 *  We export this so other validate.ts later can reuse it
 * without duplicating JSON mapping logic.
 */

export function getArtifactIcon(
  roomId: Exclude<TRoomId, "final">,
  kind: TArtifactKind,
): string | null {
  const artifactData = ROOM_JSON[roomId].artifact;

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
  // Fills the  HTML-slots inside the dropdown
  const slots = Array.from(
    document.querySelectorAll<HTMLElement>("#itemDropdown .artifact-slot"),
  );
  const state = getRoomResults();

  console.log("backpack state: artifact kind");

  ROOMS.forEach((roomId, index) => {
    const slot = slots[index];
    if (!slot) return;

    // ture / false / null-not earned
    const kind = state[roomId].artifact;
    const icon = getArtifactIcon(roomId, kind);

    // if icon is earned show if not  clear old
    slot.style.backgroundImage = icon ? `url("${icon}")` : "";
    slot.style.backgroundSize = "contain";
    slot.style.backgroundRepeat = "no-repeat";
    slot.style.backgroundPosition = "center";

    // adding class for scss
    slot.classList.toggle("empty", kind === null);
    slot.classList.toggle("is-true", kind === "true");
    slot.classList.toggle("is-false", kind === "false");

    slot.dataset.room = roomId;
    slot.dataset.artifact = kind ?? "empty";

    console.log(`${roomId}:`, kind, icon ?? "(empty)");
  });
}

//-----------------------------------------------------------
//-------------------------Backpack toggle-------------------
//-----------------------------------------------------------

export function initBackpackToggle(): void {
  // fetching the elements.html to toggle dropdown
  const itemListBtn = document.querySelector<HTMLElement>("#itemListBtn");
  const itemDropdown =
    document.querySelector<HTMLButtonElement>("#itemDropdown");

  // safety
  if (!itemListBtn || !itemDropdown) return;

  itemListBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    // refresh UI
    renderArtifactsToSlots();

    itemDropdown.classList.toggle("is-open");
  });

  // click outeside of dropdown to close
  document.addEventListener("click", () => {
    itemDropdown.classList.remove("is-open");
  });

  // click inside - do nothing
  itemDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });
}
