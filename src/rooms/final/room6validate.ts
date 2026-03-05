import * as dataJSON from "../../data.json";
import { playBgm /*, playSfx*/ } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { showSection } from "../../script/helper/transitions.ts";

export function room6finalFunc(): void {
  //----------------------------------------------------------
  // 1) Städa bort welcomePage (om den kan råka ligga kvar)
  //----------------------------------------------------------
  const welcomePage = document.querySelector<HTMLElement>("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  //----------------------------------------------------------
  // 2) Hämta final-sektionen (måste finnas)
  //----------------------------------------------------------
  const finalSection = document.querySelector<HTMLElement>("#finalRoom");
  if (!finalSection) return;

  //----------------------------------------------------------
  // 3) Sätt bakgrund (så tidigt som möjligt)
  //    Detta minskar risken för "svart blink" om bilden laddar långsamt.
  //----------------------------------------------------------
  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;

  //----------------------------------------------------------
  // 4) IMPORTANT:
  //    Finalrummet gör INTE transitSections här.
  //    Varför? För att rummet INNAN (Water) redan har gjort fade -> final.
  //    Här ser vi bara till att final faktiskt är synlig.
  //----------------------------------------------------------
  showSection(finalSection);

  //----------------------------------------------------------
  // 5) Starta timer + visa header
  //----------------------------------------------------------
  startTimer(6);
  showGameHeader();

  //----------------------------------------------------------
  // 6) Rendera rummets beskrivning (JSON -> DOM)
  //----------------------------------------------------------
  renderRoomDesc(finalSection, dataJSON.room6validate.desc);

  //----------------------------------------------------------
  // 7) Ljud (valfritt att lägga här eller före showSection)
  //----------------------------------------------------------
  const bgmId = dataJSON.room6validate.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650);
  }

  console.log("Hello from the final room");
}
