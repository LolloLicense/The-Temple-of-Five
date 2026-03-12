import { playBgm, playSfx } from "../../audio/index.ts";
import * as dataJSON from "../../data.json";
import {
  hideGameHeader,
  showGameHeader,
} from "../../script/helper/gameHeader.ts";
import { updateProgressBar } from "../../script/helper/progressbar.ts";
import { renderRoomDesc } from "../../script/helper/roomDesc.ts";
import { showMsg } from "../../script/helper/showMsg.ts";
import {
  clearReplayMode,
  getReplayRoom,
  isReplayMode,
  setRoomResult,
} from "../../script/helper/storage.ts";
import {
  getCurrentPage,
  goToSection,
} from "../../script/helper/transitions.ts";
import { startTimer, stopTimer, TimeIsUp } from "../../script/helper/utils.ts";
import { room4metalFunc } from "../4metal/room4metal.ts";
import { gameOverRoomFunc } from "../gameConclusion/gameOverRoom.ts";

let moves: number = 0;
const slateNumbersArray: number[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
];
let timerCheckInterval: number;
const correctSlatesArr: number[] = [];
let moving: boolean = false; // Flag to prevent multiple moves at once

// Keep track of the active Earth keydown handler so we can remove it on re-enter
let earthKeydownHandler: ((event: KeyboardEvent) => void) | null = null;

// Guard so old Earth logic cannot keep reacting after the player has left the room
let earthIsActive = false;

// REPLAY MODE
function shouldReturnToGameOver(): boolean {
  return isReplayMode() && getReplayRoom() === "earth";
}

/**
 * Cleanup only Earth-specific side effects.
 * We do not touch puzzle logic here, only listeners / intervals owned by Earth.
 */

export function cleanupEarthRoom(): void {
  clearInterval(timerCheckInterval);

  if (earthKeydownHandler) {
    document.body.removeEventListener("keydown", earthKeydownHandler);
    earthKeydownHandler = null;
  }

  earthIsActive = false;
}

/**
 * Reset Earth-local state so a fresh visit to the room starts clean.
 * This avoids stale grid/data when the room is entered more than once.
 */
function resetEarthState(): void {
  moves = 0;

  correctSlatesArr.length = 0;

  slateNumbersArray.length = 0;
  slateNumbersArray.push(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);

  const gameDiv = document.querySelector<HTMLElement>("#gameDiv");
  if (gameDiv) {
    gameDiv.innerHTML = "";
  }
}

export function room3earthFunc(): void {
  /* Sets the background for the room and shows room section */
  const earthSection: HTMLElement | null =
    document.querySelector("#room3Earth");

  if (earthSection) {
    // Important:
    // Clean up any previous Earth listeners/intervals before starting again.
    cleanupEarthRoom();
    resetEarthState();
    earthIsActive = true;

    // Let transition helper handle showing / switching to this room
    goToSection(earthSection, 1200);

    // Sets the background image from data.JSON
    earthSection.style.backgroundImage = `url("${dataJSON.room3earth.backgroundImg}")`;

    // Renders the room description from data.JSON
    renderRoomDesc(earthSection, dataJSON.room3earth.desc);

    timerCheckInterval = window.setInterval(timerCheck, 1000);
    startTimer(3); // Start timer for room 3
    showGameHeader(); // Show game header
    audioHandler("bgm");

    const gameDiv: HTMLElement | null = document.querySelector("#gameDiv");
    if (gameDiv) {
      const generateVisualGrid = (
        containerId: string,
        size: number = 4,
      ): void => {
        const container = document.getElementById(containerId);
        let count: number = 1; // Count for slates
        if (!container) return;

        for (let i = 0; i < size * size; i++) {
          const cell = document.createElement("div"); // Create a div for the slate
          cell.classList.add("slate"); // Add generic slate class for CSS
          cell.classList.add(`slate${count}`); // Add specific slate class for CSS
          cell.classList.add(`c${Math.floor(i / size)}${i % size}`); // Add initial coordinates class for slate.
          /* Pick one entry in array remove it and print it as cell text */
          cell.textContent = getFromArray(
            slateNumbersArray,
          ) as unknown as string;
          container.appendChild(cell); // Add div to DOM
          count++; // Count goes upp
        }
      };

      generateVisualGrid("gameDiv");

      const slates: NodeListOf<HTMLElement> =
        document.querySelectorAll<HTMLElement>(".slate");

      for (let i = 0; i < slates.length; i++) {
        slates[i].addEventListener("click", () => {
          slateClick(slates[i], i + 1);
        });
      }

      // Store handler reference so we can remove it on room re-enter / leave
      earthKeydownHandler = (event: KeyboardEvent): void => {
        event.preventDefault();
        keyPressHandler(event);
      };

      // Listen for key presses and call the handler, prevent default to avoid scrolling with arrow keys
      document.body.addEventListener("keydown", earthKeydownHandler);
    } // IF gameDiv END
  } // IF earthSection END
} // room3earthFunc END

