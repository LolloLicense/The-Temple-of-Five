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
      cell.classList.add(`${Math.floor(i / size)},${i % size}`);
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


const possibleMoves:string[] = ['c2.3', 'c3.2']

const emptySlate = document.querySelector('.slate16');
console.log(emptySlate?.classList[2]);


interface Point { x: number; y: number; }

const getPossibleMoves = (currentPos: Point): Point[] => {
  const directions = [
    { x: 0, y: 1 }, { x: 0, y: -1 }, // Vertical
    { x: 1, y: 0 }, { x: -1, y: 0 }, // Horizontal
  ];

  return directions
    .map(dir => ({
      x: currentPos.x + dir.x,
      y: currentPos.y + dir.y
    }))
    .filter(move => isWithinBounds(move.x, move.y));
};
if (emptySlate) {
const lavaX:number =  parseInt(emptySlate?.classList[2].substring(0,emptySlate?.classList[2].indexOf(',')));
const lavaY:number = parseInt(emptySlate?.classList[2].substring(emptySlate?.classList[2].indexOf(',')+1));
console.log(lavaX);
console.log(lavaY);

const stuff:any = { lavaX,lavaY }
const intPos:Point = stuff;
const directions:Point[] = getPossibleMoves(intPos)
console.log(directions);
}

console.log();

//[[0, 1], [0, -1], [1, 0], [-1, 0]]

if (slate?.classList[2] === emptySlate?.classList[2]) {
  console.log('LavaSlate was clicked');
}


} // slateClick END

const isWithinBounds = (x: number, y: number, size: number = 4): boolean => {
  return x >= 0 && x < size && y >= 0 && y < size;
};

function timerCheck():void {
  if (TimeIsUp) {
console.log('Time has now expired!');
clearInterval(timerCheckInterval)
  }
}

function getFromArray(arr: number[]): number {
    // Generate random index based on current length
    const randomIndex = Math.floor(Math.random() * arr.length);
    // Remove element at index and capture it
    const [removedNumber] = arr.splice(randomIndex, 1);
    // Return removed number
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