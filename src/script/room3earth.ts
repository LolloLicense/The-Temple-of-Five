import * as dataJSON from '../data.json';

export function room3earthFunc() {

/* Hide the welcome page (menu)
   This can be removed when we remove the menu */
const welcomePage: HTMLElement | null = document.querySelector('#welcomePage');
if (welcomePage) {
welcomePage.classList.add('hidden');
}

/* Sets the background for the room and shows room section */
const earthSection: HTMLElement | null = document.querySelector('#room3Earth');
if (earthSection) {
earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;
earthSection.classList.remove('hidden');
}    

console.log('Hello from the earth room');
}