function slateClick(_slate: HTMLElement | null, count: number): void {
  // Ignore old clicks if Earth is no longer the active room
  if (!earthIsActive) return;

  const currentSlate = document.querySelector(`.slate${count}`);
  const slateNumber: number = count;
  const emptySlate = document.querySelector(".slate16");

  if (emptySlate && currentSlate) {
    const lavaX: number = parseInt(emptySlate?.classList[2].substring(1, 2));
    const lavaY: number = parseInt(emptySlate?.classList[2].substring(2));

    const currX: number = parseInt(currentSlate?.classList[2].substring(1, 2));
    const currY: number = parseInt(currentSlate?.classList[2].substring(2));

    const lavaPos: [x: number, y: number] = [lavaX, lavaY];
    const currentPos: [x: number, y: number] = [currX, currY];

    moveSlate(slateNumber, currentPos, lavaPos);
  }
} // slateClick END

function keyPressHandler(event: KeyboardEvent): void {
  // Ignore keyboard control if Earth is no longer the active room
  if (!earthIsActive) return;

  const key = event.key;
  const emptySlate = document.querySelector(".slate16");

  if (emptySlate) {
    const lavaX: number = parseInt(emptySlate?.classList[2].substring(1, 2));
    const lavaY: number = parseInt(emptySlate?.classList[2].substring(2));

    switch (key) {
      case "ArrowUp":
        {
          const dirrX: number = lavaX - 1;
          const dirrY: number = lavaY + 0;
          const clickSlate: HTMLElement | null = document.querySelector(
            `.c${dirrX}${dirrY}`,
          );
          if (!moving) {
            moving = true;
            clickSlate?.click();
            setTimeout(() => {
              // Wait for animation to finish before allowing another key press to prevent move skipping
              moving = false;
            }, 750);
          } // IF !moving END
        }
        break;

      case "ArrowDown":
        {
          const dirrX: number = lavaX + 1;
          const dirrY: number = lavaY + 0;
          const clickSlate: HTMLElement | null = document.querySelector(
            `.c${dirrX}${dirrY}`,
          );
          if (!moving) {
            moving = true;
            clickSlate?.click();
            setTimeout(() => {
              moving = false;
              // Wait for animation to finish before allowing another key press to prevent move skipping
            }, 750);
          } // IF !moving END
        }
        break;

      case "ArrowLeft":
        {
          const dirrX: number = lavaX + 0;
          const dirrY: number = lavaY - 1;
          const clickSlate: HTMLElement | null = document.querySelector(
            `.c${dirrX}${dirrY}`,
          );
          if (!moving) {
            moving = true;
            clickSlate?.click();
            setTimeout(() => {
              moving = false;
              // Wait for animation to finish before allowing another key press to prevent move skipping
            }, 750);
          } // IF !moving END
        }
        break;

      case "ArrowRight":
        {
          const dirrX: number = lavaX + 0;
          const dirrY: number = lavaY + 1;
          const clickSlate: HTMLElement | null = document.querySelector(
            `.c${dirrX}${dirrY}`,
          );
          if (!moving) {
            moving = true;
            clickSlate?.click();
            setTimeout(() => {
              moving = false;
              // Wait for animation to finish before allowing another key press to prevent move skipping
            }, 750);
          } // IF !moving END
        }
        break;
    } // Switch END
  } // IF emptySlate END
} // keyPressHandler END

