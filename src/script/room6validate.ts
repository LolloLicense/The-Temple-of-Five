import * as dataJSON from '../data.json';

export function room6finalFunc() {
/* Hide the welcome page (menu)
   This can be removed when we remove the menu */
const welcomePage: HTMLElement | null = document.querySelector('#welcomePage');
if (welcomePage) {
welcomePage.classList.add('hidden');
}

/* Sets the background for the room and shows room section */
const finalSection: HTMLElement | null = document.querySelector('#finalRoom');
if (finalSection) {
finalSection.style.backgroundImage = `url("${dataJSON.room6validate.backgroundImg}")`;
finalSection.classList.remove('hidden');
} 

console.log('Hello from the final room');
}