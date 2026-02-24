import * as dataJSON from "../data.json";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer, TimeIsUp } from "./utils.ts";
import { renderRoomDesc } from "./roomDesc";
import { playBgm, playSfx } from "../audio";




export function room3earthFunc() {

let timerCheckInterval: number;

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

function audioHandler (audio:string) {
const bgmId = dataJSON.room3earth.bgmId;
const sfxId = dataJSON.room3earth.sfxId;
const sfx2Id = dataJSON.room3earth.sfx2Id;
const sfx3Id = dataJSON.room3earth.sfx3Id;
const sfx4Id = dataJSON.room3earth.sfx4Id;
const sfx5Id = dataJSON.room3earth.sfx5Id;

switch (audio) {
case 'bgm':
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the fire room, with a fade-in duration of 650ms
  }
  break;
  case 'click':
  if (sfxId) {
    void playSfx(sfxId); // play the click sound effect
  }
  break;
  case 'shortSlide':
  if (sfx2Id) {
    void playSfx(sfx2Id); // play the shortSlide sound effect
  }
  break;
  case 'midSlide':
  if (sfx3Id) {
    void playSfx(sfx3Id); // play the midSlide sound effect
  }
  break;
  case 'midSlide2':
  if (sfx4Id) {
    void playSfx(sfx4Id); // play the midSlide2 sound effect
  }
  break;
  case 'longSlide':
  if (sfx5Id) {
    void playSfx(sfx5Id); // play the longSlide sound effect
  }
  break;
}

}