import * as dataJSON from '../data.json';

export function room2fireFunc() {

/* Hide the welcome page (menu)
   This can be removed when we remove the menu */
const welcomePage: HTMLElement | null = document.querySelector('#welcomePage');
if (welcomePage) {
welcomePage.classList.add('hidden');
}

/* Sets the background for the room and shows room section */
const fireSection: HTMLElement | null = document.querySelector('#room2Fire');
if (fireSection) {
fireSection.style.backgroundImage = `url("${dataJSON.room2fire.backgroundImg}")`;
fireSection.classList.remove('hidden');
}    

console.log('Hello from the fire room');
}