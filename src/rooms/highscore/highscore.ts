import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio";
import {
  getCurrentPage,
  showSection,
  transitSections,
} from "../../script/helper/transitions.ts";

const TRANSITION_MS = 1200;

export function highscoreRoomFunc(): void {
  const highscoreSection =
    document.querySelector<HTMLElement>("#highscoreRoom");

  if (!highscoreSection) return;

  // Set background from data.json
  highscoreSection.style.backgroundImage =
    `url("${dataJSON.highScoreRoom.backgroundImg}")`;

  const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  // Transition
  if (fromPage && fromPage !== highscoreSection) {
    transitSections(fromPage, highscoreSection, TRANSITION_MS);
  } else {
    showSection(highscoreSection);
  }

  // Eventually a BGM
  const bgmId = dataJSON.highScoreRoom.bgmId;
  if (bgmId) void playBgm(bgmId, 650);

  console.log("Hello from the highscore room");
}