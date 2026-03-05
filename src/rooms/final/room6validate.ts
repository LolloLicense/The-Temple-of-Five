import * as dataJSON from "../../data.json";
import { playBgm /*, playSfx*/ } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { showSection } from "../../script/helper/transitions.ts";

export function room6finalFunc(): void {
  //----------------------------------------------------------
  //  Hämta final-sektionen
  //----------------------------------------------------------
  const finalSection = document.querySelector<HTMLElement>("#finalRoom");
  if (!finalSection) return;

  //----------------------------------------------------------
  // Sätt bakgrundimgage
  //----------------------------------------------------------
  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;

  showSection(finalSection);

  //----------------------------------------------------------
  //  Starta timer + visa header
  //----------------------------------------------------------
  startTimer(6);
  showGameHeader();

  //----------------------------------------------------------
  // Rendera rummets beskrivning (JSON -> DOM)
  //----------------------------------------------------------
  renderRoomDesc(finalSection, dataJSON.room6validate.desc);

  //----------------------------------------------------------
  // Ljud (valfritt att lägga här eller före showSection)
  //----------------------------------------------------------
  const bgmId = dataJSON.room6validate.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650);
  }

  console.log("Hello from the final room");
}
