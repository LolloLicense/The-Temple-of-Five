import "./sass/style.scss";
import * as dataJSON from './data.json';
import { startTimer, stopTimer } from "./script/utils.ts";

import { room1woodFunc } from './script/room1wood.ts';
import { room2fireFunc } from './script/room2fire.ts';
import { room3earthFunc } from './script/room3earth.ts';
import { room4metalFunc } from './script/room4metal.ts';
import { room5waterFunc } from './script/room5water.ts';
import { room6finalFunc } from './script/room6validate.ts';


/* Event listeners for temporary menu
(Remove when menu is to be removed) */
const woodRoomBtn: HTMLElement | null = document.querySelector('#woodRoomBtn');
if (woodRoomBtn) {
  woodRoomBtn.addEventListener('click', room1woodFunc);
}

const fireRoomBtn: HTMLElement | null = document.querySelector('#fireRoomBtn');
if (fireRoomBtn) {
  fireRoomBtn.addEventListener('click', room2fireFunc);
}

const earthRoomBtn: HTMLElement | null = document.querySelector('#earthRoomBtn');
if (earthRoomBtn) {
  earthRoomBtn.addEventListener('click', room3earthFunc);
}

const metalRoomBtn: HTMLElement | null = document.querySelector('#metalRoomBtn');
if (metalRoomBtn) {
  metalRoomBtn.addEventListener('click', room4metalFunc);
}

const waterRoomBtn: HTMLElement | null = document.querySelector('#waterRoomBtn');
if (waterRoomBtn) {
  waterRoomBtn.addEventListener('click', room5waterFunc);
}

const finalRoomBtn: HTMLElement | null = document.querySelector('#finalRoomBtn');
if (finalRoomBtn) {
  finalRoomBtn.addEventListener('click', room6finalFunc);
}


/* Test and example of JSON
console.log(dataJSON.menu);
console.log(dataJSON.menu.backgroundImg);
console.log(dataJSON.menu.desc);
*/

import { initAboutDialog, aboutTabs } from "./script/aboutDialog.ts"
import { initAudio, initSoundToggle } from "./audio";


console.log("Running startTimer(1) (room1) in 5 seconds");
setTimeout(function () {
  startTimer(1);
}, 5000);

console.log("Stopping both timers in 65 seconds");
setTimeout(function () {
  stopTimer(0);
  stopTimer(1);
  console.log("Both timers have been stopped");
}, 65000);

/* Used for triggering login on splash screen

document.body.addEventListener('click', showLogin);
document.body.addEventListener('keydown', showLogin);

function showLogin() {
  console.log('Showing login')

}
*/


const welcomeSection: HTMLElement | null = document.querySelector('#welcomePage');
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
  itemDropdown.classList.toggle("hidden");
});


//-----------------------------------------------------------
//-------------------------INITS-----------------------------
//-----------------------------------------------------------


aboutTabs();
initAboutDialog();
initSoundToggle();
initAudio();
startTimer(0);
