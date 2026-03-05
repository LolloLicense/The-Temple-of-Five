import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio";
import {
  getCurrentPage,
  showSection,
  transitSections,
} from "../../script/helper/transitions.ts";
import { renderHighscoreList } from "./renderHighscoreList";
import { initHighscoreShare } from "./highscoreShare";

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

  renderHighscoreList();
  initHighscoreShare({
    shareUrl: "https://medieinstitutet.github.io/fed25d-js-intro-grupparbete-the-pogo-stick-pioneers/"
  });

  const backBtn = document.querySelector<HTMLButtonElement>("#backToMainMenuBtn");
  const welcomePage = document.querySelector<HTMLElement>("#welcomePage");

  if (backBtn && welcomePage) {
    // Prevent double-binding
    if (backBtn.dataset.bound !== "true") {
      backBtn.dataset.bound = "true";

      backBtn.addEventListener("click", () => {
        // Always transition from highscore section to welcome page
        transitSections(highscoreSection, welcomePage, TRANSITION_MS);
      });
    }
  }

  console.log("Hello from the highscore room");
}