function moveSlate(
  slateNumber: number,
  currentPos: [x: number, y: number],
  lavaPos: [x: number, y: number],
): void {
  // Do not continue if Earth has already been left/completed
  if (!earthIsActive) return;

  const directions: [x: number, y: number][] = [
    [0, 1],
    [0, -1], // Vertical
    [1, 0],
    [-1, 0], // Horizontal
  ];

  for (let i = 0; i < directions.length; i++) {
    const [currX, currY] = currentPos;
    const [directX, directY] = directions[i];

    const dirX: number = currX + directX;
    const dirY: number = currY + directY;

    const dirPoint: [x: number, y: number] = [dirX, dirY];

    if (matchTuples(dirPoint, lavaPos)) {
      moves++;
      animateMove(currentPos, dirPoint);

      if (getRandomInt(1, 2) === 1) {
        audioHandler("midSlide");
      } else {
        audioHandler("midSlide2");
      }

      window.setTimeout(() => {
        // Wait for animation to finish
        if (!earthIsActive) return;

        const slateToMove: HTMLElement | null = document.querySelector(
          `.slate${slateNumber}`,
        );
        const lavaSlate: HTMLElement | null =
          document.querySelector(`.slate16`);

        const oldSlateCord: string = slateToMove
          ?.classList[2] as unknown as string;
        const newSlateCord: string = lavaSlate
          ?.classList[2] as unknown as string;

        slateToMove?.classList.remove(oldSlateCord);
        slateToMove?.classList.add(newSlateCord);
        lavaSlate?.classList.remove(newSlateCord);
        lavaSlate?.classList.add(oldSlateCord);

        checkSlateLock(slateToMove);
      }, 750); // setTimeout END (Wait for animation)
    } // IF MATCHED END
  } // Directions Loop END
} // moveSlate END

function animateMove(
  currentPos: [x: number, y: number],
  direction: [x: number, y: number],
): void {
  let currentPosString: string = currentPos.toString();
  currentPosString = currentPosString.replace(",", "");

  let directionString: string = direction.toString();
  directionString = directionString.replace(",", "");

  const currentSlate: HTMLElement | null = document.querySelector(
    `.c${currentPosString}`,
  );
  const toSlate: HTMLElement | null = document.querySelector(
    `.c${directionString}`,
  );

  const currentRect = currentSlate?.getBoundingClientRect();
  const toRect = toSlate?.getBoundingClientRect();

  if (currentRect && toRect) {
    const topCalc: number = toRect.top - currentRect.top;
    const leftCalc: number = toRect.left - currentRect.left;

    if (currentSlate && topCalc === 0) {
      currentSlate.style.transition = `transform 750ms`;
      currentSlate.style.transform = `translateX(${leftCalc.toString()}px)`;

      window.setTimeout(() => {
        currentSlate.style.transition = ``;
        currentSlate.style.transform = ``;
      }, 750); // Reset transition and transform after animation has finished
    } else if (currentSlate && leftCalc === 0) {
      currentSlate.style.transition = `transform 750ms`;
      currentSlate.style.transform = `translateY(${topCalc.toString()}px)`;

      window.setTimeout(() => {
        currentSlate.style.transition = ``;
        currentSlate.style.transform = ``;
      }, 750); // Reset transition and transform after animation has finished
    }
  }
} // animateMove END

