import "./sass/style.scss";

import { room1woodFunc } from "./rooms/1wood/room1wood.ts";
import { room2fireFunc } from "./rooms/2fire/room2fire.ts";
import { room3earthFunc } from "./rooms/3earth/room3earth.ts";
import { room4metalFunc } from "./rooms/4metal/room4metal.ts";
import { room5waterFunc } from "./rooms/5water/room5water.ts";
import { room6finalFunc } from "./rooms/final/room6validate.ts";
import { gameOverRoomFunc } from "./rooms/gameover/gameOverRoom.ts";
import { initAudio, initSoundToggle } from "./audio";
import { aboutTabs, initAboutDialog } from "./script/helper/aboutDialog.ts";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "./script/helper/utils.ts";
// LOGIN
import { initLoginFlow } from "./script/helper/loginFlow";
// Exit dialog
import { initExitDialog } from "./script/helper/exitDialog";
// backpack artifacts
import { initBackpackToggle } from "./script/helper/artifacts";

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

//-----------------------------------------------------------
//-------------------------INITS-----------------------------
//-----------------------------------------------------------

initBackpackToggle();
initLoginFlow();
initExitDialog();
aboutTabs();
initAboutDialog();
initSoundToggle();
initAudio();
startTimer(0);
