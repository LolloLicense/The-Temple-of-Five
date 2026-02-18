import "./sass/style.scss";
import { startTimer, stopTimer } from "./script/utils.ts";
import * as dataJSON from '/src/data.json';


console.log(dataJSON.menu);
console.log(dataJSON.menu.backgroundImg);
console.log(dataJSON.menu.desc);

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
welcomeSection.style.backgroundImage = dataJSON.menu.backgroundImg;
}