function matchTuples(
  expected: [number, number],
  actual: [number, number],
): boolean {
  return expected[0] === actual[0] && expected[1] === actual[1];
} // matchTuples END

function checkSlateLock(movedSlate: HTMLElement | null): void {
  const cord: string = movedSlate?.classList[2] as unknown as string;
  const slateText: string = movedSlate?.textContent as unknown as string;

  switch (cord) {
    case "c00":
      checkTextContent(slateText, 1);
      break;
    case "c01":
      checkTextContent(slateText, 2);
      break;
    case "c02":
      checkTextContent(slateText, 3);
      break;
    case "c03":
      checkTextContent(slateText, 4);
      break;
    case "c10":
      checkTextContent(slateText, 5);
      break;
    case "c11":
      checkTextContent(slateText, 6);
      break;
    case "c12":
      checkTextContent(slateText, 7);
      break;
    case "c13":
      checkTextContent(slateText, 8);
      break;
    case "c20":
      checkTextContent(slateText, 9);
      break;
    case "c21":
      checkTextContent(slateText, 10);
      break;
    case "c22":
      checkTextContent(slateText, 11);
      break;
    case "c23":
      checkTextContent(slateText, 12);
      break;
    case "c30":
      checkTextContent(slateText, 13);
      break;
    case "c31":
      checkTextContent(slateText, 14);
      break;
    case "c32":
      checkTextContent(slateText, 15);
      break;
  } // Switch END

  if (correctSlatesArr.length === 15) {
    winner();
  } // IF win END
} // checkSlateLock END

function winner(): void {
  // Mark Earth inactive immediately so old callbacks cannot fire after win
  earthIsActive = false;
  clearInterval(timerCheckInterval); // Stop monitoring if time is up

  if (earthKeydownHandler) {
    document.body.removeEventListener("keydown", earthKeydownHandler);
    earthKeydownHandler = null;
  }

  audioHandler("longSlide");

  const lavaSlate: HTMLElement | null = document.querySelector(".slate16");
  if (lavaSlate) {
    lavaSlate.classList.add("end");
    lavaSlate.style.opacity = "1";

    window.setTimeout(() => {
      lavaSlate.style.filter = "grayscale(100%)";
      lavaSlate.innerHTML = `<img id="lavaImg" src="${dataJSON.room3earth.desc.trueSign}"/>`;

      const lavaImg: HTMLElement | null = document.querySelector("#lavaImg");
      if (lavaImg) {
        lavaImg.style.opacity = "1";
      }
    }, 1000);

    window.setTimeout(() => {
      hideGameHeader();
      showMsg("Well done — next chamber awaits", 1200 * 2);

      if (shouldReturnToGameOver()) {
        clearReplayMode();
        goToNextRoom("#gameOverRoom", gameOverRoomFunc);
        return;
      }

      goToNextRoom("#room4Metal", room4metalFunc);
    }, 1200);
  } // IF lavaSlate END

  setRoomResult("earth", {
    status: "completed",
    artifact: "true",
    mistakes: moves,
    score: 0, // TODO: define rule later
    roomTimeSec: 0, // Set by stopTimer function
  });

  stopTimer(3);
  updateProgressBar();
} // winner END

