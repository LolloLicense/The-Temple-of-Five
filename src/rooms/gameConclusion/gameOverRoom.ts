import * as dataJSON from "../../data.json";
import {
  getCurrentPage,
  showSection,
  transitSections,
} from "../../script/helper/transitions.ts";

const TRANSITION_MS = 1200;

export function gameOverRoomFunc() {
  const gameOverSection = document.querySelector<HTMLElement>("#gameOverRoom");
  if (!gameOverSection) return;

  // Reset + restart animation each time we enter
  gameOverSection.classList.remove("is-animating");
  // Set background
  gameOverSection.style.backgroundImage = `url("${dataJSON.gameOverRoom.backgroundImg}")`;

  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  if (fromPage && fromPage !== gameOverSection) {
    transitSections(fromPage, gameOverSection, TRANSITION_MS);
  } else {
    showSection(gameOverSection);
  }

  // Trigger animation
  requestAnimationFrame(() => {
    gameOverSection.classList.add("is-animating");
  });

  console.log("Hello from the gameOver room");
}
