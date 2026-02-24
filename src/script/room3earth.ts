import * as dataJSON from "../data.json";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer, TimeIsUp } from "./utils.ts";
import { renderRoomDesc } from "./roomDesc";
import { playBgm, playSfx } from "../audio";

let timerCheckInterval: number;


export function room3earthFunc() {
  startTimer(3); // Start timer for room 3

  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const earthSection: HTMLElement | null =
    document.querySelector("#room3Earth");
 
    if (earthSection) {
    earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;
    earthSection.classList.remove("hidden");
    renderRoomDesc(earthSection, dataJSON.room3earth.desc);
  }

  console.log("Hello from the earth room");

  const bgmId = dataJSON.room3earth.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }


 const sfxId = dataJSON.room3earth.sfxId;
  if (sfxId) {
    void playSfx(sfxId); // play the background music for the fire room, with a fade-in duration of 650ms
  }

  type Cell = number | string | null;
  type Grid = Cell[][];

  const createGrid = (size: number = 4): Grid => {
    return Array.from({ length: size }, () => Array(size).fill("slate"));
  };

  const gameBoard = createGrid(4);
  console.log(gameBoard);

  const gameDiv: HTMLElement | null = document.querySelector("#gameDiv");
  if (gameDiv) {
    /*
for (let i=0; i < gameBoard.length; i++) {
for (let x=0; x < gameBoard[i].length; x++) {

gameDiv.innerHTML = `<div class="gameSlate"></div>`;

   console.log(gameBoard[i][x]);
} // x loop END
} // i loop END
gameDiv.innerHTML = gameDiv.innerHTML + `</div>`;
*/
  } // IF gameDiv

  const generateVisualGrid = (containerId: string, size: number = 4): void => {
    const container = document.getElementById(containerId);

    if (!container) return;
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div");
      cell.classList.add("slate");
      // Optional: Add coordinates or IDs
      cell.textContent = `${Math.floor(i / size)},${i % size}`;

      container.appendChild(cell);
    }
  };

  generateVisualGrid("gameDiv");

timerCheckInterval = setInterval(timerCheck, 1000);

} // room3earthFunc END


function timerCheck():void {
console.log(TimeIsUp);
}
