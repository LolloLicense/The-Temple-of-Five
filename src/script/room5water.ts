import * as dataJSON from '../data.json';

export function room5waterFunc() {
/* Hide the welcome page (menu)
   This can be removed when we remove the menu */
const welcomePage: HTMLElement | null = document.querySelector('#welcomePage');
if (welcomePage) {
welcomePage.classList.add('hidden');
}

/* Sets the background for the room and shows room section */
const waterSection: HTMLElement | null = document.querySelector('#room5Water');
if (waterSection) {
waterSection.style.backgroundImage = `url("${dataJSON.room5water.backgroundImg}")`;
waterSection.classList.remove('hidden');
}


console.log('Hello from the water room');
}