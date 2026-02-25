import * as dataJSON from "../../data.json";
import { playBgm } from "../../audio/index.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "../../script/helper/utils.ts";

export function room4metalFunc() {
   startTimer(4); // Starta timer for room 4

  /* Gömmer välkomst sidan, kan tas bort senare*/
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  //-------------------------------------------------------------------------------------------------------------------------------------
  //---------------------------------------------------------------- Ljud ---------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  // Spela bakgrundsmusiken för metallrummet
  const bgmId = dataJSON.room4metal.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // Spela bakgrundsmusiken för metallrummet med fade in på 650ms
  }
  //-------------------------------------------------------------------------------------------------------------------------------------
  //-------------------------------------------------------------- Dom setup ------------------------------------------------------------
  //-------------------------------------------------------------------------------------------------------------------------------------
  const metalSection: HTMLElement | null = document.querySelector("#room4Metal"); // Hämtar sektionen för metallrummet
  if (!metalSection) { // Om den inte finns, avbryt funktionen för att undvika fel
   return;
  }

  metalSection.style.backgroundImage = `url("${dataJSON.room4metal.backgroundImg}")`; // Sätter bakgrundsbilden för metallrummet från JSON-data
  metalSection.classList.remove("hidden"); // Visar rummet, tar bort .hidden klassen

  renderRoomDesc(metalSection, dataJSON.room4metal.desc);  // Renderar rummets beskrivning från JSON -> <div id="roomdesc">

  console.log("Hello from the metal room"); // Loggar ett meddelande i konsolen för att bekräfta att funktionen körs
}
