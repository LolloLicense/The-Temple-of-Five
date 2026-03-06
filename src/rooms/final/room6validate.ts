import * as dataJSON from "../../data.json";
import { playBgm /*, playSfx*/ } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
// import {
//   showSection,
//   getCurrentPage,
//   transitSections,
// } from "../../script/helper/transitions.ts";

export function room6finalFunc(): void {
  const finalSection = document.querySelector<HTMLElement>("#finalRoom");
  if (!finalSection) return;

  // INGEN showSection / INGEN transit här
  // finalSection är redan synlig efter goToNextRoom

  //----------------------------------------------------------
  // 1) Städa bort welcomePage (om den kan råka ligga kvar)
  //----------------------------------------------------------
  const welcomePage = document.querySelector<HTMLElement>("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;

  startTimer(6);
  showGameHeader();
  renderRoomDesc(finalSection, dataJSON.room6validate.desc);

  const bgmId = dataJSON.room6validate.bgmId;
  if (bgmId) void playBgm(bgmId, 650);
}
