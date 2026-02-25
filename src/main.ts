import "./sass/style.scss";
import * as dataJSON from "./data.json";
import { room1woodFunc } from "./rooms/1wood/room1wood.ts";
import { room2fireFunc } from "./rooms/2fire/room2fire.ts";
import { room3earthFunc } from "./rooms/3earth/room3earth.ts";
import { room4metalFunc } from "./rooms/4metal/room4metal.ts";
import { room5waterFunc } from "./rooms/5water/room5water.ts";
import { room6finalFunc } from "./rooms/final/room6validate.ts";
import { gameOverRoomFunc } from "./rooms/gameover/gameOverRoom.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "./script/helper/utils.ts";

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
const gameOverRoomBtn: HTMLElement | null =
  document.querySelector("#gameOverRoomBtn");
if (gameOverRoomBtn) {
  gameOverRoomBtn.addEventListener("click", gameOverRoomFunc);
}

import { initAudio, initSoundToggle } from "./audio";
import { aboutTabs, initAboutDialog } from "./script/helper/aboutDialog.ts";

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

// Just nu finns bara toggle, Behövs ytterligare funktion för att lägga till artifakterna i ryggsäcken och visa dem. Ska finnas 2 för varje rum, en rätt och en fel. Samt en tom placeholder.
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
