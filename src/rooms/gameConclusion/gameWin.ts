import * as dataJSON from "../../data.json";
import { hideGameHeader } from "../../script/helper/gameHeader.ts";

export function gameWinFunc(): void {
  const gameWinSection = document.querySelector<HTMLElement>("#gameWinRoom");
  if (!gameWinSection) return;

  // hide gameheader
  hideGameHeader();
  // Set background image
  gameWinSection.style.backgroundImage = `url("${dataJSON.gameWinRoom.backgroundImg}")`;

  // Restart animation every time we enter the room
  gameWinSection.classList.remove("is-animating");
  void gameWinSection.offsetWidth;
  gameWinSection.classList.add("is-animating");

  console.log("Hello from the gameWin room");
}
