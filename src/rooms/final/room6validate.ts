import * as dataJSON from "../../data.json";
import { playBgm/*, playSfx*/ } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { transitSections, getCurrentPage, showSection } from "../../script/helper/transitions.ts";

export function room6finalFunc() {
  /* Gömmer välkomst sidan, kan tas bort senare*/
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Ljud ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------

  const bgmId = dataJSON.room6validate.bgmId; // Spela bakgrundsmusiken för finalrummet
  if (bgmId) {
    void playBgm(bgmId, 650); // Spela bakgrundsmusiken för finalrummet med fade in på 650ms
  }
  /*const sfxId = dataJSON.room6validate.sfxId; // Spela ljud när man lägger en bit på plats?*/


  /* Sets the background for the room and shows room section */
  const finalSection: HTMLElement | null = document.querySelector("#finalRoom");// Hämtar sektionen för finalrummet
  if (!finalSection) { // Om den inte finns, avbryt funktionen för att undvika fel
   return;
  }

  finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;

  const fromPage =
    getCurrentPage() ??
    document.querySelector("main > section.page.isVisible");
  if (fromPage && fromPage !== finalSection) { // Fade from current page -> final room
    transitSections(fromPage, finalSection, 1200);
  } else { // Fallback (first load): just show the room
    showSection(finalSection);
  }

  startTimer(6); // Start timer for room 6
  showGameHeader(); // Visar globala headern i rummet

  renderRoomDesc(finalSection, dataJSON.room6validate.desc);  // Renderar rummets beskrivning från JSON -> <div id="roomdesc">
  console.log("Hello from the final room");

  
}
