import * as dataJSON from "../../data.json";
import {
  getCurrentPage,
  showSection,
  transitSections,
} from "../../script/helper/transitions.ts";

const TRANSITION_MS = 1200;

export function gameWinFunc() {
  const gameWinSection = document.querySelector<HTMLElement>("#gameWinRoom");
  if (!gameWinSection) return;
  console.log("gameWinFunc CALLED");

  // Set background
  gameWinSection.style.backgroundImage = `url("${dataJSON.gameWinRoom.backgroundImg}")`;

  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  //Trigger animation AFTER transition finishes
  if (fromPage && fromPage !== gameWinSection) {
    transitSections(fromPage, gameWinSection, TRANSITION_MS);
    window.setTimeout(() => {
      gameWinSection.classList.remove("is-animating");
      void gameWinSection.offsetWidth; // force reflow so animation restarts
      gameWinSection.classList.add("is-animating");
    }, TRANSITION_MS);
  } else {
    showSection(gameWinSection);
  }
  // Trigger animation immediately (when no transition)
  gameWinSection.classList.remove("is-animating");
  void gameWinSection.offsetWidth;
  gameWinSection.classList.add("is-animating");

  console.log("Hello from the gameWin room");
}
