import "./sass/style.scss";
import * as dataJSON from './data.json';
import { startTimer, stopTimer } from "./script/utils.ts";
import { room1woodFunc } from './script/room1wood.ts';
import { room2fireFunc } from './script/room2fire.ts';
import { room3earthFunc } from './script/room3earth.ts';
import { room4metalFunc } from './script/room4metal.ts';
import { room5waterFunc } from './script/room5water.ts';
import { room6finalFunc } from './script/room6validate.ts';

/* Test and example of JSON
console.log(dataJSON.menu);
console.log(dataJSON.menu.backgroundImg);
console.log(dataJSON.menu.desc);
*/

import { initAboutDialog, aboutTabs } from "./script/aboutDialog.ts"
import { initSoundToggle } from "./audio/soundToggle";

initSoundToggle();
startTimer(0);

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

// INITS
aboutTabs();
initAboutDialog();
>>>>>>> aecef1e4b1548cdb26404ac08ac0474bc62d8c63
