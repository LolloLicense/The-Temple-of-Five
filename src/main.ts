import "./sass/style.scss";

import { initAudio, initSoundToggle } from "./audio";
import { room1woodFunc } from "./rooms/1wood/room1wood.ts";
import { room2fireFunc } from "./rooms/2fire/room2fire.ts";
import { room3earthFunc } from "./rooms/3earth/room3earth.ts";
import { room4metalFunc } from "./rooms/4metal/room4metal.ts";
import { room5waterFunc } from "./rooms/5water/room5water.ts";
import { room6finalFunc } from "./rooms/final/room6validate.ts";
import { gameOverRoomFunc } from "./rooms/gameConclusion/gameOverRoom.ts";
import { gameWinFunc } from "./rooms/gameConclusion/gameWin.ts";
import { highscoreRoomFunc } from "./rooms/highscore/highscore.ts";
import { aboutTabs, initAboutDialog } from "./script/helper/aboutDialog.ts";
// backpack artifacts
import { initBackpackToggle } from "./script/helper/artifacts";
// Pogo-sticks cheat DEV
import { initDevCheats } from "./script/helper/devCheats.ts";
// Exit dialog
import { initExitDialog } from "./script/helper/exitDialog";
// LOGIN
import { initLoginFlow } from "./script/helper/loginFlow";
//resetBTNs
import { initResetButtons } from "./script/helper/reset";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer } from "./script/helper/utils.ts";

import { goToSection } from "./script/helper/transitions.ts";

/* Event listeners for temporary menu
(Remove when menu is to be removed) */
const woodRoomBtn: HTMLElement | null = document.querySelector("#woodRoomBtn");
if (woodRoomBtn) {
  woodRoomBtn.addEventListener("click", room1woodFunc);
}

// FIRE
const fireRoomBtn: HTMLElement | null = document.querySelector("#fireRoomBtn");

if (fireRoomBtn) {
  fireRoomBtn.addEventListener("click", () => {
    room2fireFunc();

    const fireSection = document.querySelector<HTMLElement>("#room2Fire");
    if (!fireSection) return;

    goToSection(fireSection, 1200);
  });
}

//  EARTH
const earthRoomBtn: HTMLElement | null =
  document.querySelector("#earthRoomBtn");

if (earthRoomBtn) {
  earthRoomBtn.addEventListener("click", () => {
    // 1. Build the room first
    room3earthFunc();

    // 2. Then show it from the welcome/test menu
    const earthSection = document.querySelector<HTMLElement>("#room3Earth");
    if (!earthSection) return;

    goToSection(earthSection, 1200);
  });
}

// Metal

const metalRoomBtn: HTMLElement | null =
  document.querySelector("#metalRoomBtn");

if (metalRoomBtn) {
  metalRoomBtn.addEventListener("click", () => {
    // 1. Build the metal room first
    room4metalFunc();

    // 2. Then show the section from the welcome/test menu
    const metalSection = document.querySelector<HTMLElement>("#room4Metal");
    if (!metalSection) return;

    goToSection(metalSection, 1200);
  });
}

// Water
const waterRoomBtn: HTMLElement | null =
  document.querySelector("#waterRoomBtn");

if (waterRoomBtn) {
  waterRoomBtn.addEventListener("click", () => {
    // 1. Build the water room first
    room5waterFunc();

    // 2. Then show the section from the welcome/test menu
    const waterSection = document.querySelector<HTMLElement>("#room5Water");
    if (!waterSection) return;

    goToSection(waterSection, 1200);
  });
}

//FINALROOM
const finalRoomBtn: HTMLElement | null =
  document.querySelector("#finalRoomBtn");

if (finalRoomBtn) {
  finalRoomBtn.addEventListener("click", () => {
    // 1. Build the final room first
    room6finalFunc();

    // 2. Then show the section from the welcome/test menu
    const finalSection = document.querySelector<HTMLElement>("#finalRoom");
    if (!finalSection) return;

    goToSection(finalSection, 1200);
  });
}

//GAME OVER
const gameOverRoomBtn: HTMLElement | null =
  document.querySelector("#gameOverBtn");

if (gameOverRoomBtn) {
  gameOverRoomBtn.addEventListener("click", () => {
    // 1. Build the game over room first
    gameOverRoomFunc();

    // 2. Then show the section from the welcome/test menu
    const gameOverSection =
      document.querySelector<HTMLElement>("#gameOverRoom");
    if (!gameOverSection) return;

    goToSection(gameOverSection, 1200);
  });
}

//GAME WIN
const gameWinBtn: HTMLElement | null = document.querySelector("#gameWinBtn");

if (gameWinBtn) {
  gameWinBtn.addEventListener("click", () => {
    // 1. Build the game win room first
    gameWinFunc();

    // 2. Then show the section from the welcome/test menu
    const gameWinSection = document.querySelector<HTMLElement>("#gameWinRoom");
    if (!gameWinSection) return;

    goToSection(gameWinSection, 1200);
  });
}

//HIGHSCORE
const highScoreBtn: HTMLElement | null =
  document.querySelector("#openHighScoreBtn");

if (highScoreBtn) {
  highScoreBtn.addEventListener("click", () => {
    // 1. Build the highscore room first
    highscoreRoomFunc();

    // 2. Then show the section from the welcome/test menu
    const highscoreSection =
      document.querySelector<HTMLElement>("#highscoreRoom");
    if (!highscoreSection) return;

    goToSection(highscoreSection, 1200);
  });
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
initResetButtons();
initDevCheats();
