import * as dataJSON from '../data.json';

export function room1woodFunc() {

/* Hide the welcome page (menu)
   This can be removed when we remove the menu */
const welcomePage: HTMLElement | null = document.querySelector('#welcomePage');
if (welcomePage) {
welcomePage.classList.add('hidden');
}

/* Sets the background for the room and shows room section */
const woodSection: HTMLElement | null = document.querySelector('#room1Wood');
if (woodSection) {
woodSection.style.backgroundImage = `url("${dataJSON.room1wood.backgroundImg}")`;
woodSection.classList.remove('hidden');
}

console.log('Hello from the wood room');
}
