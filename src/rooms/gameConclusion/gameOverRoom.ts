import * as dataJSON from "../../data.json";
import { hideGameHeader } from "../../script/helper/gameHeader.ts";

export function gameOverRoomFunc(): void {
  const gameOverSection = document.querySelector<HTMLElement>("#gameOverRoom");
  if (!gameOverSection) return;

  // hide the header
  hideGameHeader();
  // Reset animation so it can restart every time we enter the room
  gameOverSection.classList.remove("is-animating");

  // Set background image
  gameOverSection.style.backgroundImage = `url("${dataJSON.gameOverRoom.backgroundImg}")`;

  // Restart animation
  requestAnimationFrame(() => {
    gameOverSection.classList.add("is-animating");
  });

  console.log("Hello from the gameOver room");
}
