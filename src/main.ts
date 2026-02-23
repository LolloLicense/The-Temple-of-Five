import "./sass/style.scss";
import * as dataJSON from "./data.json";
import { room1woodFunc } from "./script/room1wood.ts";
import { room2fireFunc } from "./script/room2fire.ts";
import { room3earthFunc } from "./script/room3earth.ts";
import { room4metalFunc } from "./script/room4metal.ts";
import { room5waterFunc } from "./script/room5water.ts";
import { room6finalFunc } from "./script/room6validate.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "./script/utils.ts";

/* Event listeners for temporary menu
(Remove when menu is to be removed) */
const woodRoomBtn: HTMLElement | null = document.querySelector("#woodRoomBtn");
if (woodRoomBtn) {
  woodRoomBtn.addEventListener("click", room1woodFunc);
}

const fireRoomBtn: HTMLElement | null = document.querySelector("#fireRoomBtn");
if (fireRoomBtn) {
  fireRoomBtn.addEventListener("click", room2fireFunc);
}

const earthRoomBtn: HTMLElement | null =
  document.querySelector("#earthRoomBtn");
if (earthRoomBtn) {
  earthRoomBtn.addEventListener("click", room3earthFunc);
}

const metalRoomBtn: HTMLElement | null =
  document.querySelector("#metalRoomBtn");
if (metalRoomBtn) {
  metalRoomBtn.addEventListener("click", room4metalFunc);
}

const waterRoomBtn: HTMLElement | null =
  document.querySelector("#waterRoomBtn");
if (waterRoomBtn) {
  waterRoomBtn.addEventListener("click", room5waterFunc);
}

const finalRoomBtn: HTMLElement | null =
  document.querySelector("#finalRoomBtn");
if (finalRoomBtn) {
  finalRoomBtn.addEventListener("click", room6finalFunc);
}

import { initAudio, initSoundToggle } from "./audio";
import { aboutTabs, initAboutDialog } from "./script/aboutDialog.ts";

/* Used for triggering login on splash screen

document.body.addEventListener('click', showLogin);
document.body.addEventListener('keydown', showLogin);

function showLogin() {
  console.log('Showing login')

}
*/

const welcomeSection: HTMLElement | null =
  document.querySelector("#welcomePage");
if (welcomeSection) {
  welcomeSection.style.backgroundImage = `url("${dataJSON.menu.backgroundImg}")`;
}

//-----------------------------------------------------------
//-------------------------Backpack toggle-------------------
//-----------------------------------------------------------

// Bara toggle just nu kolla vidare imorgon
const itemListBtn = document.getElementById("itemListBtn")!;
const itemDropdown = document.getElementById("itemDropdown")!;

itemListBtn.addEventListener("click", (event) => {
  event.stopPropagation();
  itemDropdown.classList.toggle("is-open");
});

//-----------------------------------------------------------
//-------------------------INITS-----------------------------
//-----------------------------------------------------------

aboutTabs();
initAboutDialog();
initSoundToggle();
initAudio();
startTimer(0);
