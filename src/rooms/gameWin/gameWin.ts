import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio";
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

  if (fromPage && fromPage !== gameWinSection) {
    transitSections(fromPage, gameWinSection, TRANSITION_MS);
  } else {
    showSection(gameWinSection);
  }

  const bgmId = dataJSON.gameWinRoom.bgmId;
  if (bgmId) void playBgm(bgmId, 650);

  console.log("Hello from the gameOver room");
}