function looser(): void {
  // Prevent duplicate lose triggers from old Earth watchers
  if (!earthIsActive) return;

  earthIsActive = false;
  clearInterval(timerCheckInterval);

  if (earthKeydownHandler) {
    document.body.removeEventListener("keydown", earthKeydownHandler);
    earthKeydownHandler = null;
  }

  audioHandler("longSlide");

  const lavaSlate: HTMLElement | null = document.querySelector(".slate16");
  if (lavaSlate) {
    lavaSlate.classList.add("end");
    lavaSlate.style.opacity = "1";

    window.setTimeout(() => {
      lavaSlate.style.filter = "grayscale(100%)";
      lavaSlate.innerHTML = `<img id="lavaImg" src="${dataJSON.room3earth.desc.falseSign}"/>`;

      const lavaImg: HTMLElement | null = document.querySelector("#lavaImg");
      if (lavaImg) {
        lavaImg.style.opacity = "1";
      }
    }, 1000);

    window.setTimeout(() => {
      hideGameHeader();
      showMsg("Time's up — next chamber awaits", 1200 * 2);

      if (shouldReturnToGameOver()) {
        clearReplayMode();
        goToNextRoom("#gameOverRoom", gameOverRoomFunc);
        return;
      }

      goToNextRoom("#room4Metal", room4metalFunc);
    }, 1200);
  } // IF lavaSlate END

  setRoomResult("earth", {
    status: "completed",
    artifact: "false",
    mistakes: moves,
    score: 0, // TODO: define rule later
    roomTimeSec: 0, // Set in stop timer function
  });

  stopTimer(3);
} // looser END

function checkTextContent(textContent: string, target: number): void {
  const slateIndex: number = correctSlatesArr.indexOf(target);

  if (textContent === target.toString()) {
    audioHandler("click");

    if (slateIndex === -1) {
      correctSlatesArr.push(target);
    }
  } else if (textContent !== target.toString()) {
    if (slateIndex !== -1) {
      correctSlatesArr.splice(slateIndex, 1);
    }
  }
} // checkTextContent END

function timerCheck(): void {
  const earthSection = document.querySelector<HTMLElement>("#room3Earth");
  const currentPage = getCurrentPage();

  // Ignore timer checks if Earth is no longer active
  if (!earthIsActive) return;

  // Ignore timer checks if the room section cannot be found
  if (!earthSection) return;

  // Ignore timer checks if player has already left Earth
  if (currentPage && currentPage !== earthSection) return;

  if (!earthSection.classList.contains("isVisible")) return;

  if (TimeIsUp) {
    clearInterval(timerCheckInterval);
    looser();
  }
} // timerCheck END

function getFromArray(arr: number[]): number {
  // Generate random index based on current array length
  const randomIndex = Math.floor(Math.random() * arr.length);

  // Remove element at that index and capture it
  const [removedNumber] = arr.splice(randomIndex, 1);

  // Return the removed number
  return removedNumber;
} // getFromArray END

function audioHandler(audio: string): void {
  const bgmId = dataJSON.room3earth.bgmId;
  const sfxId = dataJSON.room3earth.sfxId;
  const sfx2Id = dataJSON.room3earth.sfx2Id;
  const sfx3Id = dataJSON.room3earth.sfx3Id;
  const sfx4Id = dataJSON.room3earth.sfx4Id;
  const sfx5Id = dataJSON.room3earth.sfx5Id;

  switch (audio) {
    case "bgm":
      if (bgmId) {
        void playBgm(bgmId, 650); // play the background music for the earth room, with a fade-in duration of 650ms
      }
      break;

    case "click":
      if (sfxId) {
        void playSfx(sfxId); // play the click sound effect
      }
      break;

    case "shortSlide":
      if (sfx2Id) {
        void playSfx(sfx2Id); // play the shortSlide sound effect
      }
      break;

    case "midSlide":
      if (sfx3Id) {
        void playSfx(sfx3Id); // play the midSlide sound effect
      }
      break;

    case "midSlide2":
      if (sfx4Id) {
        void playSfx(sfx4Id); // play the midSlide2 sound effect
      }
      break;

    case "longSlide":
      if (sfx5Id) {
        void playSfx(sfx5Id); // play the longSlide sound effect
      }
      break;
  }
} // Audio Handler END

function getRandomInt(min: number, max: number): number {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);

  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
} // getRandomInt END

function goToNextRoom(nextSelector: string, nextRoomFunc: () => void): void {
  const nextSection = document.querySelector<HTMLElement>(nextSelector);
  if (!nextSection) return;

  goToSection(nextSection, 1200);

  window.setTimeout(() => {
    nextRoomFunc();
  }, 1200);
} // goToNextRoom END
