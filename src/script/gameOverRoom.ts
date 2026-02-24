import * as dataJSON from "../data.json";
import { playBgm } from "../audio";

export function gameOverRoomFunc() {
  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }
  // bgm music
  const bgmId = dataJSON.gameOverRoom.bgmId;
  if (bgmId) {
    void playBgm(bgmId, 650); // play the background music for the wood room, with a fade-in duration of 650ms
  }

  /* Sets the background for the room and shows room section */
  const gameOverSection: HTMLElement | null = document.querySelector("#gameOverRoom");
  if (gameOverSection) {
    gameOverSection.style.backgroundImage = `url("${dataJSON.gameOverRoom.backgroundImg}")`;
    gameOverSection.classList.remove("hidden");
  }

  console.log("Hello from the gameOver room");
}