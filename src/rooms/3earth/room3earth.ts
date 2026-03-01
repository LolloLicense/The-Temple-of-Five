import * as dataJSON from "../../data.json";
//import { startTimer, stopTimer } from "./script/utils.ts";
import { startTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { showGameHeader } from "../../script/helper/gameHeader.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import {getCurrentPage, showSection, transitSections } from "../../script/helper/transitions.ts";
import { playBgm, playSfx } from "../../audio/index.ts";


const slateNumbersArray:number[] = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
let timerCheckInterval: number;

export function room3earthFunc() {

  /* Sets the background for the room and shows room section */
  const earthSection: HTMLElement | null =
    document.querySelector("#room3Earth");
 
    if (earthSection) {
    // Sets the background image from data.JSON
    earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;
    // Renders the room description from data.JSON
    renderRoomDesc(earthSection, dataJSON.room3earth.desc);
    // Find the current visible page BEFORE switching
   const fromPage =
    getCurrentPage() ??
    document.querySelector<HTMLElement>("main > section.page.isVisible");

  if (fromPage && fromPage !== earthSection) {
    // Fade from current page -> wood room
    transitSections(fromPage, earthSection, 1200);
  } else {
    // Fallback (first load): just show the room
    showSection(earthSection);
  }
} // IF earthSection END

timerCheckInterval = setInterval(timerCheck, 1000);
startTimer(3); // Start timer for room 3
showGameHeader(); // Show game header

  console.log("Hello from the earth room");

  audioHandler ('bgm');
  audioHandler ('click');
  audioHandler ('shortSlide');
  audioHandler ('midSlide');
  audioHandler ('midSlide2');
  audioHandler ('longSlide');

  const gameDiv: HTMLElement | null = document.querySelector("#gameDiv");
  if (gameDiv) {

  const generateVisualGrid = (containerId: string, size: number = 4): void => {
    const container = document.getElementById(containerId);
    let count:number = 1 // Count for slates
    if (!container) return;
    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("div"); // Create a div for the slate
      cell.classList.add("slate"); // Add generic slate class for CSS
      cell.classList.add(`slate${count}`); // Add specific slate class for CSS
      cell.classList.add(`c${Math.floor(i / size)}${i % size}`); // Add initial coordinates class for slate.
      /* Pick one entry in array remove it and print it as cell text */
      cell.textContent = getFromArray(slateNumbersArray) as unknown as string; 
      container.appendChild(cell); // Add div to DOM
      count++ // Count goes upp
    }
  };
  generateVisualGrid("gameDiv");

  const slates = document.querySelectorAll('.slate');
  for (let i=0; i < slates.length; i++) {
    slates[i].addEventListener('click',  () => { slateClick(slates[i],i + 1) } );
    //console.log(slates[i].textContent);
  }

  } // IF gameDiv

} // room3earthFunc END

function slateClick (slate:Element | null, count:number):void {
console.log(`Slate ${count} was clicked!`);

const currentSlate = document.querySelector(`.slate${count}`);
const slateNumber:number = count;
const emptySlate = document.querySelector('.slate16');

if (slate?.classList[2] === emptySlate?.classList[2]) {
  console.log('LavaSlate was clicked');
}

if (emptySlate && currentSlate) {
const lavaX:number =  parseInt(emptySlate?.classList[2].substring(1,2));
const lavaY:number = parseInt(emptySlate?.classList[2].substring(2));

const currX:number =  parseInt(currentSlate?.classList[2].substring(1,2));
const currY:number = parseInt(currentSlate?.classList[2].substring(2));

const lavaPos:[x:number,y:number] = [lavaX,lavaY];
const currentPos:[x:number,y:number] = [currX,currY];

moveSlate(slateNumber, currentPos, lavaPos);
}

} // slateClick END

function moveSlate (slateNumber:number, currentPos:[x:number,y:number] , lavaPos:[x:number,y:number]):void {

  //console.log(`currentPos: ${currentPos}`);
  //console.log(`lavaPos: ${lavaPos}`);

  const directions:[x:number,y:number][] = [
    [ 0,1 ], [ 0,-1 ], // Vertical
    [ 1,0 ], [ -1,0 ] // Horizontal
  ];

for (let i=0; i < directions.length; i++ ) {
const [currX, currY] = currentPos;
const [directX, directY] = directions[i];

const dirX:number = currX + directX;
const dirY:number = currY + directY;

const dirPoint:[x:number,y:number] = [dirX,dirY];

  if (matchTuples(dirPoint,lavaPos)) {
    console.log('VALID SLATE!');

    const slateToMove = document.querySelector(`.slate${slateNumber}`);
    const lavaSlate = document.querySelector(`.slate16`);

    console.log(slateToMove);
    console.log(slateToMove?.classList[2]);
   
    console.log(lavaSlate);
    console.log(lavaSlate?.classList[2]);

    const oldSlateCord:string = slateToMove?.classList[2] as unknown as string;
    const newSlateCord:string = lavaSlate?.classList[2] as unknown as string;

    slateToMove?.classList.remove(oldSlateCord);
    slateToMove?.classList.add(newSlateCord);
    lavaSlate?.classList.remove(newSlateCord);
    lavaSlate?.classList.add(oldSlateCord);

  } // IF MATCHED END

} // Loop END


} //moveSlate END

function matchTuples(expected:[number,number],actual:[number,number]): boolean {
    return expected[0] === actual[0] && expected[1] === actual[1];
}

function timerCheck():void {
  if (TimeIsUp) {
console.log('Time has now expired!');
clearInterval(timerCheckInterval) //TODO END ROOM WITH FAIL AND TRANSITION
  }
}

function getFromArray(arr: number[]): number {
    // Generate random index based on current array length
    const randomIndex = Math.floor(Math.random() * arr.length);
    // Remove element at that index and capture it
    const [removedNumber] = arr.splice(randomIndex, 1);
    // Return the removed number
    return removedNumber;
}

function audioHandler (audio:string):void {
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

} // Audio Handler END