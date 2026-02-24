import * as dataJSON from "../data.json";

export function gameOverRoomFunc() {
  /* Hide the welcome page (menu)
   This can be removed when we remove the menu */
  const welcomePage: HTMLElement | null =
    document.querySelector("#welcomePage");
  if (welcomePage) {
    welcomePage.classList.add("hidden");
  }

  /* Sets the background for the room and shows room section */
  const gameOverSection: HTMLElement | null = document.querySelector("#gameOverRoom");
  if (gameOverSection) {
    gameOverSection.style.backgroundImage = `url("${dataJSON.gameOverRoom.backgroundImg}")`;
    gameOverSection.classList.remove("hidden");
  }

  console.log("Hello from the gameOver room");
}